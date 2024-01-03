import { Controller, Get, } from '@nestjs/common';
import { GenResponceService } from './gen-responce.service';
import {GeneralResponse} from "./interface/generalResponse.interface";

@Controller('/')
export class GenResponceController {
  constructor(private readonly genResponceService: GenResponceService) {}

  @Get()
  async findAll(): Promise<GeneralResponse<string>> {
    return this.genResponceService.findAll();
  }
}
