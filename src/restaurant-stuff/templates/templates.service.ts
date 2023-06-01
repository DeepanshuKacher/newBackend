import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateTemplateDto } from "./dto/create-template.dto";
import { PrismaService } from "src/prisma/prisma.service";
import { JwtPayload_restaurantId } from "src/Interfaces";
import { constants } from "src/useFullItems";

@Injectable()
export class TemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(
    createTemplateDto: CreateTemplateDto,
    payload: JwtPayload_restaurantId,
  ) {
    const { restaurantId, userId, userType } = payload;
    const { operations, upperSectionText } = createTemplateDto;

    if (operations) {
      await this.prisma.billPrintTemplate.upsert({
        where: {
          restaurantId,
        },
        update: {
          operations: {
            push: operations,
          },
          upperSectionText,
        },
        create: {
          operations,
          upperSectionText,
          restaurantId,
        },
      });
    } else {
      await this.prisma.billPrintTemplate.upsert({
        where: {
          restaurantId,
        },
        update: {
          upperSectionText,
        },
        create: {
          operations,
          upperSectionText,
          restaurantId,
        },
      });
    }

    return constants.OK;
  }

  get(payload: JwtPayload_restaurantId) {
    return this.prisma.billPrintTemplate.findUnique({
      where: {
        restaurantId: payload.restaurantId,
      },
      select: {
        operations: true,
        upperSectionText: true,
      },
    });
  }

  async deleteOperations(
    // createTemplateDto: CreateTemplateDto,
    payload: JwtPayload_restaurantId,
  ) {
    const operationis = (
      await this.prisma.billPrintTemplate.findUnique({
        where: {
          restaurantId: payload.restaurantId,
        },
        select: {
          operations: true,
        },
      })
    )?.operations;

    if (!operationis) throw new NotFoundException();
  }
}
