import {IsString, Length,} from "class-validator";
import {GetSneakerDto} from "./get-sneaker.dto";
import {IntersectionType} from "@nestjs/mapped-types";

 class UpdateNameDto {
    @IsString({message: 'Name should be string'})
    @Length(2, 255, {message: ' Name Min lenth 2 max length 255'})
    readonly nameSneakers: string;
}

export class UpdateSneakerDto extends IntersectionType(
    UpdateNameDto,
    GetSneakerDto,
) {
}
