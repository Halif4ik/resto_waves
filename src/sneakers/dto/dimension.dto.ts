import {Transform} from "class-transformer";
import {IsNotEmpty, IsNumber, Min} from "class-validator";

export class GetDimensionDto {
    @Transform(({value}) => isNaN(parseInt(value)) ? 0 : parseInt(value),)
    @IsNotEmpty()
    @IsNumber({},{message: 'Dimension sneakers should be number more then 1'})
    @Min(1)
    readonly dimension: number;
}
