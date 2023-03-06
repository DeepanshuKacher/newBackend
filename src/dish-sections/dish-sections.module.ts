import { Module } from '@nestjs/common';
import { DishSectionsService } from './dish-sections.service';
import { DishSectionsController } from './dish-sections.controller';

@Module({
  controllers: [DishSectionsController],
  providers: [DishSectionsService]
})
export class DishSectionsModule {}
