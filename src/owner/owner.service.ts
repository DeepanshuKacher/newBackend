import { Injectable } from "@nestjs/common";
import * as argon from "argon2";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateOwnerDto } from "./dto";
import { AuthService } from "../auth/auth.service";

@Injectable()
export class OwnerService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async create(createOwnerDto: CreateOwnerDto) {
    try {
      const hash = await argon.hash(createOwnerDto.password);

      const owner = await this.prisma.owner.create({
        data: {
          email: createOwnerDto.email,
          firstName: createOwnerDto.firstName,
          lastName: createOwnerDto.lastName,
          hash,
          middleName: createOwnerDto.middleName,
        },
      });

    } catch (error) {}
  }
}
