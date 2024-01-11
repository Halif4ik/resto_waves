import { IsString, Length} from "class-validator";

export class GetModelDto {
    @IsString({message: 'Model should be string'})
    @Length(2, 255, {message: 'Model Min lenth 2 max length 255'})
    readonly model: string;
}
