import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { OwnerModule } from "./owner/owner.module";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module";
import { RestaurantsModule } from "./restaurants/restaurants.module";
import { DishSectionsModule } from "./dish-sections/dish-sections.module";
import { DishesModule } from "./dishes/dishes.module";
import { AddOnsModule } from "./add-ons/add-ons.module";
import { TablesModule } from "./tables/tables.module";
import { WaitersModule } from "./waiters/waiters.module";
import { S3ImagesModule } from "./s3-images/s3-images.module";
import { MailServiceModule } from "./mail-service/mail-service.module";
import { OrdersModule } from "./orders/orders.module";
import { SessionsModule } from "./sessions/sessions.module";
import { ChefsModule } from "./chefs/chefs.module";
import { CartModule } from "./cart/cart.module";
import { RestaurantSettingModule } from "./restaurant-setting/restaurant-setting.module";
import { FoodieModule } from "./foodie/foodie.module";
import { RestaurantsignupModule } from "./restaurantsignup/restaurantsignup.module";
import { GlobalPrismaFunctionsModule } from "./global-prisma-functions/global-prisma-functions.module";
import { RevenueModule } from "./analysis/revenue/revenue.module";
import { ManagerOwnerModule } from './manager-owner/manager-owner.module';

@Module({
  imports: [
    PrismaModule,
    OwnerModule,
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    RestaurantsModule,
    DishSectionsModule,
    DishesModule,
    AddOnsModule,
    TablesModule,
    WaitersModule,
    S3ImagesModule,
    MailServiceModule,
    OrdersModule,
    SessionsModule,
    ChefsModule,
    CartModule,
    RestaurantSettingModule,
    FoodieModule,
    RestaurantsignupModule,
    GlobalPrismaFunctionsModule,
    RevenueModule,
    ManagerOwnerModule,
  ],
})
export class AppModule {}
