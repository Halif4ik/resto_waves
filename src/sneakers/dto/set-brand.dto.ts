import {IsNotEmpty, IsNumber, IsString, Length, Min, ValidateNested,} from "class-validator";
import {Transform, Type} from "class-transformer";
/* example - {
    "modelIds":[{"modelId":72},{"modelId":73}],
     "brandName":"pinapple"
}*/
export class SetBrandDto {
    @ValidateNested({each: true})
    @IsNotEmpty({message: 'modelIds should be array'})
    @Type(() => idModel)
    readonly modelIds: idModel[];

    @IsString({message: 'Brand name should be string'})
    @Length(3, 255, {message: 'Brand name Min lenth 3 max length 255'})
    readonly brandName: string;
}

export class idModel {
    @Transform(({value}) => {
        console.log('value-',value);
        return isNaN(parseInt(value)) ? 0 : parseInt(value)
    })

    @IsNumber({}, {message: 'modelId should be number'})
    @Min(1)
    readonly modelId: number;
}