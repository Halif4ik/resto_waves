import {Entity, Column, PrimaryGeneratedColumn, DeleteDateColumn, ManyToOne, ManyToMany, JoinTable} from 'typeorm';
import {Sneakers} from "./sneakers.entity";
import {Dimention} from "./dimention.entity";

@Entity()
export class Model {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({type: "varchar", width: 255})
    model: string;

    @DeleteDateColumn()
    deleteAt: Date;

    @ManyToOne(() => Sneakers, sneakers => sneakers.model,
        {cascade: true, onDelete: 'CASCADE'})
    sneakers: Sneakers;

    @ManyToMany(() => Dimention)
    @JoinTable()
    allModelDimensions: Dimention[];
}
