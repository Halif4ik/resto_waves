import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    DeleteDateColumn,
    ManyToOne,
    ManyToMany,
    JoinTable,
    JoinColumn
} from 'typeorm';
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
        {onDelete: 'CASCADE', eager: true})
    @JoinColumn({name:'sneakersName'})
    sneakers: Sneakers;

    @ManyToMany(() => Dimention)
    @JoinTable()
    allModelDimensions: Dimention[];
}
