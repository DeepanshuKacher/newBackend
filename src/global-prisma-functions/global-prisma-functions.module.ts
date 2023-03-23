import { Global, Module } from "@nestjs/common";
import { GlobalPrismaFunctionsService } from "./global-prisma-functions.service";

@Global()
@Module({
  providers: [GlobalPrismaFunctionsService],
  exports: [GlobalPrismaFunctionsService],
})
export class GlobalPrismaFunctionsModule {}
