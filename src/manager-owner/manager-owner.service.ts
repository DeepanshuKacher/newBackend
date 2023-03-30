import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class ManagerOwnerService {
  constructor(private readonly prisma: PrismaService) {}
  getInfo() {
  }
}
