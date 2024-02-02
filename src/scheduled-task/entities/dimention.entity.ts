import {Entity, Column, PrimaryGeneratedColumn,  DeleteDateColumn} from 'typeorm';

@Entity()
export class Dimention {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({type: "int"})
    size: number;

    @DeleteDateColumn()
    deleteAt: Date;
}
