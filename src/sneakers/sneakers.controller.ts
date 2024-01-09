import {Controller, Get, Body, Patch, Param,  ValidationPipe, UsePipes, Query} from '@nestjs/common';
import {SneakersService} from './sneakers.service';
import {GeneralResponse} from "../gen-responce/interface/generalResponse.interface";
import {IAllSneakers, IOneSneaker} from "../gen-responce/interface/customResponces";
import {GetSneakerDto} from "./dto/get-sneaker.dto";
import {PaginationsSneakersDto} from "./dto/paginations-sneaker.dto";
import {UpdateSneakerDto} from "./dto/update-sneaker.dto";
import {GetDimensionDto} from "./dto/dimension.dto";

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

    //2 All  Users can get one items from sneakers table by id if it is available
    //Endpoint: Get /sneakers/search/:id
    //Permissions: All  Users
    @Get('search/:id')
    @UsePipes(new ValidationPipe({transform: true, whitelist: true}))
    findOne(@Param() getSneakerDTO: GetSneakerDto): Promise<GeneralResponse<any>> {
        return this.sneakersService.findOne(getSneakerDTO.id);
    }

    //3 All  Users can update name items from sneakers table by id if it is available
    //Endpoint: Patch /sneakers/update
    //Permissions: All  Users
    @Patch('/update')
    @UsePipes(new ValidationPipe({transform: true, whitelist: true}))
    updateSneaker(@Body() updateSneakerDto: UpdateSneakerDto): Promise<GeneralResponse<IOneSneaker>> {
        return this.sneakersService.updateNameSneaker(updateSneakerDto);
    }

    //4 All Users can find sneakers by name and dimension
    //Endpoint: Get /sneakers/find?dimension=41
    //Permissions: All  Users
    @Get('/find')
    @UsePipes(new ValidationPipe({transform: true, whitelist: true}))
    findSneakers(@Query() getDimensionDto: GetDimensionDto): Promise<GeneralResponse<IAllSneakers>> {
        return this.sneakersService.findSneakers(getDimensionDto);
    }

}
