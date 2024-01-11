import {HttpException, HttpStatus, Injectable, Logger} from '@nestjs/common';
import {InjectRepository} from "@nestjs/typeorm";
import {Sneakers} from "../scheduled-task/entities/sneakers.entity";
import {Repository} from "typeorm";
import {Dimention} from "../scheduled-task/entities/dimention.entity";
import {Model} from "../scheduled-task/entities/model.entity";
import {ConfigService} from "@nestjs/config";
import {GeneralResponse} from "../gen-responce/interface/generalResponse.interface";
import {IAllModels, IAllSneakers, IBrand, IOneSneaker} from "../gen-responce/interface/customResponces";
import {PaginationsSneakersDto} from "./dto/paginations-sneaker.dto";
import {UpdateSneakerDto} from "./dto/update-sneaker.dto";
import {GetDimensionDto} from "./dto/dimension.dto";
import {GetModelDto} from "./dto/get-model.dto";
import {SetBrandDto} from "./dto/set-brand.dto";
import {Brand} from "../scheduled-task/entities/brand.entity";
import {GetBrandsDto} from "./dto/get-brands.dto";

@Injectable()
export class SneakersService {
    private readonly logger: Logger = new Logger(SneakersService.name);

    constructor(@InjectRepository(Sneakers) private readonly sneakersRepository: Repository<Sneakers>,
                @InjectRepository(Dimention) private readonly dimensionRepository: Repository<Dimention>,
                @InjectRepository(Model) private readonly modelsRepository: Repository<Model>,
                @InjectRepository(Brand) private readonly brandRepository: Repository<Brand>,
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
        this.logger.log(`Sneaker with id ${updateSneakerDto.id} was updated with name ${updateSneakerDto.nameSneakers}`);
        return {
            "status_code": HttpStatus.OK,
            "detail": {
                "sneaker": targetSneakers,
            },
            "result": "updated"
        };
    }

    async findSneakers(getDimensionDto: GetDimensionDto): Promise<GeneralResponse<IAllSneakers>> {
        const sneakersInDimension: Sneakers[] = await this.sneakersRepository.find({
            relations: ["availableDimensions"],
            where: {availableDimensions: {size: getDimensionDto.dimension}}
        });
        return {
            "status_code": HttpStatus.OK,
            "detail": {
                "sneakers": sneakersInDimension,
            },
            "result": "updated"
        };
    }

    async findSneakersByModel(getModelDto: GetModelDto): Promise<GeneralResponse<IAllModels>> {
        const sneakersByModel: Model[] = await this.modelsRepository.find({
            relations: ["allModelDimensions", "sneakers"],
            where: {model: getModelDto.model}
        });
        return {
            "status_code": HttpStatus.OK,
            "detail": {
                "sneakers": sneakersByModel,
            },
            "result": "updated"
        };
    }

    async addBrandToModel(setBrandDto: SetBrandDto): Promise<GeneralResponse<IBrand>> {
        const idForSearch: { id: number }[] = setBrandDto.modelIds.map((id) => ({id: id.modelId}));
        const targetModels: Model[] = await this.modelsRepository.find({
            relations: ["brand"],
            where: idForSearch
        });
        if (!targetModels.length) throw new HttpException("Model not found", HttpStatus.BAD_REQUEST);

        let existBrand: Brand | null = await this.brandRepository.findOne({
            where: {brandName: setBrandDto.brandName}
        });

        if (!existBrand) {
            existBrand = this.brandRepository.create({brandName: setBrandDto.brandName});
        }
        existBrand.model = targetModels;
        const result: Brand = await this.brandRepository.save(existBrand);
        this.logger.log(`Brand with name ${setBrandDto.brandName} was added to models with ids ${setBrandDto.modelIds}`);
        return {
            "status_code": HttpStatus.OK,
            "detail": {
                "brand": result,
            },
            "result": "updated"
        };
    }

    async getBrandsWithModels(getBrandDto: GetBrandsDto): Promise<GeneralResponse<IBrand>> {
        const idForSearch: { id: number }[] = getBrandDto.ids.map((id) => ({id: id}));
        const brands: Brand[] = await this.brandRepository.find({
            relations: ["model", "model.sneakers"],
            where: idForSearch
        });
        if (!brands.length) throw new HttpException(`Any brand with this ids ${getBrandDto.ids} not found`, HttpStatus.BAD_REQUEST);

        return {
            "status_code": HttpStatus.OK,
            "detail": {
                "brand": brands,
            },
            "result": "updated"
        };

    }
}
