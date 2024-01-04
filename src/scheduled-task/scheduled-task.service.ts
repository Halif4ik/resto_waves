import {HttpStatus, Injectable, Logger, OnApplicationBootstrap} from '@nestjs/common';
import {Cron, CronExpression} from '@nestjs/schedule';
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";
import {Sneakers} from "./entities/sneakers.entity";
import {HttpService} from "@nestjs/axios";
import {AxiosError} from "axios";
import {catchError, firstValueFrom} from "rxjs";
import {ConfigService} from "@nestjs/config";
import {GeneralResponse} from "../gen-responce/interface/generalResponse.interface";

@Injectable()
export class ScheduledTaskService implements OnApplicationBootstrap {
    private readonly logger: Logger = new Logger(ScheduledTaskService.name);

    constructor(@InjectRepository(Sneakers) private readonly ItemRepository: Repository<Sneakers>,
                private readonly httpService: HttpService,
                private readonly configService: ConfigService,) {
    }

    async onApplicationBootstrap() {
        await this.loadData();
    }

    @Cron(CronExpression.EVERY_HOUR)
    async loadData(): Promise<GeneralResponse<any>> {
        /* const firstPageUrl: string = "https://sheets.googleapis.com/v4/spreadsheets/" + this.configService.get<string>('GOOGLE_DOC_KEY')
             + "/values/" + encodeURI(this.configService.get<string>('SHEET_PAGE_1'))  + this.configService.get<string>('GOOGLE_SHEET_RANGE')
             + "?key="
             + this.configService.get<string>('GOOGLE_API_KEY');*/
        const secondPageUrl: string = "https://sheets.googleapis.com/v4/spreadsheets/" +
            this.configService.get<string>('GOOGLE_DOC_KEY') +
            "/values/" + encodeURI(this.configService.get<string>('SHEET_PAGE_2')) +
            this.configService.get<string>('GOOGLE_SHEET_RANGE') + "?key="
            + this.configService.get<string>('GOOGLE_API_KEY');
        console.log('URL2-', secondPageUrl);
        let newUser;

        try {
            const {data} = await firstValueFrom(
                this.httpService.get<any>(secondPageUrl).pipe(
                    catchError((error: AxiosError) => {
                        this.logger.error(error.response.data);
                        throw 'An error happened!';
                    }),
                ),
            );
            /*todo two page paralel*/
            console.log('data-', data);
            console.log('values-', data["values"]);
            const parsedData = this.parseData(data);

            /* const newUser = this.ItemRepository.create({...createUserDto, password: hashPassword});
             const createdUser: User = await this.usersRepository.save(newUser);*/
        } catch (error) {
            console.error('Error loading data:', error);
            newUser = null;
        }

        return {
            "status_code": HttpStatus.OK,
            "detail": newUser,
            "result": "working"
        };
    }


    private parseData(rawData: string): any {
        return rawData;
    }
}
