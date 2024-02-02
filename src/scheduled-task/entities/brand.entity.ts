import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    DeleteDateColumn,
     OneToMany
} from 'typeorm';
import {Model} from "./model.entity";

@Entity()
export class Brand {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({type: "varchar", width: 255})
    brandName: string;

    @DeleteDateColumn()
    deleteAt: Date;

    @OneToMany(() => Model, model => model.brand)
    model: Model[];

}
