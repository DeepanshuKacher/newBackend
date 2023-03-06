import { Module } from "@nestjs/common";
import { ChefsService } from "./chefs.service";
import { ChefsController } from "./chefs.controller";
import { AuthModule } from "src/auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [ChefsController],
  providers: [ChefsService],
})
export class ChefsModule {}
