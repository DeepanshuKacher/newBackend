import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { JwtPayload_restaurantId, RetreveKotJson } from "src/Interfaces";
import {
  KotCreation,
  constants,
  mqttPublish,
  orderConstants,
  redisClient,
  redisConstants,
  redisGetFunction,
  redis_create_Functions,
  redis_update_functions,
} from "src/useFullItems";
import { CreateOrderDto, KotId } from "./dto/create-order.dto";
import { UpdateOrderStatusDto } from "./dto/update-orderStatus.dto";
import { PrismaService } from "src/prisma/prisma.service";
import { DateTime } from "luxon";
import { DeleteOrderDto } from "./dto/delete-order.dto";
import { UpdateOrderDto } from "./dto/update-order.dto";

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createOrderDto: CreateOrderDto,
    payload: JwtPayload_restaurantId,
  ) {
    const {
      dishId,
      tableNumber,
      tableSectionId,
      user_description,
      sessionId,
      size,
      fullQuantity,
      halfQuantity,
    } = createOrderDto;

    if (!(fullQuantity || halfQuantity)) throw new ForbiddenException();

    const sessionIdFromRedis = await redisGetFunction.sessionIdFromTableInfo(
      payload.restaurantId,
      tableSectionId,
      tableNumber,
    );

    if (!sessionIdFromRedis) throw new ConflictException();

    if (sessionIdFromRedis !== redisConstants.sessionKey(sessionId))
      throw new ConflictException();

    const kotId = constants.workerTokenGenerator(16);
    const createdAt = Date.now();

    const kotNoPromise = redisClient.INCR(`${payload.restaurantId}:kotCount`);
    const dateTime = DateTime.now().endOf("day").toUnixInteger();

    const [kotNo, setKotCountExpire] = await Promise.all([
      kotNoPromise,
      redisClient.EXPIREAT(`${payload.restaurantId}:kotCount`, dateTime, "NX"),
    ]);

    await redis_create_Functions.createOrder({
      // cart: 0,
      createdAt,
      kotId,
      orderedBy: payload?.userId || "self",
      restaurantId: payload.restaurantId,
      sessionId,
      tableNumber,
      tableSectionId,
      kotNo,
      printCount: 0,
      orders: [
        {
          // cart: 0,
          completed: 0,
          createdAt,
          dishId,
          fullQuantity: fullQuantity || 0,
          halfQuantity: halfQuantity || 0,
          kotId,
          orderedBy: payload?.userId || "self",
          orderId: constants.workerTokenGenerator(16),
          restaurantId: payload.restaurantId,
          size,
          tableNumber,
          tableSectionId,
          user_description,
          sessionId,
          chefAssign: "",
        },
      ],
    });

    // const pushOrderToTableSessionPromis = redis_create_Functions.tableSession(
    //   sessionId,
    //   orderId,
    // );

    // const pushOrderToRestaurantContainerPromis =
    //   redis_create_Functions.restaurantRealtimeOrdersContainer(
    //     payload.restaurantId,
    //     orderId,
    //   );

    // const createKotPromise = redis_create_Functions.kot(orderId, [
    //   redisConstants.orderKey(orderId),
    // ]);

    // const pushKotToRestaurantContainerPromise =
    //   redis_create_Functions.restaurantKotContainerPush(
    //     payload.restaurantId,
    //     redisConstants.kot_key(orderId),
    //   );

    try {
      // const [
      //   createOrder,
      //   pushOrderToTableSession,
      //   pushOrderToRestaurantContainer,
      // ] = await Promise.all([
      //   createOrderPromis,
      //   pushOrderToTableSessionPromis,
      //   pushOrderToRestaurantContainerPromis,
      //   createKotPromise,
      //   pushKotToRestaurantContainerPromise,
      // ]);

      mqttPublish.dishOrder({
        id: `kot:${kotId}`,
        value: {
          chefAssign: "",
          completed: 0,
          createdAt,
          kotId,
          orderedBy: payload?.userId || "self",
          restaurantId: payload.restaurantId,
          sessionId,
          tableNumber,
          tableSectionId,
          kotNo,
          printCount: 0,
          orders: [
            {
              // cart: 0,
              completed: 0,
              createdAt,
              dishId,
              fullQuantity: fullQuantity || 0,
              halfQuantity: halfQuantity || 0,
              kotId,
              orderedBy: payload?.userId || "self",
              orderId: constants.workerTokenGenerator(16),
              restaurantId: payload.restaurantId,
              size,
              tableNumber,
              tableSectionId,
              user_description,
              sessionId,
              chefAssign: "",
            },
          ],
        },
      });

      return constants.OK;
    } catch (error) {
      if (constants.IS_DEVELOPMENT) console.log(error);
      throw new InternalServerErrorException(constants.InternalError, {
        cause: error,
      });
    }
  }

  async findAll(payload: JwtPayload_restaurantId) {
    const orders = await redisClient.ft.search(
      redisConstants.restaurantOrderIndex,
      `@restaurantId:{${payload.restaurantId}}`,
      {
        LIMIT: {
          from: 0,
          size: 10000,
        },
        SORTBY: {
          BY: "createdAt",
          DIRECTION: "ASC",
        },
      },
    );

    // console.log({ orders: orders.total });
    // console.log({ orders: orders.documents });

    return orders.documents;
    // const restaurantOrderPromisYesterday = redisClient.LRANGE(
    //   redisConstants.restaurantRealtimeOrdersContainer_Yesterday_Key(
    //     payload.restaurantId,
    //   ),
    //   0,
    //   -1,
    // );

    // const restaurantOrderPromisToday = redisClient.LRANGE(
    //   redisConstants.restaurantRealtimeOrdersContainer_Today_Key(
    //     payload.restaurantId,
    //   ),
    //   0,
    //   -1,
    // );

    // console.log({
    //   key: redisConstants.restaurantRealtimeOrdersContainer_Today_Key(
    //     payload.restaurantId,
    //   ),
    // });

    // const [restaurantOrderDataToday, restaurantOrderDataYesterday] =
    //   await Promise.all([
    //     restaurantOrderPromisToday,
    //     restaurantOrderPromisYesterday,
    //   ]);

    // const todaysOrdersPromis = [];
    // const yesterDaysOrdersPromis = [];

    // for (let x of restaurantOrderDataToday) {
    //   todaysOrdersPromis.push(redisClient.HGETALL(x));
    // }
    // for (let x of restaurantOrderDataYesterday) {
    //   yesterDaysOrdersPromis.push(redisClient.HGETALL(x));
    // }

    // const todaysOrders = await Promise.all(todaysOrdersPromis);
    // const yesterDaysOrders = await Promise.all(yesterDaysOrdersPromis);

    // return yesterDaysOrders.concat(todaysOrders);
  }

  async acceptOrder(
    payload: JwtPayload_restaurantId,
    dto: UpdateOrderStatusDto,
  ) {
    const { orderId, tableNumber, tableSectionId } = dto;

    const chefAssign = await redisClient.json.get(orderId, {
      path: ["chefAssign"],
    });

    if (chefAssign) throw new ConflictException("Order already taken");

    await redisClient.json.set(orderId, "$.chefAssign", payload.userId);

    // const temp: any = await redisClient.json.get(orderId);

    // const kotDetail: RetreveKotJson = temp;

    // console.log(setChef);

    // if (setChef.chefAssign) throw new ConflictException();

    mqttPublish.acceptOrder(
      payload.restaurantId,
      dto.tableNumber,
      dto.tableSectionId,
      dto.orderId,
      payload.userId,
    );

    return constants.OK;
  }

  async rejectOrder(
    payload: JwtPayload_restaurantId,
    dto: UpdateOrderStatusDto,
  ) {
    const { orderId, tableNumber, tableSectionId } = dto;

    const chefAssign = await redisClient.json.get(orderId, {
      path: ["chefAssign"],
    });

    if (chefAssign !== payload.userId) throw new ConflictException();

    await redisClient.json.set(orderId, "$.chefAssign", "");

    mqttPublish.rejectOrder(
      payload.restaurantId,
      dto.tableNumber,
      dto.tableSectionId,
      dto.orderId,
    );

    return constants.OK;
  }
  async completeOrder(
    payload: JwtPayload_restaurantId,
    dto: UpdateOrderStatusDto,
  ) {
    const { orderId, tableNumber, tableSectionId } = dto;

    const kotInfoTemp: any = await redisClient.json.get(orderId, {
      path: ["chefAssign", "completed"],
    });

    const kotInfo: { completed: number; chefAssign: string } = kotInfoTemp;

    if (kotInfo.chefAssign !== payload.userId) throw new ForbiddenException();
    if (kotInfo.completed) throw new ConflictException();

    await redisClient.json.set(orderId, "$.completed", 1);

    mqttPublish.completeOrder(
      payload.restaurantId,
      dto.tableNumber,
      dto.tableSectionId,
      dto.orderId,
    );

    return constants.OK;
  }

  getOrder_logs(payload: JwtPayload_restaurantId) {
    switch (payload.userType) {
      case "Waiter":
        return this.prisma.kotLog.findMany({
          where: {
            waiterId: payload.userId,
          },
          include: {
            session: {
              select: {
                tableId: true,
                tableNumber: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        });

      case "Chef":
        return this.prisma.kotLog.findMany({
          where: {
            chefId: payload.userId,
          },
          include: {
            session: {
              select: {
                tableId: true,
                tableNumber: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        });
      default:
        return this.prisma.kotLog.findMany({
          where: {
            restaurantId: payload.restaurantId,
          },
          include: {
            KotOrder: true,
            table: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        });
    }
  }

  async deleteOrder(dto: DeleteOrderDto) {
    const { orderId, kotId } = dto;

    const kotDetail: any = await redisClient.json.GET(kotId);

    if (!kotDetail) throw new NotFoundException();

    const kotDetailType: KotCreation = kotDetail;

    if (kotDetailType?.orders?.length === 1) {
      await redisClient.json.DEL(kotId);
      return constants.OK;
    }

    const deleteOrderIndex = kotDetailType?.orders?.findIndex(
      (value) => value.orderId === orderId,
    );

    await redisClient.json.ARRPOP(kotId, "$.orders", deleteOrderIndex);

    return constants.OK;

    // const sessionOrders = await redisGetFunction.orderKeysArrayFromSessionUUID(
    //   sessionId,
    // );

    // await redisClient.lRem(
    //   redisConstants.sessionKey(sessionId),
    //   1,
    //   redisConstants.orderKey(orderId),
    // );

    // return constants.OK;

    // console.log({ sessionOrders, orderId: redisConstants.orderKey(orderId) });
  }
  async updateOrder(dto: UpdateOrderDto) {
    const { orderId, halfFull, kotId, newQuantity } = dto;

    const data: any = await redisClient.json.GET(kotId);

    if (!data) throw new NotFoundException();

    const kotDetailType: KotCreation = data;

    const orderIndex = kotDetailType?.orders?.findIndex(
      (item) => item.orderId === orderId,
    );

    if (orderIndex === -1) throw new NotFoundException();

    await redisClient.json.SET(
      kotId,
      `$.orders[${orderIndex}].${halfFull}`,
      newQuantity,
    );

    return constants.OK;

    /*   if (fullQuantity)
      // const fullQuantityUpdate =
      await redis_update_functions.updateOrderQuantity(
        orderId,
        "fullQuantity",
        fullQuantity,
      );

    if (halfQuantity)
      // const halfQuantityUpdate =
      await redis_update_functions.updateOrderQuantity(
        orderId,
        "halfQuantity",
        halfQuantity,
      );

    // await Promise.all([fullQuantityUpdatePromis, halfQuantityUpdatePromis]);

 */
  }

  async incrementPrintCount(kotId: KotId) {
    const { kotId: kot_id } = kotId;
    try {
      await redisClient.json.NUMINCRBY(kot_id, "$.printCount", 1);

      return constants.OK;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
  }
}
