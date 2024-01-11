import { MigrationInterface, QueryRunner } from "typeorm";

export class ModelSneakEager1704906025084 implements MigrationInterface {
    name = 'ModelSneakEager1704906025084'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sneakers" DROP CONSTRAINT "FK_6f77434ff8f28532600c1208b4c"`);
        await queryRunner.query(`ALTER TABLE "sneakers" ALTER COLUMN "modelId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "sneakers" ADD CONSTRAINT "FK_6f77434ff8f28532600c1208b4c" FOREIGN KEY ("modelId") REFERENCES "model"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sneakers" DROP CONSTRAINT "FK_6f77434ff8f28532600c1208b4c"`);
        await queryRunner.query(`ALTER TABLE "sneakers" ALTER COLUMN "modelId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "sneakers" ADD CONSTRAINT "FK_6f77434ff8f28532600c1208b4c" FOREIGN KEY ("modelId") REFERENCES "model"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
