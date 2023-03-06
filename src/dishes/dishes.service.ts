import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { CreateDishDto } from "./dto/create-dish.dto";
import { UpdateDishDto } from "./dto/update-dish.dto";
import { constants } from "src/useFullItems";
import { PrismaService } from "src/prisma/prisma.service";
import { JwtPayload_restaurantId } from "src/Interfaces";
import { DeleteDishDto } from "./dto";
import { S3ImagesService } from "src/s3-images/s3-images.service";

@Injectable()
export class DishesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Images: S3ImagesService,
  ) {}

  async createDish(dto: CreateDishDto, restaurantId: string, image?: string) {
    return await this.prisma.dish.create({
      data: {
        ...dto,
        restaurantId,
        imageUrl: image,
      },
    });
  }

  async create_with_image(
    file: Express.Multer.File,
    body: CreateDishDto,
    payload: JwtPayload_restaurantId,
  ) {
    const imageUrl = constants.objectURL(payload.restaurantId, body.name);

    const uploadDish = this.createDish(body, payload.restaurantId, imageUrl);
    const uploadImage = this.s3Images.createImage(
      body.name,
      payload.restaurantId,
      file,
    );

    try {
      await Promise.all([uploadImage, uploadDish]);

      return "OK";
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
      await this.prisma.dish.update({
        where: { id },
        data: { ...updateDishDto },
      });

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

      await Promise.all([deleteDish, deleteImage]);

      return constants.OK;
    } catch (error) {
      throw new InternalServerErrorException(constants.InternalError, {
        cause: error,
      });
    }
  }
}
