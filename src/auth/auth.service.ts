import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  HttpException,
  UnauthorizedException,
  ConflictException,
  NotAcceptableException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as argon from "argon2";
import { PrismaService } from "src/prisma/prisma.service";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { JwtPayload_restaurantId } from "../Interfaces";
import {
  CreateOwnerDto,
  EmailDto,
  GetJwtDto,
  SignInDto,
  UserType,
} from "./dto";
import { redisClient, constants, redisConstants } from "../useFullItems";
import type { Response, Request } from "express";
import { MailServiceService } from "src/mail-service/mail-service.service";
import { ResetPasswordDto, ResetPasswordFinal } from "./dto/resetPassword.dto";
import { Manager, Owner } from ".prisma/client";

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly mailService: MailServiceService,
  ) {}

  async verifyemail(email: EmailDto) {
    try {
      const otp = Math.floor(100000 + Math.random() * 900000);

      const response = this.mailService.sendMail(
        email.email,
        `Your signup otp is ${otp} valid for 5 minutes`,
      );

      const redisOTP = redisClient.SET(constants.OTP + email.email, otp, {
        EX: 300,
      });

      await Promise.all([response, redisOTP]);

      return "OK";
    } catch (error) {
      throw error;
    }
  }

  async create(createOwnerDto: CreateOwnerDto) {
    try {
      let otp = await redisClient.GET(constants.OTP + createOwnerDto.email);

      if (!otp || otp !== createOwnerDto.otp)
        throw new ForbiddenException("Invalid OTP");

      await redisClient.DEL(constants.OTP + createOwnerDto.email);

      const hash = await argon.hash(createOwnerDto.password);

      const owner = await this.prisma.owner.create({
        data: {
          email: createOwnerDto.email,
          firstName: createOwnerDto.firstName,
          lastName: createOwnerDto.lastName,
          hash,
          middleName: createOwnerDto.middleName,
        },
      });

      return "OK";
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          throw new ForbiddenException("Credentials taken");
        }
      } else console.log({ error });
    }
  }

  async signin(dto: SignInDto, response: Response) {
    // search in database for match emailid

    let user: Owner | Manager;

    if (dto.userType === "Owner") {
      user = await this.prisma.owner.findUnique({
        where: { email: dto.email },
      });
    } else if (dto.userType === "Manager") {
      user = await this.prisma.manager.findUnique({
        where: { email: dto.email },
      });
    }

    if (!user) throw new ForbiddenException("Invalid Credentials");

    // match password
    const result = await argon.verify(user.hash, dto.password);

    if (!result) throw new ForbiddenException("Invalid Credentials");

    // return jwt

    // const jwt_token = await this.jwt_token({ userId: user.id });

    response.cookie(constants.sessionId, user.id, {
      domain: constants.globalDomain,
      secure: constants.IS_DEVELOPMENT ? false : true,
      signed: true,
      sameSite: "strict",
      httpOnly: true,
      // expires: new Date(
      //   `${currentDateTime.getMonth()} ${currentDateTime.getDate()} ${currentDateTime.getFullYear()} 23:59:55`,
      // ),
    });

    response.cookie(constants.userType, dto.userType, {
      domain: constants.globalDomain,
      secure: constants.IS_DEVELOPMENT ? false : true,
      signed: true,
      sameSite: "strict",
      httpOnly: true,
      // expires: new Date(
      //   `${currentDateTime.getMonth()} ${currentDateTime.getDate()} ${currentDateTime.getFullYear()} 23:59:55`,
      // ),
    });

    //if user have default restro then redirect to main app without asking

    // else redirect to add restro page

    return "OK";
  }

  async getJwt(response: Response, request: Request, dto: GetJwtDto) {
    const sessionId = request.signedCookies[constants.sessionId];
    const userType: UserType = request.signedCookies[constants.userType];


    if (!sessionId) throw new ForbiddenException();

    // if (constants.IS_PRODUCTION) {
    //   response.clearCookie(constants.sessionId);
    //   response.clearCookie(constants.userType);
    // }

    // const userId = await this.prisma.owner.findUnique({
    //   where: { id: sessionId },
    //   select: { id: true },
    // });

    if (userType === "Manager") {
      const restaurantAndManagerDetail =
        await this.prisma.restaurant.findUnique({
          where: {
            id: dto.restaurantId,
          },
          select: {
            manager: {
              where: {
                id: sessionId,
              },
            },
          },
        });
      if (!restaurantAndManagerDetail) throw new ForbiddenException();
      if (sessionId !== restaurantAndManagerDetail.manager[0].id)
        throw new ForbiddenException();

      return this.jwt_token_with_restaurantId({
        userId: restaurantAndManagerDetail.manager[0].id,
        restaurantId: dto.restaurantId,
        userType,
      });
    } else if (userType === "Owner") {
      const restaurant = await this.prisma.restaurant.findUnique({
        where: { id: dto.restaurantId },
        select: { ownerId: true, id: true },
      });

      if (!restaurant) throw new ForbiddenException();
      if (sessionId !== restaurant?.ownerId) throw new ForbiddenException();

      return this.jwt_token_with_restaurantId({
        userId: restaurant.ownerId,
        restaurantId: restaurant.id,
        userType,
      });
    }
  }

  jwt_token_with_restaurantId(payload: JwtPayload_restaurantId) {
    const access_token = this.jwt.sign(payload);
    return {
      access_token,
    };
  }

  jwtDecode(token: string): any {
    return this.jwt.decode(token);
  }

  // async getFoodie(
  //   restaurantId: string,
  //   tableSectionId: string,
  //   tableNumber: number,
  //   request: Request,
  //   response: Response,
  // ) {
  //   // add logic to check geo-location

  //   let tableCurrentSessionId = await redisClient.HGET(
  //     redisConstants.tablesStatusKey(restaurantId),
  //     redisConstants.tableSessionKeyForTablesStatus(
  //       tableSectionId,
  //       tableNumber,
  //     ),
  //   );

  //   const sessionId = request.signedCookies[constants.sessionId];

  //   if (tableCurrentSessionId) {
  //     tableCurrentSessionId = tableCurrentSessionId.split(":")[0];
  //     if (tableCurrentSessionId === sessionId) {
  //       return constants.OK;
  //     } else {
  //       throw new ForbiddenException();
  //     }
  //   }
  //   const randomSessionId = randomUUID();

  //   response.cookie(constants.userType, UserType.FOODIE, {
  //     domain: constants.globalDomain,
  //     secure: true,
  //     signed: true,
  //     sameSite: "strict",
  //     httpOnly: true,
  //     maxAge: 24 * 60 * 60,
  //   });
  //   response.cookie(constants.sessionId, randomSessionId, {
  //     domain: constants.globalDomain,
  //     secure: true,
  //     signed: true,
  //     sameSite: "strict",
  //     httpOnly: true,
  //     maxAge: 24 * 60 * 60,
  //   });

  //   return constants.OK;
  // }

  async resetPasswordInitiate(dto: ResetPasswordDto) {
    const { email, userType } = dto;
    /* Owner Manager    */

    let userEmail: string;

    // check for owner or manager

    switch (userType) {
      case "Owner":
        userEmail = (
          await this.prisma.owner.findUnique({
            where: {
              email,
            },
            select: {
              email: true,
            },
          })
        )?.email;

        break;

      case "Manager":
        userEmail = (
          await this.prisma.manager.findUnique({
            where: {
              email,
            },
            select: {
              email: true,
            },
          })
        ).email;
        break;
    }

    if (!userEmail) throw new NotFoundException();

    const otp = constants.workerTokenGenerator(6);

    const sendMailPromise = this.mailService.sendMail(
      userEmail,
      `Reset password otp is ${otp} \n valid for 5 minutes`,
    );

    const otpRedisSetPromise = redisClient.SET(
      `resetPassword-${userEmail}`,
      otp,
      {
        EX: 60 * 5,
      },
    );

    try {
      await Promise.all([sendMailPromise, otpRedisSetPromise]);

      return constants.OK;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
    // check if owner or manager existed
    //send otp
  }

  async completePasswordReset(dto: ResetPasswordFinal) {
    const { email, otp, password, userType } = dto;

    const getRedisOtp = await redisClient.GET(`resetPassword-${email}`);

    if (getRedisOtp !== otp) throw new ForbiddenException();

    try {
      await redisClient.DEL(`resetPassword-${email}`);

      const hashPassword = await argon.hash(password);

      if (userType === "Owner")
        await this.prisma.owner.update({
          where: {
            email,
          },
          data: {
            hash: hashPassword,
          },
        });
      else if (userType === "Manager")
        await this.prisma.manager.update({
          where: {
            email,
          },
          data: {
            hash: hashPassword,
          },
        });
      else {
        throw new Error("Not manager neither owner");
      }

      return constants.OK;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
  }
}
