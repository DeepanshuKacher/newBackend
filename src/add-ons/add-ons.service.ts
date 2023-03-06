import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { constants } from "src/useFullItems";
import { CreateAddOnDto } from "./dto/create-add-on.dto";
import { UpdateAddOnDto } from "./dto/update-add-on.dto";

@Injectable()
export class AddOnsService {
  constructor(private readonly prisma: PrismaService) {}

  // async create(createAddOnDto: CreateAddOnDto) {
  //   try {
  //     await this.prisma.addOns.create({
  //       data: createAddOnDto,
  //     });

  //     return constants.OK;
  //   } catch (error) {
  //     throw new InternalServerErrorException(constants.InternalError, {
  //       cause: error,
  //     });
  //   }
  // }

  findAll() {
    return `This action returns all addOns`;
  }

  findOne(id: number) {
    return `This action returns a #${id} addOn`;
  }

  update(id: number, updateAddOnDto: UpdateAddOnDto) {
    return "bakwas";
  }

  remove(id: number) {
    return `This action removes a #${id} addOn`;
  }
}
