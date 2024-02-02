import {HttpStatus, Injectable} from '@nestjs/common';
import {GeneralResponse} from "./interface/generalResponse.interface";

@Injectable()
export class GenResponceService {
  async findAll(): Promise<GeneralResponse<string>> {
    return {
      "status_code": HttpStatus.OK,
      "detail": "ok2",
      "result": "working"
    };
  }

}
