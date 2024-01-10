import { MigrationInterface, QueryRunner } from "typeorm";

export class ModelSneakRelat1704905676800 implements MigrationInterface {
    name = 'ModelSneakRelat1704905676800'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "model" DROP CONSTRAINT "FK_2cab86fc8d24c6922e8f5026d85"`);
        await queryRunner.query(`ALTER TABLE "model" DROP COLUMN "sneakersName"`);
        await queryRunner.query(`ALTER TABLE "sneakers" ADD "modelId" integer`);
        await queryRunner.query(`ALTER TABLE "sneakers" ADD CONSTRAINT "FK_6f77434ff8f28532600c1208b4c" FOREIGN KEY ("modelId") REFERENCES "model"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sneakers" DROP CONSTRAINT "FK_6f77434ff8f28532600c1208b4c"`);
        await queryRunner.query(`ALTER TABLE "sneakers" DROP COLUMN "modelId"`);
        await queryRunner.query(`ALTER TABLE "model" ADD "sneakersName" integer`);
        await queryRunner.query(`ALTER TABLE "model" ADD CONSTRAINT "FK_2cab86fc8d24c6922e8f5026d85" FOREIGN KEY ("sneakersName") REFERENCES "sneakers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
