import {Entity, Column, PrimaryGeneratedColumn, DeleteDateColumn, ManyToMany, JoinTable} from 'typeorm';
import {Dimention} from "./dimention.entity";

@Entity()
export class Sneakers {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({type: "varchar", width: 255})
    model: string;

    @Column({type: "int"})
    article: number;

    @Column({type: "varchar", width: 255, unique: true})
    name: string;

    @Column({type: "int"})
    price: number;

    @DeleteDateColumn()
    deleteAt: Date;

    @ManyToMany(() => Dimention)
    @JoinTable()
    availableDimensions: Dimention[];
}
