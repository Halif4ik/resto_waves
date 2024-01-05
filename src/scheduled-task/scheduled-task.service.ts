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

    async onApplicationBootstrap(): Promise<void> {
        await this.loadData();
    }

    @Cron(CronExpression.EVERY_HOUR)
    async loadData(): Promise<GeneralResponse<IRespLoadData>> {
        const urls: string[] = [
            "https://sheets.googleapis.com/v4/spreadsheets/" +
            this.configService.get<string>('GOOGLE_DOC_KEY') +
            "/values/" + encodeURI(this.configService.get<string>('SHEET_PAGE_1')) +
            this.configService.get<string>('GOOGLE_SHEET_RANGE') + "?key=" +
            this.configService.get<string>('GOOGLE_API_KEY'),

            "https://sheets.googleapis.com/v4/spreadsheets/" +
            this.configService.get<string>('GOOGLE_DOC_KEY') +
            "/values/" + encodeURI(this.configService.get<string>('SHEET_PAGE_2')) +
            this.configService.get<string>('GOOGLE_SHEET_RANGE') + "?key=" +
            this.configService.get<string>('GOOGLE_API_KEY')
        ];

        let snakersForResponse
        let status_code: number;
        let axiosData: any;
        try {
            const axiosResponses: AxiosResponse<any, any>[] = await Promise.all(
                urls.map((url: string) => this.httpService.get<any>(url).toPromise())
            );

            axiosData = axiosResponses.map((response: AxiosResponse<any, any>) => response.data);
        } catch (error) {
            console.error('Error loading data:', error[0]);
            snakersForResponse = error[0];
            status_code = +error[1];
        }

        if (!axiosData || axiosData.some(data => !data["values"] || data["values"].length === 0))
            throw new HttpException('Not found in one of the links any sneakers', HttpStatus.NOT_FOUND);

        const createdModels: Model[] = await Promise.all(
            urls.map(url => this.checkAndCreateModel(this.extractModelNameFromUrl(url)))
        );

        snakersForResponse = await Promise.all(
            axiosData.map((data, index) => this.createSnakers(data["values"], createdModels[index]))
        );

        status_code = HttpStatus.OK;
        return {
            "status_code": status_code,
            "detail": {
                "loadData": snakersForResponse,
            },
            "result": "working"
        };
    }

    private extractModelNameFromUrl(url: string): string {
        // Split the URL based on '/' and get the part containing the model name
        const parts: string[] = url.split('/');
        // Decode the URI-encoded model name
        const decodedModelName: string = decodeURI(parts[7]);
        // For example, if the model name is followed by !A, you can split it again and return the desired part
        const modelNameParts: string[] = decodedModelName.split('!A');
        return modelNameParts[0];
    }

    private async createSnakers(values: string[][], currentModel: Model): Promise<Sneakers[]> {
        const modelNames: string[] = values.find((oneArr: string[]): boolean => oneArr[0].trim().toLowerCase() === 'імя');
        const modelPrices: string[] = values.find((oneArr: string[]) => oneArr[0].trim().toLowerCase() === 'ціна');
        const modelArticles: string[] = values.find(oneArr => oneArr[0].trim().toLowerCase() === 'код товару');
        const whereStartDimentions: number = values.findIndex(oneArr => oneArr[0].trim().toLowerCase() === 'розміри');
        /*  const countNewDimensions: number = values.length - 1 - whereStartDimentions;*/
        if (modelNames.length <= 1) throw new HttpException('Not found in this link any sneakers', HttpStatus.NOT_FOUND);
        const sneakersList: Promise<Sneakers>[] = [];

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
            let newModelExis: Sneakers | null = await this.sneakersRepository.findOne({
                where: {name: modelNames[numModel].replace(/\n/g, '')}
            });
            /*if not exist create new*/
            if (!newModelExis) newModelExis = this.sneakersRepository.create({
                name: modelNames[numModel].replace(/\n/g, ''),
                price: +modelPrices[numModel],
                article: +modelArticles[numModel],
                model: currentModel,
                availableDimensions: [],
            });
            else { /*if exist update price and article*/
                newModelExis.price = +modelPrices[numModel];
                newModelExis.article = +modelArticles[numModel];
            }

            /*add present dimensions for this model*/
            const tempAvailableDimensions: Dimention[] = [];
            for (let j = whereStartDimentions + 1; j < values.length; j++)
                if (values[j][numModel] === '+') {
                    const dimensionFromInDb: Dimention | null = await this.dimensionRepository.findOne({
                        where: {size: +values[j][0]}
                    });
                    tempAvailableDimensions.push(dimensionFromInDb);
                }
            newModelExis.availableDimensions = tempAvailableDimensions;
            sneakersList.push(this.sneakersRepository.save(newModelExis));
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



