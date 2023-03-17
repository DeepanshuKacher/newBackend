import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  ParseFilePipeBuilder,
  HttpStatus,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { GetJwtPayload, Public } from 'src/decorators';
import { JwtPayload_restaurantId } from 'src/Interfaces';
import { DishesService } from './dishes.service';
import { DeleteDishDto } from './dto';
import { CreateDishDto } from './dto/create-dish.dto';
import { UpdateDishDto } from './dto/update-dish.dto';

@Controller('dishes')
export class DishesController {
  constructor(private readonly dishesService: DishesService) {}

  @Get(':sectionId')
  getSectionDishesh(@Param('sectionId') sectionId: string) {
    return this.dishesService.getSectionDishesh(sectionId);
  }

  @Post('with_image')
  @UseInterceptors(FileInterceptor('image'))
  create_with_image(
    @GetJwtPayload() payload: JwtPayload_restaurantId,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: new RegExp('jpeg|png|jpg|svg|webp') })
        .addMaxSizeValidator({ maxSize: 100000 })
        .build({ errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY }),
    )
    file: Express.Multer.File,
    @Body() dto: CreateDishDto,
  ) {
    return this.dishesService.create_with_image(file, dto, payload);
  }

  // @Post('save_bulk')
  // createBulkDish() {}

  @Post('without_image')
  create_without_image(
    @Body() dto: CreateDishDto,
    @GetJwtPayload() payload: JwtPayload_restaurantId,
  ) {
    return this.dishesService.create_without_image(dto, payload);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDishDto: UpdateDishDto) {
    return this.dishesService.update(id, updateDishDto);
  }

  @Delete(':id')
  remove(
    @GetJwtPayload() payload: JwtPayload_restaurantId,
    @Param('id') id: string,
    @Body() dto: DeleteDishDto,
  ) {
    return this.dishesService.remove(id, dto, payload);
  }
}
