import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from "@nestjs/common";
import { OrdersService } from "./orders.service";
import { CreateOrderDto, KotId } from "./dto/create-order.dto";
import { GetJwtPayload } from "src/decorators";
import { JwtPayload_restaurantId } from "src/Interfaces";
import { UpdateOrderStatusDto } from "./dto/update-orderStatus.dto";
import { DeleteOrderDto } from "./dto/delete-order.dto";
import { UpdateOrderDto } from "./dto/update-order.dto";

@Controller("orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) { }

  @Get()
  findAll(@GetJwtPayload() payload: JwtPayload_restaurantId) {
    return this.ordersService.findAll(payload);
  }

  /*   @Get("logs")
    getOrderLogs(@GetJwtPayload() payload: JwtPayload_restaurantId) {
      return this.ordersService.getOrder_logs(payload);
    } */

  @Post()
  create(
    @Body() createOrderDto: CreateOrderDto,
    @GetJwtPayload() payload: JwtPayload_restaurantId,
  ) {
    return this.ordersService.create(createOrderDto, payload);
  }

  @Patch("accept")
  acceptOrder(
    @Body() dto: UpdateOrderStatusDto,
    @GetJwtPayload() payload: JwtPayload_restaurantId,
  ) {
    return this.ordersService.acceptOrder(payload, dto);
  }

  @Patch("incrementPrintCount")
  incrementPrintCount(@Body() kotId: KotId) {
    return this.ordersService.printCountIncrement(kotId.kotId);
  }

  @Patch("reject")
  rejectOrder(
    @Body() dto: UpdateOrderStatusDto,
    @GetJwtPayload() payload: JwtPayload_restaurantId,
  ) {
    return this.ordersService.rejectOrder(payload, dto);
  }

  @Patch("update") updateOrder(@Body() dto: UpdateOrderDto) {
    return this.ordersService.updateOrder(dto);
  }

  @Patch("complete")
  completeOrder(
    @Body() dto: UpdateOrderStatusDto,
    @GetJwtPayload() payload: JwtPayload_restaurantId,
  ) {
    return this.ordersService.completeOrder(payload, dto);
  }

  @Delete("order")
  deleteOrder(@Body() dto: DeleteOrderDto) {
    return this.ordersService.deleteOrder(dto);
  }
}
