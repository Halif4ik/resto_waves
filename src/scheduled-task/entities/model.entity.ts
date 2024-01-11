import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    DeleteDateColumn,
    ManyToOne,
    ManyToMany,
    JoinTable,
    JoinColumn, OneToMany
} from 'typeorm';
import {Sneakers} from "./sneakers.entity";
import {Dimention} from "./dimention.entity";
import {Brand} from "./brand.entity";

@Entity()
export class Model {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({type: "varchar", width: 255})
    model: string;

    @DeleteDateColumn()
    deleteAt: Date;

    @OneToMany(() => Sneakers, sneakers => sneakers.model)
    sneakers: Sneakers[];

    @ManyToMany(() => Dimention)
    @JoinTable()
    allModelDimensions: Dimention[];

    @ManyToOne(() => Brand, brand => brand.model,
        {onDelete: 'CASCADE', cascade: true, orphanedRowAction: 'soft-delete'})
    @JoinColumn()
    brand: Brand;
}
