import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateMediaTable1787556345881 implements MigrationInterface {
    name = 'CreateMediaTable1787556345881'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "media_assets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "filename" character varying(255) NOT NULL, "mime_type" character varying(100) NOT NULL, "url" text NOT NULL, "size" integer, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "mosque_id" uuid NOT NULL, CONSTRAINT "PK_ca47e9f67a5e5d8af1e75d66ee6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "media_assets" ADD CONSTRAINT "FK_d6ab70947ccc5c298404e5d794b" FOREIGN KEY ("mosque_id") REFERENCES "mosques"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "media_assets" DROP CONSTRAINT "FK_d6ab70947ccc5c298404e5d794b"`);
        await queryRunner.query(`DROP TABLE "media_assets"`);
    }

}
