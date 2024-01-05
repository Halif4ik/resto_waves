import {HttpException, HttpStatus, Injectable, Logger, OnApplicationBootstrap} from '@nestjs/common';
import {Cron, CronExpression} from '@nestjs/schedule';
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";
import {Sneakers} from "./entities/sneakers.entity";
import {HttpService} from "@nestjs/axios";
import {AxiosError, AxiosResponse} from "axios";
import {catchError, firstValueFrom} from "rxjs";
import {ConfigService} from "@nestjs/config";
import {GeneralResponse} from "../gen-responce/interface/generalResponse.interface";
import {Dimention} from "./entities/dimention.entity";
import {Model} from "./entities/model.entity";
import {IRespLoadData} from "../gen-responce/interface/customResponces";

@Injectable()
export class ScheduledTaskService implements OnApplicationBootstrap {
    private readonly logger: Logger = new Logger(ScheduledTaskService.name);

    constructor(@InjectRepository(Sneakers) private readonly sneakersRepository: Repository<Sneakers>,
                @InjectRepository(Dimention) private readonly dimensionRepository: Repository<Dimention>,
                @InjectRepository(Model) private readonly modelsRepository: Repository<Model>,
                private readonly httpService: HttpService,
                private readonly configService: ConfigService,) {
    }

    async onApplicationBootstrap() {
        await this.loadData();
    }

    @Cron(CronExpression.EVERY_HOUR)
    async loadData(): Promise<GeneralResponse<IRespLoadData>> {
         const firstPageUrl: string = "https://sheets.googleapis.com/v4/spreadsheets/" + this.configService.get<string>('GOOGLE_DOC_KEY')
             + "/values/" + encodeURI(this.configService.get<string>('SHEET_PAGE_1'))  + this.configService.get<string>('GOOGLE_SHEET_RANGE')
             + "?key="
             + this.configService.get<string>('GOOGLE_API_KEY');
        const secondPageUrl: string = "https://sheets.googleapis.com/v4/spreadsheets/" +
            this.configService.get<string>('GOOGLE_DOC_KEY') +
            "/values/" + encodeURI(this.configService.get<string>('SHEET_PAGE_2')) +
            this.configService.get<string>('GOOGLE_SHEET_RANGE') + "?key="
            + this.configService.get<string>('GOOGLE_API_KEY');

        let snakersForResponce: Sneakers[] | string
        let status_code: number;
        let axiosData: any;
        try {
            const axiosResponse: AxiosResponse<any, any> = await firstValueFrom(
                this.httpService.get<any>(secondPageUrl).pipe(
                    catchError((error: AxiosError) => {
                        this.logger.error(error.response.data);
                        if (error.response.data['error'] && error.response.data['error']['message'])
                            throw [error.response.data['error']['message'], error.response.data['error']['code']];
                        throw 'Wrong url please check url to collection!';
                    }),
                ),
            );
            axiosData = axiosResponse.data;
        } catch (error) {
            console.error('Error loading data:', error[0]);
            snakersForResponce = error[0];
            status_code = +error[1];
        }

        if (!axiosData || axiosData["values"] === undefined || axiosData["values"].length === 0)
            throw new HttpException('Not found in this link any sneakers', HttpStatus.NOT_FOUND);

        const createdModel: Model = await this.checkAndCreateModel(this.configService.get<string>('SHEET_PAGE_2'));
        snakersForResponce = await this.createSnakers(axiosData["values"], createdModel);
        status_code = HttpStatus.OK;
        return {
            "status_code": status_code,
            "detail": {
                "loadData": snakersForResponce,
            },
            "result": "working"
        };
    }


    private async createSnakers(values: string[][], currentModel: Model): Promise<Sneakers[]> {
        const modelNames: string[] = values.find((oneArr: string[]): boolean => oneArr[0].trim().toLowerCase() === 'імя');
        const modelPrices: string[] = values.find((oneArr: string[]) => oneArr[0].trim().toLowerCase() === 'ціна');
        const modelArticles: string[] = values.find(oneArr => oneArr[0].trim().toLowerCase() === 'код товару');
        const whereStartDimentions: number = values.findIndex(oneArr => oneArr[0].trim().toLowerCase() === 'розміри');
        const countDimensions: number = values.length - 1 - whereStartDimentions;
        if (modelNames.length <= 1) throw new HttpException('Not found in this link any sneakers', HttpStatus.NOT_FOUND);
        const sneakersList: Promise<Sneakers>[] = [];
        console.log('countDimentions-', countDimensions);

        /*create schema dimensions*/
        const arrPromisesDimensions: Promise<Dimention>[] = [];
        for (let j = whereStartDimentions + 1; j < values.length; j++) {
            const newDimention: Dimention = this.dimensionRepository.create({
                size: +values[j][0],
            });
            const dimensionExistInDb: Dimention | null = await this.dimensionRepository.findOne({
                where: {size: newDimention.size}

            });
            if (!dimensionExistInDb) {
                arrPromisesDimensions.push(this.dimensionRepository.save(newDimention));
                this.logger.log(`New dimension ${newDimention.size} created`);
            }
        }
        const savedDimensions: Dimention[] = await Promise.all(arrPromisesDimensions);
        /*adding relation - in Model arr all dimensions*/
        currentModel.allModelDimensions = savedDimensions;
        await this.modelsRepository.save(currentModel);
        this.logger.log(`Was saved ${arrPromisesDimensions.length} new dimensions and added in model ${currentModel.model}`);

        //create table sneakers
        for (let numModel = 1; numModel < modelNames.length; numModel++) {
            /*first of all try find model exist*/
            let newModelOrExist: Sneakers | null = await this.sneakersRepository.findOne({
                where: {name: modelNames[numModel].replace(/\n/g, '')}
            });
            /*if not exist create new*/
            if (!newModelOrExist) newModelOrExist = this.sneakersRepository.create({
                name: modelNames[numModel].replace(/\n/g, ''),
                price: +modelPrices[numModel],
                article: +modelArticles[numModel],
                model: currentModel,
                availableDimensions: [],
            });

            /*add present dimensions for this model*/
            const tempAvailableDimensions: Dimention[] = [];
            for (let j = whereStartDimentions + 1; j < values.length; j++)
                if (values[j][numModel] === '+') {
                    const dimensionFromInDb: Dimention | null = await this.dimensionRepository.findOne({
                        where: {size: +values[j][0]}
                    });
                    tempAvailableDimensions.push(dimensionFromInDb);
                }
            newModelOrExist.availableDimensions = tempAvailableDimensions;
            sneakersList.push(this.sneakersRepository.save(newModelOrExist));
        }

        const responseSnakes: Sneakers[] = await Promise.all(sneakersList);
        this.logger.log(`Was saved ${responseSnakes.length} new sneakers`);
        return responseSnakes;
    }


    private async checkAndCreateModel(modelName: string): Promise<Model> {
        const newModel: Model = this.modelsRepository.create({
            model: modelName,
        });
        const isModelExistInDb: Model | null = await this.modelsRepository.findOne({
            where: {model: newModel.model}
        });
        if (!isModelExistInDb) {
            this.logger.log(`New model ${modelName} created`);
            return this.modelsRepository.save(newModel);
        }
        this.logger.log(`Model ${modelName} already exist`);
        return isModelExistInDb;
    }
}



