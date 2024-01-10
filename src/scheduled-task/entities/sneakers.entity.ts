import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    DeleteDateColumn,
    ManyToMany,
    JoinTable,
    OneToMany,
    ManyToOne, JoinColumn
} from 'typeorm';
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

    @ManyToOne(() => Model, model => model.sneakers,
        {onDelete: 'CASCADE', /*eager: true,*/ cascade: true, nullable: false, orphanedRowAction: 'delete'})
    @JoinColumn()
    model:Model;

    @ManyToMany(() => Dimention)
    @JoinTable()
    availableDimensions: Dimention[];
}
