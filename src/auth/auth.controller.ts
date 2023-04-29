import { Body, Controller, Post, Redirect, Req, Res } from "@nestjs/common";
import { Public } from "src/decorators";
import { AuthService } from "./auth.service";
import { CreateOwnerDto, EmailDto, GetJwtDto, SignInDto } from "./dto";
import { Request, Response } from "express";
import { constants } from "src/useFullItems";

@Public()
@Controller("auth")
export class AuthController {
  constructor(private readonly authservice: AuthService) {}

  @Post("/jwt")
  getJwt(
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
    @Body() dto: GetJwtDto,
  ) {
    return this.authservice.getJwt(res, req, dto);
  }

  @Post("signup")
  create(@Body() createOwnerDto: CreateOwnerDto) {
    return this.authservice.create(createOwnerDto);
  }

  @Post("signin")
  signIn(@Body() dto: SignInDto, @Res({ passthrough: true }) res: Response) {
    return this.authservice.signin(dto, res);
  }

  @Post("mailotp")
  async sendMail(@Body() email: EmailDto) {
    return this.authservice.verifyemail(email);
  }
}
