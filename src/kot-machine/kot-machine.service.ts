import { ForbiddenException, Injectable, InternalServerErrorException } from "@nestjs/common";
import type { Response, Request } from "express";
import { Order } from "src/Interfaces";
import { AuthService } from "src/auth/auth.service";
import { UserType } from "src/auth/dto";
import { redisClient, redisConstants } from "src/useFullItems";
import { constants } from "src/useFullItems/constants";

@Injectable()
export class KotMachineService {
  constructor(private readonly authService: AuthService) { }

  login(response: Response, restaurantId: string) {
    // response.clearCookie(constants.restaurantId);
    // response.clearCookie(constants.sessionId);

    const code = constants.workerTokenGenerator(16);

    response.cookie(constants.sessionId, code, {
      domain: constants.globalDomain,
      secure: constants.IS_DEVELOPMENT ? false : true,
      signed: true,
      sameSite: "strict",
      httpOnly: true,
      // expires: new Date(
      //   `${currentDateTime.getMonth()} ${currentDateTime.getDate()} ${currentDateTime.getFullYear()} 23:59:55`,
      // ),
      maxAge: constants.timeConstants.daysFromMilliSeconds(100),
    });

    response.cookie(constants.restaurantId, restaurantId, {
      domain: constants.globalDomain,
      secure: constants.IS_DEVELOPMENT ? false : true,
      signed: true,
      sameSite: "strict",
      httpOnly: true,
      // expires: new Date(
      //   `${currentDateTime.getMonth()} ${currentDateTime.getDate()} ${currentDateTime.getFullYear()} 23:59:55`,
      // ),
      maxAge: constants.timeConstants.daysFromMilliSeconds(100),
    });

    //if user have default restro then redirect to main app without asking

    // else redirect to add restro page

    return "OK";
  }

  getJwt(request: Request) {
    const restaurantId = request.signedCookies[constants.restaurantId];
    const sessionId = request.signedCookies[constants.sessionId];

    if (!(restaurantId && sessionId)) throw new ForbiddenException();

    const jwt = this.authService.jwt_token_with_restaurantId({
      restaurantId,
      userId: sessionId,
      userType: UserType.MACHINE,
    });

    return {
      jwt: jwt.access_token,
      restaurantId,
      sessionId,
    };
  }
}
