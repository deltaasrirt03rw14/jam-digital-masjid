import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateContentTable1787556025552 implements MigrationInterface {
    name = 'CreateContentTable1787556025552'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."contents_type_enum" AS ENUM('IMAGE', 'VIDEO', 'TEXT')`);
        await queryRunner.query(`CREATE TYPE "public"."contents_status_enum" AS ENUM('ACTIVE', 'INACTIVE')`);
        await queryRunner.query(`CREATE TABLE "contents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying(255) NOT NULL, "type" "public"."contents_type_enum" NOT NULL, "status" "public"."contents_status_enum" NOT NULL DEFAULT 'ACTIVE', "scheduling" character varying(255), "content_data" jsonb, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "mosque_id" uuid NOT NULL, CONSTRAINT "PK_b7c504072e537532d7080c54fac" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "contents" ADD CONSTRAINT "FK_a1f6b927af5c2cdf4f67a59d622" FOREIGN KEY ("mosque_id") REFERENCES "mosques"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "contents" DROP CONSTRAINT "FK_a1f6b927af5c2cdf4f67a59d622"`);
        await queryRunner.query(`DROP TABLE "contents"`);
        await queryRunner.query(`DROP TYPE "public"."contents_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."contents_type_enum"`);
    }

}
