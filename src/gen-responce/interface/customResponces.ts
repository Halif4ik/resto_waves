import {Sneakers} from "../../scheduled-task/entities/sneakers.entity";

export interface IRespLoadData {
    "loadData": Sneakers[] | string | any;
}