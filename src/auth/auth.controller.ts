import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Redirect,
  Req,
  Res,
} from "@nestjs/common";
import { Public } from "src/decorators";
import { CreateOwnerDto } from "src/owner/dto";
import { AuthService } from "./auth.service";
import { EmailDto, GetJwtDto, SignInDto } from "./dto";
import { Request, Response } from "express";
import { S3ImagesService } from "src/s3-images/s3-images.service";
import { constants } from "src/useFullItems";

@Public()
@Controller("auth")
export class AuthController {
  constructor(
    private readonly authservice: AuthService,
    private s3Service: S3ImagesService,
  ) {}

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
