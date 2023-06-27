import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { CreateDishDto } from "./dto/create-dish.dto";
import { UpdateDishDto } from "./dto/update-dish.dto";
import { constants } from "src/useFullItems";
import { PrismaService } from "src/prisma/prisma.service";
import { JwtPayload_restaurantId } from "src/Interfaces";
import { DeleteDishDto } from "./dto";
import { S3ImagesService } from "src/s3-images/s3-images.service";
import { Dish } from "@prisma/client";
import { GlobalPrismaFunctionsService } from "src/global-prisma-functions/global-prisma-functions.service";

@Injectable()
export class DishesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Images: S3ImagesService,
    private readonly globalPrismaFunctions: GlobalPrismaFunctionsService,
  ) {}

  async createBulkDish(data: Dish[]) {
    return await this.prisma.dish.createMany({
      data,
    });
  }

  async create_bulkDish_withoutImage() {}

  async createDish(dto: CreateDishDto, restaurantId: string, image?: string) {
    const returnDishValue = (fullPrice: number, halfPrice: number) => {
      if (!(fullPrice || halfPrice)) return null;

      return {
        full: fullPrice ? fullPrice : null,
        half: halfPrice ? halfPrice : null,
      };
    };
    const updateCommitIdPromis =
      this.globalPrismaFunctions.updateRestaurantCommitUUID(restaurantId);

    const createDishPromis = this.prisma.dish.create({
      data: {
        name: dto.name,
        description: dto.description,
        imageUrl: image,
        price: {
          large: returnDishValue(dto.FullLarge_Price, dto.HalfLarge_Price),
          medium: returnDishValue(dto.FullMedium_Price, dto.HalfMedium_Price),
          small: returnDishValue(dto.FullSmall_Price, dto.HalfSmall_Price),
        },
        dishSectionId: dto.dishSectionId,
        restaurantId,
      },
    });

    const [updateCommitId, createDish] = await Promise.all([
      updateCommitIdPromis,
      createDishPromis,
    ]);

    return createDish;
  }

  async create_with_image(
    file: Express.Multer.File,
    body: CreateDishDto,
    payload: JwtPayload_restaurantId,
  ) {
    try {
      const imageUrl = constants.objectURL(payload.restaurantId, body.name);

      this.s3Images.createImage(body.name, payload.restaurantId, file);
      const uploadDish = await this.createDish(
        body,
        payload.restaurantId,
        imageUrl,
      );

      return constants.OK;
    } catch (error) {
      if (constants.IS_DEVELOPMENT) console.log(error);
      throw new InternalServerErrorException("Internal Server Error", {
        cause: error,
      });
    }
  }

  async create_without_image(
    dto: CreateDishDto, // change internal
    payload: JwtPayload_restaurantId,
  ) {
    await this.createDish(dto, payload.restaurantId);

    return "OK";
  }

  async getSectionDishesh(sectionId: string) {
    const data = await this.prisma.dishSection.findUnique({
      where: {
        id: sectionId,
      },
      select: {
        dishesh: true,
      },
    });
    return data.dishesh;
  }

  async update(id: string, updateDishDto: UpdateDishDto) {
    try {
      const data = await this.prisma.dish.update({
        where: { id },
        data: { ...updateDishDto },
        select: {
          restaurantId: true,
        },
      });
      await this.globalPrismaFunctions.updateRestaurantCommitUUID(
        data.restaurantId,
      );

      return constants.OK;
    } catch (error) {
      throw new InternalServerErrorException(constants.InternalError, {
        cause: error,
      });
    }
  }

  async remove(
    id: string,
    body: DeleteDishDto,
    payload: JwtPayload_restaurantId,
  ) {
    try {
      const deleteDish = this.prisma.dish.delete({ where: { id } });
      const deleteImage = this.s3Images.deleteImage(
        payload.restaurantId,
        body.name,
      );

      const updateCommitIdPromis =
        this.globalPrismaFunctions.updateRestaurantCommitUUID(
          payload.restaurantId,
        );

      await Promise.all([deleteDish, deleteImage, updateCommitIdPromis]);

      return constants.OK;
    } catch (error) {
      throw new InternalServerErrorException(constants.InternalError, {
        cause: error,
      });
    }
  }

  async getDish(payload: JwtPayload_restaurantId) {
    try {
      const data = (
        await this.prisma.restaurant.findUnique({
          where: {
            id: payload.restaurantId,
          },
          select: {
            dishesh: true,
          },
        })
      )?.dishesh;

      return data;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
  }
}
