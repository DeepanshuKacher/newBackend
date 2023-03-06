import { Controller, Get, Post, Body, Param, Delete } from "@nestjs/common";
import { SessionsService } from "./sessions.service";
import { CreateSessionDto } from "./dto/create-session.dto";
import { GetJwtPayload } from "src/decorators";
import { JwtPayload_restaurantId } from "src/Interfaces";

@Controller("sessions")
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  findAll(@GetJwtPayload() payload: JwtPayload_restaurantId) {
    return this.sessionsService.findAll(payload);
  }

  @Get(":sessionId")
  getTableOrders(@Param("sessionId") id: string) {
    return this.sessionsService.getTableOrders(id);
  }

  @Post()
  create(
    @Body() createSessionDto: CreateSessionDto,
    @GetJwtPayload() payload: JwtPayload_restaurantId,
  ) {
    return this.sessionsService.create(createSessionDto, payload);
  }

  @Delete(":sessionId")
  clearSession(
    @Param("sessionId") id: string,
    @Body() createSessionDto: CreateSessionDto,
    @GetJwtPayload() payload: JwtPayload_restaurantId,
  ) {
    return this.sessionsService.clearSession(createSessionDto, payload, id);
  }
}
