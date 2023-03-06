import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
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

    const tableCurrentSessionId = await redisClient.HGET(
      redisConstants.tablesStatusKey(restaurantId),
      redisConstants.tableSessionKeyForTablesStatus(
        tableSectionId,
        tableNumber,
      ),
    );

    const sessionId = request.signedCookies[constants.sessionId];

    if (tableCurrentSessionId) {
      if (tableCurrentSessionId === redisConstants.sessionKey(sessionId)) {
        return constants.OK;
      } else {
        throw new ForbiddenException();
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
      maxAge: 24 * 60 * 60 * 1000,
    });
    response.cookie(constants.sessionId, sessionUUID, {
      domain: constants.globalDomainForFoodie,
      secure: constants.IS_DEVELOPMENT ? false : true,
      signed: true,
      sameSite: "strict",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    });
    response.cookie(constants.restaurantId, restaurantId, {
      domain: constants.globalDomainForFoodie,
      secure: constants.IS_DEVELOPMENT ? false : true,
      signed: true,
      sameSite: "strict",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
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
      },
    });
    try {
      const [data, tableInfo] = await Promise.all([
        dataPromis,
        tableInfoPromis,
      ]);

      const selfInfo = {
        sessionId,
        tableSectionId: tableInfo.tableSectionId,
        tableNumber: tableInfo.tableNumber,
      };

      return { jwtToken, selfInfo, data };
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(constants.InternalError, {
        cause: error,
      });
    }
  }
}
