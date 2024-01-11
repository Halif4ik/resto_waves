import {Sneakers} from "../../scheduled-task/entities/sneakers.entity";
import {Dimention} from "../../scheduled-task/entities/dimention.entity";
import {Model} from "../../scheduled-task/entities/model.entity";
import {Brand} from "../../scheduled-task/entities/brand.entity";

export interface IRespLoadData {
    "loadData": Sneakers[][];
}

export interface IAllSneakers {
    "sneakers": Sneakers[];
}
export interface IAllModels {
    "sneakers": Model[];
}
export interface IBrand {
    "brand": Brand | Brand[];
}

export interface IOneSneaker {
    "sneaker": Sneakers | null;
}
export type TModelDimension =  { model: string, dimensions: Dimention[] };