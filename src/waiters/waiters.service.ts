import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { JwtPayload_restaurantId } from "src/Interfaces";
import { PrismaService } from "src/prisma/prisma.service";
import { S3ImagesService } from "src/s3-images/s3-images.service";
import { constants } from "src/useFullItems";
import { CreateWaiterDto } from "./dto/create-waiter.dto";
import { UpdateWaiterDto } from "./dto/update-waiter.dto";
import { redisClient } from "../useFullItems";
import { AuthService } from "src/auth/auth.service";
import { UserType } from "src/auth/dto";
import { MailServiceService } from "src/mail-service/mail-service.service";

@Injectable()
export class WaitersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Images: S3ImagesService,
    private readonly authService: AuthService,
    private readonly mailService: MailServiceService,
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

      await redisClient.SETEX(
        randomKey,
        constants.IS_DEVELOPMENT ? 60 * 60 : 60 * 15,
        jwtPayload.access_token,
      );

      await this.mailService.sendMail(
        value2.email,
        `One Time Token Id for waiter ${createWaiter.name} is ${randomKey} valid for 15 minutes`,
      );

      return constants.OK;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException("Internal Server Error", {
        cause: error,
      });
    }
  }

  async checkToken(token: string) {
    const accessToken = await redisClient.GETDEL(token);

    if (!accessToken) throw new NotFoundException();

    const values: JwtPayload_restaurantId =
      this.authService.jwtDecode(accessToken);

    const restaurantDetail = await this.prisma.waiter.update({
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
                FullLarge_Price: true,
                FullMedium_Price: true,
                FullSmall_Price: true,
                HalfLarge_Price: true,
                HalfMedium_Price: true,
                HalfSmall_Price: true,
                available: true,
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
      },
    });

    const { restaurantSettingForWaiter, city, dishesh, id, name, tables } =
      restaurantDetail.Restaurant;


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
    };
  }

  findAll() {
    return `This action returns all waiters`;
  }

  findOne(id: number) {
    return `This action returns a #${id} waiter`;
  }

  update(id: number, updateWaiterDto: UpdateWaiterDto) {
    return `This action updates a #${id} waiter`;
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

      await this.prisma.waiter.delete({
        where: {
          id,
        },
      });

      return constants.OK;
    } catch (error) {
      if (constants.IS_DEVELOPMENT) console.log({ error });
      throw new InternalServerErrorException(constants.InternalError, {
        cause: error,
      });
    }
  }
}
