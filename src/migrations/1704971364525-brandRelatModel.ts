import { MigrationInterface, QueryRunner } from "typeorm";

export class BrandRelatModel1704971364525 implements MigrationInterface {
    name = 'BrandRelatModel1704971364525'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "model" DROP CONSTRAINT "FK_7996700d600159cdf20dc0d0816"`);
        await queryRunner.query(`ALTER TABLE "model" ADD CONSTRAINT "FK_7996700d600159cdf20dc0d0816" FOREIGN KEY ("brandId") REFERENCES "brand"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "model" DROP CONSTRAINT "FK_7996700d600159cdf20dc0d0816"`);
        await queryRunner.query(`ALTER TABLE "model" ADD CONSTRAINT "FK_7996700d600159cdf20dc0d0816" FOREIGN KEY ("brandId") REFERENCES "model"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
