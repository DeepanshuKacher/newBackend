import { Module } from "@nestjs/common";
import { KotMachineService } from "./kot-machine.service";
import { KotMachineController } from "./kot-machine.controller";
import { AuthModule } from "src/auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [KotMachineController],
  providers: [KotMachineService],
})
export class KotMachineModule {}
