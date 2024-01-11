import { MigrationInterface, QueryRunner } from "typeorm";

export class ModelJoincCol1704745675985 implements MigrationInterface {
    name = 'ModelJoincCol1704745675985'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "model" DROP CONSTRAINT "FK_7c38eb09221d900e93ef59e1f5a"`);
        await queryRunner.query(`ALTER TABLE "model" RENAME COLUMN "sneakersId" TO "sneakersName"`);
        await queryRunner.query(`ALTER TABLE "model" ADD CONSTRAINT "FK_2cab86fc8d24c6922e8f5026d85" FOREIGN KEY ("sneakersName") REFERENCES "sneakers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "model" DROP CONSTRAINT "FK_2cab86fc8d24c6922e8f5026d85"`);
        await queryRunner.query(`ALTER TABLE "model" RENAME COLUMN "sneakersName" TO "sneakersId"`);
        await queryRunner.query(`ALTER TABLE "model" ADD CONSTRAINT "FK_7c38eb09221d900e93ef59e1f5a" FOREIGN KEY ("sneakersId") REFERENCES "sneakers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
