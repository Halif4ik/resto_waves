import { MigrationInterface, QueryRunner } from "typeorm";

export class SneakersDiment1704380864827 implements MigrationInterface {
    name = 'SneakersDiment1704380864827'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "dimention" ("id" SERIAL NOT NULL, "article" integer NOT NULL, "deleteAt" TIMESTAMP, CONSTRAINT "PK_267aa8dddd7d1dbcad514f6ba2f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "sneakers" ("id" SERIAL NOT NULL, "model" character varying NOT NULL, "article" integer NOT NULL, "name" character varying NOT NULL, "price" integer NOT NULL, "deleteAt" TIMESTAMP, CONSTRAINT "UQ_9b21bb2bab41d1ed0a5571fd64f" UNIQUE ("name"), CONSTRAINT "PK_94f3924b45d752e8a761ca3705e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "sneakers_available_dimensions_dimention" ("sneakersId" integer NOT NULL, "dimentionId" integer NOT NULL, CONSTRAINT "PK_345abd54e60d14e28bf86eb3a38" PRIMARY KEY ("sneakersId", "dimentionId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_df2a75f1d063232bd325b9bce6" ON "sneakers_available_dimensions_dimention" ("sneakersId") `);
        await queryRunner.query(`CREATE INDEX "IDX_9f6fb66a9c95c7da95fd7a8475" ON "sneakers_available_dimensions_dimention" ("dimentionId") `);
        await queryRunner.query(`ALTER TABLE "sneakers_available_dimensions_dimention" ADD CONSTRAINT "FK_df2a75f1d063232bd325b9bce6c" FOREIGN KEY ("sneakersId") REFERENCES "sneakers"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "sneakers_available_dimensions_dimention" ADD CONSTRAINT "FK_9f6fb66a9c95c7da95fd7a84753" FOREIGN KEY ("dimentionId") REFERENCES "dimention"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sneakers_available_dimensions_dimention" DROP CONSTRAINT "FK_9f6fb66a9c95c7da95fd7a84753"`);
        await queryRunner.query(`ALTER TABLE "sneakers_available_dimensions_dimention" DROP CONSTRAINT "FK_df2a75f1d063232bd325b9bce6c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9f6fb66a9c95c7da95fd7a8475"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_df2a75f1d063232bd325b9bce6"`);
        await queryRunner.query(`DROP TABLE "sneakers_available_dimensions_dimention"`);
        await queryRunner.query(`DROP TABLE "sneakers"`);
        await queryRunner.query(`DROP TABLE "dimention"`);
    }

}
