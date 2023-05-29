import { Injectable } from "@nestjs/common";
import { CreateKotDto } from "./dto/create-kot.dto";
import { UpdateKotDto } from "./dto/update-kot.dto";
import { redisGetFunction } from "src/useFullItems";
import { JwtPayload_restaurantId } from "src/Interfaces";

@Injectable()
export class KotService {
  create(createKotDto: CreateKotDto) {
    return "This action adds a new kot";
  }

  findAll(payload: JwtPayload_restaurantId) {
    return redisGetFunction.ordersKeyFromKotContainer(
      payload.restaurantId,
      true,
    );
  }

  findOne(id: number) {
    return `This action returns a #${id} kot`;
  }

  update(id: number, updateKotDto: UpdateKotDto) {
    return `This action updates a #${id} kot`;
  }

  remove(id: number) {
    return `This action removes a #${id} kot`;
  }
}
