import {Transform} from "class-transformer";
import {IsNotEmpty, IsNumber, Min} from "class-validator";

export class GetSneakerDto {
    @Transform(({value}) => isNaN(parseInt(value)) ? 0 : parseInt(value),)
    @IsNotEmpty()
    @IsNumber({},{message: 'id sneakers should be number does not less 1'})
    @Min(1)
    readonly id: number;
}
