import { MigrationInterface, QueryRunner } from "typeorm";

export class DimensSize1704465806436 implements MigrationInterface {
    name = 'DimensSize1704465806436'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "dimention" RENAME COLUMN "article" TO "size"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "dimention" RENAME COLUMN "size" TO "article"`);
    }

}
