import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { JwtPayload_restaurantId } from "src/Interfaces";
import { PrismaService } from "src/prisma/prisma.service";
import { S3ImagesService } from "src/s3-images/s3-images.service";
import { constants, privateContstants } from "src/useFullItems";
import { CreateWaiterDto } from "./dto/create-waiter.dto";
import { UpdateWaiterDto } from "./dto/update-waiter.dto";
import { redisClient } from "../useFullItems";
import { AuthService } from "src/auth/auth.service";
import { UserType } from "src/auth/dto";
import { MailServiceService } from "src/mail-service/mail-service.service";
import { GlobalPrismaFunctionsService } from "src/global-prisma-functions/global-prisma-functions.service";

@Injectable()
export class WaitersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Images: S3ImagesService,
    private readonly authService: AuthService,
    private readonly mailService: MailServiceService,
    private readonly prismaGlobalFunction: GlobalPrismaFunctionsService,
  ) {}

  async create(
    createWaiterDto: CreateWaiterDto,
    payload: JwtPayload_restaurantId,
    passportImage?: Express.Multer.File,
    idProof?: Express.Multer.File,
  ) {
    if (
      passportImage &&
      (passportImage.size > 100000 ||
        !new RegExp(/image\/*/).test(passportImage.mimetype))
    )
      throw new UnprocessableEntityException();

    if (
      idProof &&
      (idProof.size > 1000000 || !new RegExp(/image\/*/).test(idProof.mimetype))
    )
      throw new UnprocessableEntityException();

    const createWaiter = await this.prisma.waiter.create({
      data: {
        ...createWaiterDto,
        restaurantId: payload.restaurantId,
      },
    });

    const updateWaiter = this.prisma.waiter.update({
      where: {
        id: createWaiter.id,
      },
      data: {
        passportPhoto: passportImage
          ? constants.objectURL(
              payload.restaurantId,
              constants.workerPassportPhoto(createWaiter.id),
            )
          : null,

        identityPhoto: idProof
          ? constants.objectURL(
              payload.restaurantId,
              constants.workerIdentityPhoto(createWaiter.id),
            )
          : null,
      },
    });

    if (passportImage)
      /* this is not async no need for await */
      this.s3Images.createImage(
        constants.workerPassportPhoto(createWaiterDto.name),
        payload.restaurantId,
        passportImage,
      );

    if (idProof)
      /* this is not async no need for await */
      this.s3Images.createImage(
        constants.workerIdentityPhoto(createWaiterDto.name),
        payload.restaurantId,
        idProof,
      );

    const ownerEmail = this.prisma.owner.findUnique({
      where: { id: payload.userId },
      select: {
        email: true,
      },
    });

    try {
      const [value1, value2] = await Promise.all([updateWaiter, ownerEmail]);

      const jwtPayload = this.authService.jwt_token_with_restaurantId({
        restaurantId: payload.restaurantId,
        userId: value1.id,
        userType: UserType.Waiter,
      });

      const randomKey = constants.workerTokenGenerator();

      await redisClient.SETEX(randomKey, 5 * 60 * 60, jwtPayload.access_token);

      await this.mailService.sendMail(
        value2.email,
        `One Time Token Id for waiter ${createWaiter.name} is ${randomKey} valid for 5 hours`,
      );

      return constants.OK;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException("Internal Server Error", {
        cause: error,
      });
    }
  }

  async getRestaurantDetail_For_Waiter(waiterMongoId: string) {
    const data = await this.prisma.waiter.findUnique({
      where: {
        id: waiterMongoId,
      },
      select: {
        Restaurant: {
          select: {
            city: true,
            name: true,
            id: true,
            tables: true,
            dishesh: {
              select: {
                id: true,
                name: true,
                description: true,
                addOns: true,
                available: true,
                price: true,
              },
              orderBy: {
                name: "asc",
              },
            },
            restaurantSettingForWaiter: {
              select: {
                allowWaiterToClearSession: true,
              },
            },
          },
        },
        name: true,
        id: true,
      },
    });

    if (data === null)
      return {
        settings: "clear",
      };

    const { restaurantSettingForWaiter, city, dishesh, id, name, tables } =
      data?.Restaurant;

    return {
      restaurantDetail: {
        city,
        dishesh,
        id,
        name,
        tables,
      },
      settings: restaurantSettingForWaiter,
      selfDetail: { name: data.name, id: data.id },
    };
  }

  async checkToken(token: string) {
    const accessToken = await redisClient.GETDEL(token);

    if (!accessToken) throw new NotFoundException();

    const values: JwtPayload_restaurantId =
      this.authService.jwtDecode(accessToken);

    const returnData = await this.prisma.waiter.update({
      where: {
        id: values.userId,
      },
      data: {
        verified: true,
      },
      select: {
        Restaurant: {
          select: {
            city: true,
            name: true,
            id: true,
            tables: true,
            dishesh: {
              select: {
                id: true,
                name: true,
                description: true,
                addOns: true,
                available: true,
                price: true,
              },
              orderBy: {
                name: "asc",
              },
            },
            restaurantSettingForWaiter: {
              select: {
                allowWaiterToClearSession: true,
              },
            },
          },
        },
        name: true,
        id: true,
      },
    });

    const { restaurantSettingForWaiter, city, dishesh, id, name, tables } =
      returnData.Restaurant;

    return {
      accessToken,
      restaurantDetail: {
        city,
        dishesh,
        id,
        name,
        tables,
      },
      settings: restaurantSettingForWaiter,
      selfDetail: { name: returnData.name, id: returnData.id },
    };
  }

  async remove(id: string, payload: JwtPayload_restaurantId) {
    try {
      this.s3Images.deleteImage(
        payload.restaurantId,
        constants.workerPassportPhoto(id),
      );

      this.s3Images.deleteImage(
        payload.restaurantId,
        constants.workerIdentityPhoto(id),
      );

      const changeCommitIdPromis =
        this.prismaGlobalFunction.updateRestaurantCommitUUID(
          payload.restaurantId,
        );

      const deleteWaiterPromis = this.prisma.waiter.delete({
        where: {
          id,
        },
      });

      await Promise.all([changeCommitIdPromis, deleteWaiterPromis]);

      return constants.OK;
    } catch (error) {
      console.log({ error });
      throw new InternalServerErrorException(constants.InternalError, {
        cause: error,
      });
    }
  }

  getLogs(payload: JwtPayload_restaurantId) {
    return this.prisma.waiter.findUnique({
      where: {
        id: payload.userId,
      },
      select: {
        Order_Logs: true,
      },
    });
  }
}
