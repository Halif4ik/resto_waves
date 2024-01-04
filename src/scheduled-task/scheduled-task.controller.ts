import {Controller, Get,} from '@nestjs/common';
import {ScheduledTaskService} from './scheduled-task.service';
import {GeneralResponse} from "../gen-responce/interface/generalResponse.interface";

@Controller('scheduled-task')
export class ScheduledTaskController {
    constructor(private readonly scheduledTaskService: ScheduledTaskService) {
    }

    //1.All user can get data from google sheets
    //Endpoint: GET /scheduled-task/refresh
    //Permissions: All users
    @Get('refresh')
    loadData(): Promise<GeneralResponse<any>> {
        return this.scheduledTaskService.loadData();
    }

}
