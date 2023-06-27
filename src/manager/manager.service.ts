import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { CreateManagerDto } from "./dto/create-manager.dto";
import { UpdateManagerDto } from "./dto/update-manager.dto";
import { JwtPayload_restaurantId } from "src/Interfaces";
import { constants } from "src/useFullItems";
import { PrismaService } from "src/prisma/prisma.service";
import * as argon from "argon2";
import { MailServiceService } from "src/mail-service/mail-service.service";

@Injectable()
export class ManagerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailServiceService,
  ) {}

  async create(
    createManagerDto: CreateManagerDto,
    payload: JwtPayload_restaurantId,
  ) {
    if (payload.userType !== "Owner") throw new ForbiddenException();

    const { email, firstName, lastName, middleName } = createManagerDto;

    const tempPassword = constants.workerTokenGenerator(6);

    const createManagerPromise = this.prisma.manager.create({
      data: {
        email,
        firstName,
        lastName,
        middleName,
        restaurantId: payload.restaurantId,
        hash: await argon.hash(tempPassword),
      },
    });

    const sendMailPromise = this.mailService.sendMail(
      email,
      `Password for manager ${firstName} ${
        middleName ? middleName : ""
      } ${lastName} is ${tempPassword} \n our recommendation is to reset your password`,
    );

    try {
      await Promise.all([createManagerPromise, sendMailPromise]);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }

    return constants.OK;
  }

  async findAll(payload: JwtPayload_restaurantId) {
    const data = await this.prisma.restaurant.findUnique({
      where: {
        id: payload.restaurantId,
      },
      select: {
        manager: {
          select: {
            firstName: true,
            middleName: true,
            lastName: true,
          },
        },
      },
    });

    return data.manager;
  }

  findOne(id: number) {
    return `This action returns a #${id} manager`;
  }

  update(id: number, updateManagerDto: UpdateManagerDto) {
    return `This action updates a #${id} manager`;
  }

  remove(id: number) {
    return `This action removes a #${id} manager`;
  }
}
