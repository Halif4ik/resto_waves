import {Module} from '@nestjs/common';
import {SneakersService} from './sneakers.service';
import {SneakersController} from './sneakers.controller';
import {Sneakers} from "../scheduled-task/entities/sneakers.entity";
import {TypeOrmModule} from "@nestjs/typeorm";
import {Dimention} from "../scheduled-task/entities/dimention.entity";
import {Model} from "../scheduled-task/entities/model.entity";
import {Brand} from "../scheduled-task/entities/brand.entity";

@Module({
    controllers: [SneakersController],
    providers: [SneakersService],
    imports: [
        TypeOrmModule.forFeature([Sneakers,Dimention,Model,Brand]),]
})
export class SneakersModule {
}
