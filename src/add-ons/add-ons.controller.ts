import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from "@nestjs/common";
import { Public } from "src/decorators";
import { AddOnsService } from "./add-ons.service";
import { CreateAddOnDto } from "./dto/create-add-on.dto";
import { UpdateAddOnDto } from "./dto/update-add-on.dto";
import { redisClient } from "src/useFullItems";
import { SchemaFieldTypes } from "redis";

@Public() //--------------remove it
@Controller("add-ons")
export class AddOnsController {
  constructor(private readonly addOnsService: AddOnsService) {}

  @Post()
  async create() {
    // return this.addOnsService.create(createAddOnDto);
    try {
      await redisClient.ft.create(
        "idx:animals",
        {
          name: {
            type: SchemaFieldTypes.TEXT,
            SORTABLE: true,
          },
          species: SchemaFieldTypes.TAG,
          age: SchemaFieldTypes.NUMERIC,
        },
        {
          ON: "HASH",
          PREFIX: "noderedis:animals",
        },
      );

      await Promise.all([
        redisClient.hSet("noderedis:animals:1", {
          name: "Fluffy",
          species: "cat",
          age: 3,
        }),
        redisClient.hSet("noderedis:animals:2", {
          name: "Ginger",
          species: "cat",
          age: 4,
        }),
        redisClient.hSet("noderedis:animals:3", {
          name: "Rover",
          species: "dog",
          age: 9,
        }),
        redisClient.hSet("noderedis:animals:4", {
          name: "Fido",
          paddu: "dog",
          age: 7,
        }),
      ]);

      return "OK";
    } catch (error) {
      console.log(error);
      return error;
    }
  }

  @Get()
  findAll() {
    // return this.addOnsService.findAll();
    return redisClient.ft.search("idx:animals", "@species:{dog}", {
      SORTBY: {
        BY: "age",
        DIRECTION: "DESC", // or 'ASC (default if DIRECTION is not present)
      },
    });
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.addOnsService.findOne(+id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() updateAddOnDto: UpdateAddOnDto) {
    return this.addOnsService.update(+id, updateAddOnDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.addOnsService.remove(+id);
  }
}
