import {Controller, Get, Body, Patch, Param, ValidationPipe, UsePipes, Query, Post} from '@nestjs/common';
import {SneakersService} from './sneakers.service';
import {GeneralResponse} from "../gen-responce/interface/generalResponse.interface";
import {IAllModels, IAllSneakers, IBrand, IOneSneaker} from "../gen-responce/interface/customResponces";
import {GetSneakerDto} from "./dto/get-sneaker.dto";
import {PaginationsSneakersDto} from "./dto/paginations-sneaker.dto";
import {UpdateSneakerDto} from "./dto/update-sneaker.dto";
import {GetDimensionDto} from "./dto/dimension.dto";
import {GetModelDto} from "./dto/get-model.dto";
import {SetBrandDto} from "./dto/set-brand.dto";
import {GetBrandsDto} from "./dto/get-brands.dto";

@Controller('sneakers')
export class SneakersController {
    constructor(private readonly sneakersService: SneakersService) {
    }

    //1.All  Users can get all items from sneakers table if they are available or will return empty array
    // params: page, revert (optional)
    //Endpoint: Get /sneakers/all?page=2&revert=false
    //Permissions: All  Users
    @Get('all')
    @UsePipes(new ValidationPipe({transform: true, whitelist: true}))
    findAll(@Query() paginationsSneakersDto: PaginationsSneakersDto): Promise<GeneralResponse<IAllSneakers>> {
        return this.sneakersService.findAll(paginationsSneakersDto);
    }

    //2  Users can get one items from sneakers table by id if it is available
    //Endpoint: Get /sneakers/search/:id
    //Permissions: All  Users
    @Get('search/:id')
    @UsePipes(new ValidationPipe({transform: true, whitelist: true}))
    findOne(@Param() getSneakerDTO: GetSneakerDto): Promise<GeneralResponse<IOneSneaker>> {
        return this.sneakersService.findOne(getSneakerDTO.id);
    }

    //3  Users can update name items from sneakers table by id if it is available
    //Endpoint: Patch /sneakers/update
    //Permissions: All  Users
    @Patch('/update')
    @UsePipes(new ValidationPipe({transform: true, whitelist: true}))
    updateSneaker(@Body() updateSneakerDto: UpdateSneakerDto): Promise<GeneralResponse<IOneSneaker>> {
        return this.sneakersService.updateNameSneaker(updateSneakerDto);
    }

    //4  Users can find sneakers by name and dimension
    //Endpoint: Get /sneakers/find?dimension=41
    //Permissions: All  Users
    @Get('/find')
    @UsePipes(new ValidationPipe({transform: true, whitelist: true}))
    findSneakers(@Query() getDimensionDto: GetDimensionDto): Promise<GeneralResponse<IAllSneakers>> {
        return this.sneakersService.findSneakers(getDimensionDto);
    }

    //5 Users can find sneakers by model Adidas Yeezy 700
    //Endpoint: Get /sneakers/models?model=Adidas%20Yeezy%20700
    @Get('/models')
    @UsePipes(new ValidationPipe({transform: true, whitelist: true}))
    findSneakersByModel(@Query() getModelDto: GetModelDto): Promise<GeneralResponse<IAllModels>> {
        return this.sneakersService.findSneakersByModel(getModelDto);
    }

    //6 Users can add brand to current model. {"modelIds":[56,57],"brandName":"pinapple" } Adidas%20Yeezy%20700
    //Endpoint: Post /sneakers/brand
    @Post('/brand')
    @UsePipes(new ValidationPipe({transform: true, whitelist: true}))
    addBrandToModel(@Body() setBrandDto: SetBrandDto): Promise<GeneralResponse<IBrand>> {
        return this.sneakersService.addBrandToModel(setBrandDto);
    }

    //7 Users can get many Brand by ids with models and sneakers
    //Endpoint: Get /sneakers/brands?ids=7,8
    @Get('/brands')
    @UsePipes(new ValidationPipe({transform: true, whitelist: true}))
    getBrandWithModels(@Query() getBrandDto: GetBrandsDto): Promise<GeneralResponse<any>> {
        return this.sneakersService.getBrandsWithModels(getBrandDto);
    }





}
