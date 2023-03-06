import { Module } from "@nestjs/common";
import { FoodieService } from "./foodie.service";
import { FoodieController } from "./foodie.controller";
import { SessionsModule } from "src/sessions/sessions.module";
import { AuthModule } from "src/auth/auth.module";

@Module({
  imports: [SessionsModule, AuthModule],
  controllers: [FoodieController],
  providers: [FoodieService],
})
export class FoodieModule {}
