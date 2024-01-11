import {HttpException, HttpStatus, Injectable, Logger, OnApplicationBootstrap} from '@nestjs/common';
import {Cron, CronExpression} from '@nestjs/schedule';
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";
import {Sneakers} from "./entities/sneakers.entity";
import {HttpService} from "@nestjs/axios";
import {AxiosResponse} from "axios";
import {ConfigService} from "@nestjs/config";
import {GeneralResponse} from "../gen-responce/interface/generalResponse.interface";
import {Dimention} from "./entities/dimention.entity";
import {Model} from "./entities/model.entity";
import {IRespLoadData, TModelDimension} from "../gen-responce/interface/customResponces";

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
        let axiosData: any;
        try {
            const axiosResponses: AxiosResponse<any, any>[] = await Promise.all(
                urls.map((url: string) => this.httpService.get<any>(url).toPromise())
            );

            axiosData = axiosResponses.map((response: AxiosResponse<any, any>) => response.data);
        } catch (error) {
            console.error('Error loading data:', error[0]);
            throw new HttpException(`Responce from Googlesheets- ${error[0]} and status_code- ${+error[1]}`, HttpStatus.BAD_REQUEST);
        }
        if (!axiosData || axiosData.some(data => !data["values"] || data["values"].length === 0))
            throw new HttpException('Not found in one of the links any sneakers', HttpStatus.NOT_FOUND);

        /*check and create  new dimension schema*/
        const modelsDimensions: TModelDimension[] = [];
        for (let i = 0; i < axiosData.length; i++) {
            const axiosDimens = axiosData[i]["values"].slice(4);
            const dimensions: Dimention[] = await Promise.all(
                axiosDimens.map(async (oneArr: string[]): Promise<Dimention> => {
                    const newDimention: Dimention = this.dimensionRepository.create({
                        size: +oneArr[0],
                    });
                    const dimensionExistInDb: Dimention | null = await this.dimensionRepository.findOne({
                        where: {size: newDimention.size}
                    });
                    if (!dimensionExistInDb) {
                        this.logger.log(`New additional dimension ${newDimention.size} CREATED`);
                        return this.dimensionRepository.save(newDimention);
                    }
                    return dimensionExistInDb;
                }));
            modelsDimensions.push({
                model: axiosData[i]["range"].slice(1, -8),
                dimensions: dimensions,
            });
        }

        /*check and create  new model schema*/
        const createdModels: Model[] = await Promise.all(
            urls.map((url: string) => this.findOrCreateModel(
                this.extractModelNameFromUrl(url), modelsDimensions))
        );

        /*check and create  new sneakers schema*/
        const snakersForResponse: Sneakers[][] = await Promise.all(
            axiosData.map((data, index) => this.createSneakers(data["values"], createdModels[index], modelsDimensions))
        );
        return {
            "status_code": HttpStatus.OK,
            "detail": {
                "loadData": snakersForResponse,
            },
            "result": "working"
        };
    }

    private async createSneakers(values: string[][], currentModel: Model, modelsDimensions: TModelDimension[]): Promise<Sneakers[]> {
        const sneakersList: Promise<Sneakers>[] = [];
        const modelNamesGoogle: string[] = values.find((oneArr: string[]): boolean => oneArr[0].trim().toLowerCase() === 'імя');
        const modelPricesGoogle: string[] = values.find((oneArr: string[]) => oneArr[0].trim().toLowerCase() === 'ціна');
        const modelArticlesGoogle: string[] = values.find(oneArr => oneArr[0].trim().toLowerCase() === 'код товару');
        const whereStartDimentionsGoogle: number = values.findIndex(oneArr => oneArr[0].trim().toLowerCase() === 'розміри') + 1;
        if (modelNamesGoogle.length <= 1) throw new HttpException('Not found in this link any sneakers', HttpStatus.NOT_FOUND);

        //create table sneakers
        for (let numModel = 1; numModel < modelNamesGoogle.length; numModel++) {
            /*first of all try find sneaker exist in db*/
            let newSneakerOrExist: Sneakers | null = await this.sneakersRepository.findOne({
                where: {name: modelNamesGoogle[numModel].replace(/\n/g, '')},
                relations: ['availableDimensions', 'model']
            });
            const isNewSneaker: boolean = !newSneakerOrExist;
            let isAnyChangeinSneak: boolean = false;
            /*if not exist create new and add relation model*/
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
                    isAnyChangeinSneak = true;
                    newSneakerOrExist.price = +modelPricesGoogle[numModel];
                }
                if (newSneakerOrExist.article !== +modelArticlesGoogle[numModel]) {
                    isAnyChangeinSneak = true;
                    newSneakerOrExist.article = +modelArticlesGoogle[numModel];
                }
            }

            /*add relation dimensions for this sneakers*/
            const googleAvailableDimensions: { size: number }[] = [];
            for (let dimens = whereStartDimentionsGoogle; dimens < values.length; dimens++)
                if (values[dimens][numModel] === '+')
                    googleAvailableDimensions.push({size: +values[dimens][0]});

            /*add additional check if dimension present in sneaker if no it will be changes */
            if (!isNewSneaker) {
                const oldDimensions: Dimention[] = newSneakerOrExist.availableDimensions;
                const newDimensions: { size: number }[] = googleAvailableDimensions;
                if (oldDimensions.length !== newDimensions.length)
                    isAnyChangeinSneak = true;
                else if (oldDimensions.length !== 0 && newDimensions.length !== 0) {
                    const isDimensionExist: boolean = newDimensions.some((newDimension: Dimention) => {
                        return oldDimensions.some((oldDimension: Dimention): boolean =>
                            oldDimension.size === newDimension.size
                        );
                    });
                    isAnyChangeinSneak = !isDimensionExist;
                }
            }

            //if was same change parameters in old sneakers Or created New Sneaker -  add to list for save
            if (isAnyChangeinSneak || isNewSneaker) {
                const dimensionCurentModel: Dimention[] = modelsDimensions.find(
                    (oneModel: TModelDimension) => oneModel.model === currentModel.model).dimensions;
                const dimensionForAdd: Dimention[] = dimensionCurentModel.filter((dimCurentModel: Dimention) => {
                    return googleAvailableDimensions.some((oneDimensGoogle: { size: number }): boolean => {
                        return dimCurentModel.size === oneDimensGoogle.size;
                    });
                });
                newSneakerOrExist.availableDimensions = dimensionForAdd;
                sneakersList.push(this.sneakersRepository.save(newSneakerOrExist));
            }
        }

        /*if was not any changes in sneakers we skip wait save*/
        if (sneakersList.length) {
            const responseSnakes: Sneakers[] = await Promise.all(sneakersList);
            this.logger.log(`Was saved ${responseSnakes.length} new sneakers for model ${currentModel.model}`);
            return responseSnakes;
        }
        return [];
    }

    private async findOrCreateModel(modelName: string, modelsDimensions: TModelDimension[]): Promise<Model> {
        const newModel: Model = this.modelsRepository.create({
            model: modelName,
        });
        const isModelExistInDb: Model | null = await this.modelsRepository.findOne({
            where: {model: newModel.model}
        });
        if (!isModelExistInDb) {
            /*adding relation - in Model arr all dimensions*/
            newModel.allModelDimensions = modelsDimensions.find(
                (oneModel: TModelDimension): boolean => oneModel.model === modelName).dimensions;
            this.logger.log(`New model ${modelName} created`);
            return this.modelsRepository.save(newModel);
        }
        return isModelExistInDb;
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
}



