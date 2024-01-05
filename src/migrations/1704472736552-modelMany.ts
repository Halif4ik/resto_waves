import { MigrationInterface, QueryRunner } from "typeorm";

export class ModelMany1704472736552 implements MigrationInterface {
    name = 'ModelMany1704472736552'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "model" ("id" SERIAL NOT NULL, "model" character varying NOT NULL, "deleteAt" TIMESTAMP, "sneakersId" integer, CONSTRAINT "PK_d6df271bba301d5cc79462912a4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "sneakers" DROP COLUMN "model"`);
        await queryRunner.query(`ALTER TABLE "model" ADD CONSTRAINT "FK_7c38eb09221d900e93ef59e1f5a" FOREIGN KEY ("sneakersId") REFERENCES "sneakers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "model" DROP CONSTRAINT "FK_7c38eb09221d900e93ef59e1f5a"`);
        await queryRunner.query(`ALTER TABLE "sneakers" ADD "model" character varying NOT NULL`);
        await queryRunner.query(`DROP TABLE "model"`);
    }

}
