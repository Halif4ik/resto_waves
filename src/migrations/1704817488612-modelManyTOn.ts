import { MigrationInterface, QueryRunner } from "typeorm";

export class ModelManyTOn1704817488612 implements MigrationInterface {
    name = 'ModelManyTOn1704817488612'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "model" DROP CONSTRAINT "FK_2cab86fc8d24c6922e8f5026d85"`);
        await queryRunner.query(`ALTER TABLE "model" ALTER COLUMN "sneakersName" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "model" ADD CONSTRAINT "FK_2cab86fc8d24c6922e8f5026d85" FOREIGN KEY ("sneakersName") REFERENCES "sneakers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "model" DROP CONSTRAINT "FK_2cab86fc8d24c6922e8f5026d85"`);
        await queryRunner.query(`ALTER TABLE "model" ALTER COLUMN "sneakersName" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "model" ADD CONSTRAINT "FK_2cab86fc8d24c6922e8f5026d85" FOREIGN KEY ("sneakersName") REFERENCES "sneakers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
