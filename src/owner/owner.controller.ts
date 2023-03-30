import { Body, Controller, Post } from "@nestjs/common";
import { CreateOwnerDto } from "./dto";
import { OwnerService } from "./owner.service";

@Controller("owner")
export class OwnerController {
  constructor(private readonly ownerService: OwnerService) {}
}
