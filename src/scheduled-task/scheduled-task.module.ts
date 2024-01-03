import {Module} from '@nestjs/common';
import {ScheduledTaskService} from './scheduled-task.service';
import {ScheduledTaskController} from './scheduled-task.controller';
import {ScheduleModule} from '@nestjs/schedule';
import {TypeOrmModule} from "@nestjs/typeorm";
import {Item} from "./entities/item.entity";
import {HttpModule} from "@nestjs/axios";
import {ConfigModule, ConfigService} from '@nestjs/config';

@Module({
    controllers: [ScheduledTaskController],
    providers: [ScheduledTaskService],
    imports: [ScheduleModule.forRoot(),
        TypeOrmModule.forFeature([Item]),
        HttpModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                timeout: configService.get('HTTP_TIMEOUT'),
                maxRedirects: configService.get('HTTP_MAX_REDIRECTS'),
            }),
            inject: [ConfigService],
        })
    ],
    exports: [ScheduledTaskService]
})
export class ScheduledTaskModule {
}
