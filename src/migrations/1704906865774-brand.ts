import { MigrationInterface, QueryRunner } from "typeorm";

export class Brand1704906865774 implements MigrationInterface {
    name = 'Brand1704906865774'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "brand" ("id" SERIAL NOT NULL, "brandName" character varying NOT NULL, "deleteAt" TIMESTAMP, CONSTRAINT "PK_a5d20765ddd942eb5de4eee2d7f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "model" ADD "brandId" integer`);
        await queryRunner.query(`ALTER TABLE "model" ADD CONSTRAINT "FK_7996700d600159cdf20dc0d0816" FOREIGN KEY ("brandId") REFERENCES "model"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "model" DROP CONSTRAINT "FK_7996700d600159cdf20dc0d0816"`);
        await queryRunner.query(`ALTER TABLE "model" DROP COLUMN "brandId"`);
        await queryRunner.query(`DROP TABLE "brand"`);
    }

}
