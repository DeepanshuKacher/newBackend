import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import {
  constants,
  redisClient,
  redisConstants,
  redisGetFunction,
} from "src/useFullItems";
import type { Request, Response } from "express";
import { SessionsService } from "src/sessions/sessions.service";
import { UserType } from "src/auth/dto";
import { AuthService } from "src/auth/auth.service";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class FoodieService {
  constructor(
    private readonly sessionService: SessionsService,
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  async createSession(
    restaurantId: string,
    tableSectionId: string,
    tableNumber: number,
    request: Request,
    response: Response,
  ) {
    // add logic to check geo-location

    // checking it table exist or not
    const tableInfoPromis = this.prisma.table.findUnique({
      where: {
        id: tableSectionId,
      },
      select: {
        id: true,
        endNumber: true,
        startNumber: true,
        restaurantId: true,
      },
    });

    const tableCurrentSessionIdPromis = redisClient.HGET(
      redisConstants.tablesStatusKey(restaurantId),
      redisConstants.tableSessionKeyForTablesStatus(
        tableSectionId,
        tableNumber,
      ),
    );

    const [tableCurrentSessionId, tableInfo] = await Promise.all([
      tableCurrentSessionIdPromis,
      tableInfoPromis,
    ]);

    //checking it table exist or not
    if (!tableInfo) throw new NotFoundException();
    if (tableInfo.restaurantId !== restaurantId) throw new ConflictException();
    if (!(tableNumber >= tableInfo.startNumber && tableNumber <= tableInfo.endNumber)) throw new ConflictException();

    const sessionId = request.signedCookies[constants.sessionId];

    if (tableCurrentSessionId) {
      if (tableCurrentSessionId === redisConstants.sessionKey(sessionId)) {
        return constants.OK;
      } else {
        return "Please Reload"; // this is vary important change to get foodie upon re-scanning I don't know how this works
      }
    }

    const sessionUUID = await this.sessionService.createSession(
      restaurantId,
      tableSectionId,
      tableNumber,
    );

    response.cookie(constants.userType, UserType.FOODIE, {
      domain: constants.globalDomainForFoodie,
      secure: constants.IS_DEVELOPMENT ? false : true,
      signed: true,
      sameSite: "strict",
      httpOnly: true,
      maxAge: constants.timeConstants.daysFromMilliSeconds(100),
    });
    response.cookie(constants.sessionId, sessionUUID, {
      domain: constants.globalDomainForFoodie,
      secure: constants.IS_DEVELOPMENT ? false : true,
      signed: true,
      sameSite: "strict",
      httpOnly: true,
      maxAge: constants.timeConstants.daysFromMilliSeconds(100),
    });
    response.cookie(constants.restaurantId, restaurantId, {
      domain: constants.globalDomainForFoodie,
      secure: constants.IS_DEVELOPMENT ? false : true,
      signed: true,
      sameSite: "strict",
      httpOnly: true,
      maxAge: constants.timeConstants.daysFromMilliSeconds(100),
    });

    return constants.OK;
  }

  checkForRestaurantIdAndSessionId(request: Request) {
    const restaurantId = request.signedCookies[constants.restaurantId];
    const sessionId = request.signedCookies[constants.sessionId];

    if (!(restaurantId && sessionId)) throw new ForbiddenException();

    return constants.OK;
  }

  async getJwt(request: Request) {
    const restaurantId = request.signedCookies[constants.restaurantId];
    const sessionId = request.signedCookies[constants.sessionId];

    // console.log({ restaurantId, sessionId });

    if (!restaurantId || !sessionId) throw new ForbiddenException();

    const tableInfoPromis = redisGetFunction.getTableInfoFromSessionUUID(
      restaurantId,
      sessionId,
    );

    const jwtToken = this.authService.jwt_token_with_restaurantId({
      restaurantId: restaurantId,
      userId: "self",
      userType: UserType.FOODIE,
    }).access_token;

    const dataPromis = this.prisma.restaurant.findUnique({
      where: {
        id: restaurantId,
      },
      select: {
        dishesh: true,
        dishSection: {
          select: {
            dishesh: true,
            sectionName: true,
          },
        },
        id: true,
      },
    });
    const [data, tableInfo] = await Promise.all([
      dataPromis,
      tableInfoPromis,
    ]).catch((error) => {
      console.log(error);
      throw new InternalServerErrorException(constants.InternalError, {
        cause: error,
      });
    });

    if (!tableInfo) throw new NotFoundException();

    const selfInfo = {
      sessionId,
      tableSectionId: tableInfo.tableSectionId,
      tableNumber: tableInfo.tableNumber,
    };

    return { jwtToken, selfInfo, data };
  }
}
