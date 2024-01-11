import {IsNotEmpty, IsNumber, Min,} from "class-validator";
import {Transform} from "class-transformer";

/* example - Get /sneakers/brand?ids=7,8 */

export class GetBrandsDto {
    @IsNotEmpty()
    @Transform(({value}) => {
        console.log('value-',value);
        return value.split(',').map(Number)
    })
    @IsNumber({}, {each: true})
    @Min(1, {each: true})
    ids: number[];

}