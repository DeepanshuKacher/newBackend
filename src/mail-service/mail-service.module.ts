import { Global, Module } from "@nestjs/common";
import { MailServiceService } from "./mail-service.service";

@Global()
@Module({
  providers: [MailServiceService],
  exports: [MailServiceService],
})
export class MailServiceModule {}
