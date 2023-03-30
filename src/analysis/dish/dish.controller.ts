import { Controller } from '@nestjs/common';
import { DishService } from './dish.service';

@Controller('dish')
export class DishController {
  constructor(private readonly dishService: DishService) {}
}
