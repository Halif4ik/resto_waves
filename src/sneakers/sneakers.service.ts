import {HttpException, HttpStatus, Injectable, Logger} from '@nestjs/common';
import {InjectRepository} from "@nestjs/typeorm";
import {Sneakers} from "../scheduled-task/entities/sneakers.entity";
import {Repository} from "typeorm";
import {Dimention} from "../scheduled-task/entities/dimention.entity";
import {Model} from "../scheduled-task/entities/model.entity";
import {ConfigService} from "@nestjs/config";
import {GeneralResponse} from "../gen-responce/interface/generalResponse.interface";
import {IAllSneakers, IOneSneaker} from "../gen-responce/interface/customResponces";
import process from "process";
import {PaginationsSneakersDto} from "./dto/paginations-sneaker.dto";
import {UpdateSneakerDto} from "./dto/update-sneaker.dto";
import {GetDimensionDto} from "./dto/dimension.dto";
import {GetModelDto} from "./dto/get-model.dto";

@Injectable()
export class SneakersService {
    private readonly logger: Logger = new Logger(SneakersService.name);

    constructor(@InjectRepository(Sneakers) private readonly sneakersRepository: Repository<Sneakers>,
                @InjectRepository(Dimention) private readonly dimensionRepository: Repository<Dimention>,
                @InjectRepository(Model) private readonly modelsRepository: Repository<Model>,
                private readonly configService: ConfigService,) {
    }

    async findAll(paginationsSneakersDto: PaginationsSneakersDto): Promise<GeneralResponse<IAllSneakers>> {
        const {page, revert} = paginationsSneakersDto;
        const order = revert ? 'DESC' : 'ASC';
        const startPage: number = page ? page : 1;
        const sneakers: Sneakers[] = await this.sneakersRepository.find({
            take: this.configService.get<number>('PAGE_PAGINATION'),
            skip: (startPage - 1) * this.configService.get<number>('PAGE_PAGINATION'),
            order: {
                id: order,
            },
            relations: ["availableDimensions", "model"],
        })
        return {
            "status_code": HttpStatus.OK,
            "detail": {
                "sneakers": sneakers ? sneakers : [],
            },
            "result": "working"
        };

    }

    async findOne(id: number): Promise<GeneralResponse<IOneSneaker>> {
        const sneaker: Sneakers | null = await this.sneakersRepository.findOne({
            relations: ["availableDimensions", "model"],
            where: {id: id}
        });
        return {
            "status_code": HttpStatus.OK,
            "detail": {
                "sneaker": sneaker,
            },
            "result": "working"
        };
    }

    async updateNameSneaker(updateSneakerDto: UpdateSneakerDto): Promise<GeneralResponse<IOneSneaker>> {
        const targetSneakers: Sneakers | null = await this.sneakersRepository.findOne({
            where: {id: updateSneakerDto.id}
        });
        if (!targetSneakers) throw new HttpException("Sneaker not found", HttpStatus.BAD_REQUEST);

        targetSneakers.name = updateSneakerDto.nameSneakers;
        await this.sneakersRepository.save(targetSneakers);
        return {
            "status_code": HttpStatus.OK,
            "detail": {
                "sneaker": targetSneakers,
            },
            "result": "updated"
        };
    }

    async findSneakers(getDimensionDto: GetDimensionDto): Promise<GeneralResponse<IAllSneakers>> {
        const sneakersInDimension: Sneakers[] | null = await this.sneakersRepository.find({
            relations: ["availableDimensions"],
            where: {availableDimensions: {size: getDimensionDto.dimension}}
        });
        return {
            "status_code": HttpStatus.OK,
            "detail": {
                "sneakers": sneakersInDimension ? sneakersInDimension : [],
            },
            "result": "updated"
        };
    }

    async findSneakersByModel(getModelDto: GetModelDto): Promise<GeneralResponse<any>> {
        const sneakersByModel  = await this.modelsRepository.find({
            relations: ["allModelDimensions", "sneakers"],
            where: {model: getModelDto.model}
        });
        console.log('sneakersByModel-',sneakersByModel);
        return {
            "status_code": HttpStatus.OK,
            "detail": {
                "sneakers": sneakersByModel ? sneakersByModel : [],
            },
            "result": "updated"
        };
    }

}
