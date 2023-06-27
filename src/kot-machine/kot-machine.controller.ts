import { Controller, Get, Param, Redirect, Req, Res } from "@nestjs/common";
import { KotMachineService } from "./kot-machine.service";
import { Public } from "src/decorators";
import { constants, privateContstants } from "src/useFullItems";
import type { Response, Request } from "express";

@Public()
@Controller("kot-machine")
export class KotMachineController {
  constructor(private readonly kotMachineService: KotMachineService) {}

  @Get("jwt")
  getJwt(@Req() req: Request) {
    return this.kotMachineService.getJwt(req);
  }

  @Get(":restaurantId")
  @Redirect(
    constants.IS_DEVELOPMENT
      ? `http://${privateContstants.development_url}:3000`
      : "https://kot-machine.eatrofoods.com",
  )
  findAll(
    @Param("restaurantId") restaurantId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.kotMachineService.login(res, restaurantId);
  }
}
