import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from "@nestjs/common";
import { GetJwtPayload } from "src/decorators";
import { JwtPayload_restaurantId } from "src/Interfaces";
import { CreateOrderDto } from "src/orders/dto/create-order.dto";
import { CartService } from "./cart.service";
import { CartToOrderDTO } from "./dto/cart-to-order.dto";
import { DeleteCartOrderDTO } from "./dto/delete-cart-order.dto";

@Controller("cart")
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get(":sessionId")
  getFromCart(@Param("sessionId") id: string) {
    return this.cartService.findCardOrders(id);
  }

  @Post()
  addToCart(
    @Body() dto: CreateOrderDto,
    @GetJwtPayload() payload: JwtPayload_restaurantId,
  ) {
    return this.cartService.addToCart(dto, payload);
  }

  @Post("order")
  convertCartOrderToDishOrder(
    @GetJwtPayload() payload: JwtPayload_restaurantId,
    @Body() dto: CartToOrderDTO,
  ) {
    return this.cartService.convertCartItemToOrder(payload, dto);
  }

  @Delete()
  deleteCartOrder(@Body() dto: DeleteCartOrderDTO) {
    return this.cartService.deleteCartOrder(dto);
  }
}
