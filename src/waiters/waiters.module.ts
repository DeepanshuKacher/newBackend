import { Module } from "@nestjs/common";
import { WaitersService } from "./waiters.service";
import { WaitersController } from "./waiters.controller";
import { AuthModule } from "src/auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [WaitersController],
  providers: [WaitersService],
})
export class WaitersModule {}
