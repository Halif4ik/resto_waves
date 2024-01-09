import {Sneakers} from "../../scheduled-task/entities/sneakers.entity";

export interface IRespLoadData {
    "loadData": Sneakers[][];
}

export interface IAllSneakers {
    "sneakers": Sneakers[];
}

export interface IOneSneaker {
    "sneaker": Sneakers | null;
}