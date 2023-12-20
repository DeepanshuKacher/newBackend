import { Controller, Get, Post, Body, Param, Delete } from "@nestjs/common";
import { SessionsService } from "./sessions.service";
import { CreateSessionDto } from "./dto/create-session.dto";
import { GetJwtPayload } from "src/decorators";
import { JwtPayload_restaurantId } from "src/Interfaces";
import { DeleteSessionDto } from "./dto/delete-session.dto";

@Controller("sessions")
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) { }

  @Get("log")
  sessionHistory(@GetJwtPayload() payload: JwtPayload_restaurantId) {
    return this.sessionsService.sessionLog(payload);
  }

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

  @Post("closeNotification")
  clearSessionNotificationGenerator(
    @Body() createSessionDto: CreateSessionDto,
    @GetJwtPayload() payload: JwtPayload_restaurantId,
  ) {
    return this.sessionsService.closeSessionNotificationGenerator(
      createSessionDto,
      payload,
    );
  }

  @Delete(":sessionId")
  clearSession(
    @Param("sessionId") id: string,
    @Body() deleteSessionDto: DeleteSessionDto,
    @GetJwtPayload() payload: JwtPayload_restaurantId,
  ) {
    return this.sessionsService.clearSession(deleteSessionDto, payload, id);
  }
}
