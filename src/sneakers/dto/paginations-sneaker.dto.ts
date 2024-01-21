import {Transform} from "class-transformer";
import {IsBoolean, IsNumber, IsOptional, Min} from "class-validator";

export class PaginationsSneakersDto {
    @Transform(({value}) => isNaN(parseInt(value)) ? 1 : parseInt(value),)
    @IsNumber({}, {message: 'Page should be Number'})
    @IsOptional()
    @Min(1)
    page: number;

    @Transform(({value}) => {
            if (value.toString() === 'true') return true;
            else if (value.toString() === 'false') return false;
            return null;
        }
    )
    @IsBoolean({message: 'Revert should be boolean'})
    @IsOptional()
    revert: boolean;
}
