import { MigrationInterface, QueryRunner } from "typeorm";

export class ModelWithDimens1704473276151 implements MigrationInterface {
    name = 'ModelWithDimens1704473276151'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "model_all_model_dimensions_dimention" ("modelId" integer NOT NULL, "dimentionId" integer NOT NULL, CONSTRAINT "PK_f247ccd3d2e6ce779438b2dee5a" PRIMARY KEY ("modelId", "dimentionId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_a52a6a41a9ccbeb0fdef851dc1" ON "model_all_model_dimensions_dimention" ("modelId") `);
        await queryRunner.query(`CREATE INDEX "IDX_9ad1304720239bfce4d9be21da" ON "model_all_model_dimensions_dimention" ("dimentionId") `);
        await queryRunner.query(`ALTER TABLE "model_all_model_dimensions_dimention" ADD CONSTRAINT "FK_a52a6a41a9ccbeb0fdef851dc1b" FOREIGN KEY ("modelId") REFERENCES "model"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "model_all_model_dimensions_dimention" ADD CONSTRAINT "FK_9ad1304720239bfce4d9be21da3" FOREIGN KEY ("dimentionId") REFERENCES "dimention"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "model_all_model_dimensions_dimention" DROP CONSTRAINT "FK_9ad1304720239bfce4d9be21da3"`);
        await queryRunner.query(`ALTER TABLE "model_all_model_dimensions_dimention" DROP CONSTRAINT "FK_a52a6a41a9ccbeb0fdef851dc1b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9ad1304720239bfce4d9be21da"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a52a6a41a9ccbeb0fdef851dc1"`);
        await queryRunner.query(`DROP TABLE "model_all_model_dimensions_dimention"`);
    }

}
