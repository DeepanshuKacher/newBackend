import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { JwtPayload_restaurantId, Order } from "src/Interfaces";
import {
  KotCreation,
  constants,
  mqttPublish,
  // orderConstants,
  redisClient,
  redisConstants,
  redisGetFunction,
  redis_create_Functions,
} from "src/useFullItems";
import { CreateOrderDto, KotId } from "./dto/create-order.dto";
import { UpdateOrderStatusDto } from "./dto/update-orderStatus.dto";
import { PrismaService } from "src/prisma/prisma.service";
import { DeleteOrderDto } from "./dto/delete-order.dto";
import { UpdateOrderDto } from "./dto/update-order.dto";

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) { }

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

    const kotCount = await redisClient.INCR(`${payload.restaurantId}:kotCount`);

    try {


      await redis_create_Functions.createOrder({
        createdAt,
        kotId,
        orderedBy: payload?.userId || "self",
        restaurantId: payload.restaurantId,
        sessionId,
        tableNumber,
        tableSectionId,
        dishId,
        fullQuantity: fullQuantity || 0,
        halfQuantity: halfQuantity || 0,
        orderId: constants.workerTokenGenerator(16),
        size,
        user_description,
        chefAssign: "",
        printCount: 0,
        kotCount
      });


      mqttPublish.dishOrder([
        {
          createdAt,
          kotId,
          orderedBy: payload?.userId || "self",
          restaurantId: payload.restaurantId,
          sessionId,
          tableNumber,
          tableSectionId,
          dishId,
          fullQuantity: fullQuantity || 0,
          halfQuantity: halfQuantity || 0,
          orderId: constants.workerTokenGenerator(16),
          size,
          user_description,
          chefAssign: "",
          printCount: 0,
          kotCount
        },
      ]);

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

  /*   getOrder_logs(payload: JwtPayload_restaurantId) {
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
    } */

  async deleteOrder(dto: DeleteOrderDto) {
    const { orderId } = dto;

    try {
      await redisClient.del(redisConstants.orderKey(orderId));

      return constants.OK;


    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }

  }
  async updateOrder(dto: UpdateOrderDto) {
    const { orderId, newFullQuantity, newHalfQuantity } = dto;

    // if order not found throw error

    const data = await redisGetFunction.getOrder(orderId)

    if (!data) throw new NotFoundException()

    if (parseInt(data.fullQuantity) === 0 && newFullQuantity !== 0) throw new ConflictException()

    if (parseInt(data.halfQuantity) === 0 && newHalfQuantity !== 0) throw new ConflictException()



    await redisClient.hSet(redisConstants.orderKey(orderId), ['fullQuantity', newFullQuantity, 'halfQuantity', newHalfQuantity])

    return constants.OK
  }
  async printCountIncrement(kotId: Order['kotId']) {
    const orders = (await redisClient.ft.search(redisConstants.restaurantOrderIndex, `@kotId:{${kotId}}`)).documents

    const orderPrintCountIncrementPromise: Promise<number>[] = [];

    for (const order of orders) {

      const temp = redisClient.hIncrBy(order.id, 'printCount', 1)

      orderPrintCountIncrementPromise.push(temp)

    }

    try {

      await Promise.all(orderPrintCountIncrementPromise)
    } catch (error) {

      console.log(error)
      throw new InternalServerErrorException()
    }
  }
}
