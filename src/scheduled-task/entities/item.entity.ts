import {Entity, Column, PrimaryGeneratedColumn,  DeleteDateColumn} from 'typeorm';

@Entity()
export class Item {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({type: "varchar", width: 255})
    firstName: string;

    @Column({type: "varchar", width: 255, unique: true})
    email: string;
    /*, select: false */
    @Column({type: "varchar", width: 20})
    password: string;

    @Column({default: true})
    isActive: boolean;

    @DeleteDateColumn()
    deleteAt: Date;

}
