import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { JwtPayload_restaurantId } from "src/Interfaces";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateDishSectionDto } from "./dto/create-dish-section.dto";
import { UpdateDishSectionDto } from "./dto/update-dish-section.dto";
import { randomBytes } from "crypto";

@Injectable()
export class DishSectionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createDishSectionDto: CreateDishSectionDto,
    payload: JwtPayload_restaurantId,
  ) {
    try {
      await this.prisma.dishSection.create({
        data: {
          sectionName: createDishSectionDto.sectionName,
          restaurantId: payload.restaurantId,
        },
      });
      return "OK";
    } catch (error) {
      throw new InternalServerErrorException("Inter Server Error", {
        cause: error,
      });
    }
  }

  async getDishSections(restaurantId: string) {
    const data = await this.prisma.restaurant.findUnique({
      where: {
        id: restaurantId,
      },
      select: {
        dishSection: {
          select: {
            id: true,
            sectionName: true,
          },
        },
      },
    });

    return data.dishSection;
  }

  async update(id: string, updateDishSectionDto: UpdateDishSectionDto) {
    try {
      await this.prisma.dishSection.update({
        where: { id },
        data: { sectionName: updateDishSectionDto.sectionName },
      });

      return "OK";
    } catch (error) {
      throw new InternalServerErrorException("Internal Server Error", {
        cause: error,
      });
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.dishSection.delete({ where: { id: id } });

      return "OK";
    } catch (error) {
      throw new InternalServerErrorException("Internal Server Error", {
        cause: error,
      });
    }
  }
}
