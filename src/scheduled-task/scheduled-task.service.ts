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

        const createdModels: Model[] = await Promise.all(
            urls.map(url => this.checkAndCreateModel(this.extractModelNameFromUrl(url)))
        );

        const axiosDimens = axiosData[0]["values"].slice(4);
        /*create for new dimension schema*/
        await Promise.all(
            axiosDimens.map(async (oneArr: string[]): Promise<Dimention[]> => {
                const arrPromisesDimensions: Promise<Dimention>[] = [];

                const newDimention: Dimention = this.dimensionRepository.create({
                    size: +oneArr[0],
                });
                const dimensionExistInDb: Dimention | null = await this.dimensionRepository.findOne({
                    where: {size: newDimention.size}
                });
                if (!dimensionExistInDb) {
                    arrPromisesDimensions.push(this.dimensionRepository.save(newDimention));
                    this.logger.log(`New additional dimension ${newDimention.size} CREATED`);
                }
                /*save new dimensions in db*/
                if (arrPromisesDimensions.length) {
                    const savedDimensions: Dimention[] = await Promise.all(arrPromisesDimensions);
                    this.logger.log(`*Saved ${arrPromisesDimensions.length} new additional dimensions`);
                    return savedDimensions;
                }

            })
        );

        const snakersForResponse: Sneakers[][] = await Promise.all(
            axiosData.map((data, index) => this.createSnakers(data["values"], createdModels[index]))
        );

        return {
            "status_code": HttpStatus.OK,
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

    /*todo check relation model sneakers*/
    private async createSnakers(values: string[][], currentModel: Model): Promise<Sneakers[]> {
        const sneakersList: Promise<Sneakers>[] = [];
        const modelNamesGoogle: string[] = values.find((oneArr: string[]): boolean => oneArr[0].trim().toLowerCase() === 'імя');
        const modelPricesGoogle: string[] = values.find((oneArr: string[]) => oneArr[0].trim().toLowerCase() === 'ціна');
        const modelArticlesGoogle: string[] = values.find(oneArr => oneArr[0].trim().toLowerCase() === 'код товару');
        const whereStartDimentionsGoogle: number = values.findIndex(oneArr => oneArr[0].trim().toLowerCase() === 'розміри');
        if (modelNamesGoogle.length <= 1) throw new HttpException('Not found in this link any sneakers', HttpStatus.NOT_FOUND);


        /*adding relation - in Model arr all dimensions*/
        const arrDimensionFromDb: Dimention[] = [];
        for (let j = whereStartDimentionsGoogle + 1; j < values.length; j++) {
            const dimensionExistInDb: Dimention | null = await this.dimensionRepository.findOne({
                where: {size: +values[j][0]}
            });
            if (!dimensionExistInDb)
                arrDimensionFromDb.push(dimensionExistInDb);
        }

        if (arrDimensionFromDb.length) {
            currentModel.allModelDimensions = arrDimensionFromDb;
            const tempM = await this.modelsRepository.save(currentModel);
            this.logger.log(`Saved ${tempM.allModelDimensions.length} new additional dimensions for model ${currentModel.model}`);
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
            const googleAvailableDimensions: { size: number }[] = [];
            for (let dimens = whereStartDimentionsGoogle + 1; dimens < values.length; dimens++)
                if (values[dimens][numModel] === '+')
                    googleAvailableDimensions.push({size: +values[dimens][0]});

            console.log('googleAvailableDimensions-', googleAvailableDimensions);
            /*add additional check if dimension present in sneaker if no it will be changes */
            if (!isNewSneaker) {
                const oldDimensions: Dimention[] = newSneakerOrExist.availableDimensions;
                const newDimensions: { size: number }[] = googleAvailableDimensions;
                if (oldDimensions.length !== newDimensions.length)
                    isChangePrice = true;
                else if (oldDimensions.length !== 0 && newDimensions.length !== 0) {
                    const isDimensionExist: boolean = newDimensions.some((newDimension: Dimention) => {
                        return oldDimensions.some((oldDimension: Dimention): boolean =>
                            oldDimension.size === newDimension.size
                        );
                    });
                    isChangePrice = !isDimensionExist;
                }
            }

            //if was same change parameters in old sneakers Or created New Sneaker -  add to list for save
            if (isChangePrice || isNewSneaker) {
                const dimensionExistInDb: Dimention[] = await this.dimensionRepository.find({
                    where: googleAvailableDimensions.map((oneDimens: { size: number }): { size: number } => {
                        return {size: oneDimens.size}
                    })
                });
                newSneakerOrExist.availableDimensions = dimensionExistInDb;
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
        return isModelExistInDb;
    }
}



