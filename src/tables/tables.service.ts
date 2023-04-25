import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { JwtPayload_restaurantId } from "src/Interfaces";
import { PrismaService } from "src/prisma/prisma.service";
import { constants } from "src/useFullItems";
import { CreateTableDto } from "./dto/create-table.dto";
import { GlobalPrismaFunctionsService } from "src/global-prisma-functions/global-prisma-functions.service";

@Injectable()
export class TablesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly globalPrismaFunction: GlobalPrismaFunctionsService,
  ) {}

  async create(
    payload: JwtPayload_restaurantId,
    createTableDto: CreateTableDto,
  ) {
    const updateRestaurantCommitUUIDPromis =
      this.globalPrismaFunction.updateRestaurantCommitUUID(
        payload.restaurantId,
      );

    const createTablePromis = this.prisma.table.create({
      data: {
        ...createTableDto,
        restaurantId: payload.restaurantId,
      },
    });
    try {
      await Promise.all([updateRestaurantCommitUUIDPromis, createTablePromis]);
      return constants.OK;
    } catch (error) {
      throw new InternalServerErrorException(constants.InternalError, {
        cause: error,
      });
    }
  }

  async update(
    id: string,
    updateTableDto: CreateTableDto,
    payload: JwtPayload_restaurantId,
  ) {
    const updateRestaurantCommitUUIDPromis =
      this.globalPrismaFunction.updateRestaurantCommitUUID(
        payload.restaurantId,
      );
    const updateTableInfoPromis = this.prisma.table.update({
      where: {
        id,
      },
      data: updateTableDto,
    });

    try {
      await Promise.all([
        updateRestaurantCommitUUIDPromis,
        updateTableInfoPromis,
      ]);
      return constants.OK;
    } catch (error) {
      throw new InternalServerErrorException(constants.InternalError, {
        cause: error,
      });
    }
  }

  async remove(id: string, payload: JwtPayload_restaurantId) {
    const deleteTablePromis = this.prisma.table.delete({
      where: { id },
    });

    const updateRestaurantCommitUUIDPromis =
      this.globalPrismaFunction.updateRestaurantCommitUUID(
        payload.restaurantId,
      );
    try {
      await Promise.all([updateRestaurantCommitUUIDPromis, deleteTablePromis]);

      return constants.OK;
    } catch (error) {
      throw new InternalServerErrorException(constants.InternalError, {
        cause: error,
      });
    }
  }
}
