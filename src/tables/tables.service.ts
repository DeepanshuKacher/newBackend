import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { JwtPayload_restaurantId } from "src/Interfaces";
import { PrismaService } from "src/prisma/prisma.service";
import { constants } from "src/useFullItems";
import { CreateTableDto } from "./dto/create-table.dto";

@Injectable()
export class TablesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    payload: JwtPayload_restaurantId,
    createTableDto: CreateTableDto,
  ) {
    try {
      await this.prisma.table.create({
        data: {
          ...createTableDto,
          restaurantId: payload.restaurantId,
        },
      });

      return constants.OK;
    } catch (error) {
      throw new InternalServerErrorException(constants.InternalError, {
        cause: error,
      });
    }
  }

  async update(id: string, updateTableDto: CreateTableDto) {
    try {
      await this.prisma.table.update({
        where: {
          id,
        },
        data: updateTableDto,
      });

      return constants.OK;
    } catch (error) {
      throw new InternalServerErrorException(constants.InternalError, {
        cause: error,
      });
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.table.delete({
        where: { id },
      });
      return constants.OK;
    } catch (error) {
      throw new InternalServerErrorException(constants.InternalError, {
        cause: error,
      });
    }
  }
}
