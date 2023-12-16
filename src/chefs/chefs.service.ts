import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { AuthService } from "src/auth/auth.service";
import { UserType } from "src/auth/dto";
import { JwtPayload_restaurantId } from "src/Interfaces";
import { MailServiceService } from "src/mail-service/mail-service.service";
import { PrismaService } from "src/prisma/prisma.service";
// import { S3ImagesService } from "src/s3-images/s3-images.service";
import { constants, redisClient } from "src/useFullItems";
import { CreateChefDto } from "./dto/create-chef.dto";
// import { UpdateChefDto } from "./dto/update-chef.dto";
import { GlobalPrismaFunctionsService } from "src/global-prisma-functions/global-prisma-functions.service";

@Injectable()
export class ChefsService {
  constructor(
    private readonly prisma: PrismaService,
    // private readonly s3Images: S3ImagesService,
    private readonly authService: AuthService,
    private readonly mailService: MailServiceService,
    private readonly globalPrismaFunction: GlobalPrismaFunctionsService,
  ) {}

  async create(
    dto: CreateChefDto,
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

    const createWorker = await this.prisma.chef.create({
      data: {
        ...dto,
        restaurantId: payload.restaurantId,
      },
    });

    const updateWorker = this.prisma.chef.update({
      where: {
        id: createWorker.id,
      },
      data: {
        passportPhoto: passportImage
          ? constants.objectURL(
              payload.restaurantId,
              constants.workerPassportPhoto(createWorker.id),
            )
          : null,

        identityPhoto: idProof
          ? constants.objectURL(
              payload.restaurantId,
              constants.workerIdentityPhoto(createWorker.id),
            )
          : null,
      },
    });

    // if (passportImage)
    //   /* this is not async no need for await */
    //   this.s3Images.createImage(
    //     constants.workerPassportPhoto(dto.name),
    //     payload.restaurantId,
    //     passportImage,
    //   );

    // if (idProof)
    //   /* this is not async no need for await */
    //   this.s3Images.createImage(
    //     constants.workerIdentityPhoto(dto.name),
    //     payload.restaurantId,
    //     idProof,
    //   );

    const ownerEmail = this.prisma.owner.findUnique({
      where: { id: payload.userId },
      select: {
        email: true,
      },
    });

    try {
      const [value1, value2] = await Promise.all([updateWorker, ownerEmail]);

      const jwtPayload = this.authService.jwt_token_with_restaurantId({
        restaurantId: payload.restaurantId,
        userId: value1.id,
        userType: UserType.Chef,
      });

      const randomKey = constants.workerTokenGenerator();

      await redisClient.SETEX(randomKey, 5 * 60 * 60, jwtPayload.access_token);

      await this.mailService.sendMail(
        value2.email,
        `One Time Token Id for chef ${createWorker.name} is ${randomKey} valid for 5 hours`,
      );

      return constants.OK;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException("Internal Server Error", {
        cause: error,
      });
    }
  }

  async getRestaurantDetail_For_Chef(chefMongodbId: string) {
    const data = await this.prisma.chef.findUnique({
      where: {
        id: chefMongodbId,
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
                // available: true, it will be usefull in upcomming features
              },
              orderBy: {
                name: "asc",
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
        selfDetail: { name: "clear" },
      };

    // const { restaurantSettingForWaiter, city, dishesh, id, name, tables } =
    //   data?.Restaurant;

    return {
      selfDetail: { name: data.name, id: data.id },
      restaurantDetail: data.Restaurant,
    };
  }

  async checkToken(token: string) {
    const accessToken = await redisClient.GETDEL(token);

    if (!accessToken) throw new NotFoundException();

    const values: JwtPayload_restaurantId =
      this.authService.jwtDecode(accessToken);

    const restaurantDetail = await this.prisma.chef
      .update({
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
                  // available: true, it will be usefull in upcomming features
                },
                orderBy: {
                  name: "asc",
                },
              },
            },
          },
          name: true,
          id: true,
        },
      })
      .catch((error) => {
        console.log(error);
        throw new InternalServerErrorException();
      });

    return {
      accessToken,
      selfDetail: { name: restaurantDetail.name, id: restaurantDetail.id },
      restaurantDetail: restaurantDetail.Restaurant,
    };
  }

  async remove(id: string, payload: JwtPayload_restaurantId) {
    try {
      // this.s3Images.deleteImage(
      //   payload.restaurantId,
      //   constants.workerPassportPhoto(id),
      // );

      // this.s3Images.deleteImage(
      //   payload.restaurantId,
      //   constants.workerIdentityPhoto(id),
      // );

      const updateCommitPromis =
        this.globalPrismaFunction.updateRestaurantCommitUUID(
          payload.restaurantId,
        );

      const deleteChefPromis = this.prisma.chef.delete({
        where: {
          id,
        },
      });

      await Promise.all([deleteChefPromis, updateCommitPromis]);

      return constants.OK;
    } catch (error) {
      console.log({ error });
      throw new InternalServerErrorException(constants.InternalError, {
        cause: error,
      });
    }
  }
}
