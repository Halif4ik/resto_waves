import {Entity, Column, PrimaryGeneratedColumn, DeleteDateColumn, ManyToMany, JoinTable,OneToMany} from 'typeorm';
import {Dimention} from "./dimention.entity";
import {Model} from "./model.entity";

@Entity()
export class Sneakers {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({type: "int"})
    article: number;

    @Column({type: "varchar", width: 255, unique: true})
    name: string;

    @Column({type: "int"})
    price: number;

    @DeleteDateColumn()
    deleteAt: Date;

    @OneToMany(() => Model, model => model.sneakers)
    model:Model;

    @ManyToMany(() => Dimention)
    @JoinTable()
    availableDimensions: Dimention[];
}
