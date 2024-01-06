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

        let snakersForResponse: Sneakers[][] | string;
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
        const modelNamesGoogle: string[] = values.find((oneArr: string[]): boolean => oneArr[0].trim().toLowerCase() === 'імя');
        const modelPricesGoogle: string[] = values.find((oneArr: string[]) => oneArr[0].trim().toLowerCase() === 'ціна');
        const modelArticlesGoogle: string[] = values.find(oneArr => oneArr[0].trim().toLowerCase() === 'код товару');
        const whereStartDimentionsGoogle: number = values.findIndex(oneArr => oneArr[0].trim().toLowerCase() === 'розміри');
        /*  const countNewDimensions: number = values.length - 1 - whereStartDimentions;*/
        if (modelNamesGoogle.length <= 1) throw new HttpException('Not found in this link any sneakers', HttpStatus.NOT_FOUND);
        const sneakersList: Promise<Sneakers>[] = [];

        /*create schema dimensions*/
        const arrPromisesDimensions: Promise<Dimention>[] = [];
        for (let j = whereStartDimentionsGoogle + 1; j < values.length; j++) {
            const newDimention: Dimention = this.dimensionRepository.create({
                size: +values[j][0],
            });
            const dimensionExistInDb: Dimention | null = await this.dimensionRepository.findOne({
                where: {size: newDimention.size}
            });
            if (!dimensionExistInDb) {
                arrPromisesDimensions.push(this.dimensionRepository.save(newDimention));
                this.logger.log(`New additional dimension ${newDimention.size} created from ${currentModel.model}`);
            }
        }

        if (arrPromisesDimensions.length) {
            /*save new dimensions in db*/
            const savedDimensions: Dimention[] = await Promise.all(arrPromisesDimensions);
            /*adding relation - in Model arr all dimensions*/
            currentModel.allModelDimensions = savedDimensions;
            await this.modelsRepository.save(currentModel);
            this.logger.log(`**Was saved ${arrPromisesDimensions.length} new additional dimensions`);
        }

        //create table sneakers
        for (let numModel = 1; numModel < modelNamesGoogle.length; numModel++) {
            /*first of all try find sneaker exist in db*/
            let newSneakerOrExist: Sneakers | null = await this.sneakersRepository.findOne({
                where: {name: modelNamesGoogle[numModel].replace(/\n/g, '')},
                relations: ['availableDimensions']
            });
            const isNewSneaker: boolean = !newSneakerOrExist;
            let isChangePrice: boolean = false;
            /*if not exist create new*/
            if (!newSneakerOrExist)
                newSneakerOrExist = this.sneakersRepository.create({
                    name: modelNamesGoogle[numModel].replace(/\n/g, ''),
                    price: +modelPricesGoogle[numModel],
                    article: +modelArticlesGoogle[numModel],
                    model: currentModel,
                    availableDimensions: [],
                });
            else { /*if exist update price and article*/
                if (newSneakerOrExist.price !== +modelPricesGoogle[numModel]) {
                    isChangePrice = true;
                    newSneakerOrExist.price = +modelPricesGoogle[numModel];
                }
                if (newSneakerOrExist.article !== +modelArticlesGoogle[numModel]) {
                    isChangePrice = true;
                    newSneakerOrExist.article = +modelArticlesGoogle[numModel];
                }
            }

            /*add present dimensions for this model*/
            const googleAvailableDimensions: Dimention[] = [];
            for (let j = whereStartDimentionsGoogle + 1; j < values.length; j++)
                if (values[j][numModel] === '+') {
                    const dimensionFromInDb: Dimention | null = await this.dimensionRepository.findOne({
                        where: {size: +values[j][0]}
                    });
                    googleAvailableDimensions.push(dimensionFromInDb);
                }
            /*add additional check if dimension present in snaker */
            if (!isNewSneaker) {
                const oldDimensions: Dimention[] = newSneakerOrExist.availableDimensions;
                const newDimensions: Dimention[] = googleAvailableDimensions;
                if (oldDimensions.length !== newDimensions.length) isChangePrice = true;
                else {
                    const isDimensionExist: boolean = newDimensions.some((newDimension: Dimention) => {
                        return oldDimensions.some((oldDimension: Dimention): boolean => {
                            if (oldDimension.id === newDimension.id) return true;
                        });
                    });
                    if (!isDimensionExist) isChangePrice = true;
                }
            }

            //if was same change parameters in old sneakers Or created New Sneaker -  add to list for save
            if (isChangePrice || isNewSneaker) {
                console.log('PUSH-', newSneakerOrExist);
                newSneakerOrExist.availableDimensions = googleAvailableDimensions;
                sneakersList.push(this.sneakersRepository.save(newSneakerOrExist));
            }
        }

        /*if was not any changes in sneakers we skip wait save*/
        console.log('sneakersList.length-', sneakersList.length);
        if (sneakersList.length) {
            console.log('if');
            const responseSnakes: Sneakers[] = await Promise.all(sneakersList);
            this.logger.log(`Was saved ${responseSnakes.length} new sneakers for model ${currentModel.model}`);
            return responseSnakes;
        }
        return [];
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



