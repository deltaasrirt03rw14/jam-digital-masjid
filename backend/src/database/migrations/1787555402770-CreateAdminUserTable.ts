import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAdminUserTable1787555402770 implements MigrationInterface {
    name = 'CreateAdminUserTable1787555402770'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "admin_users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying(255) NOT NULL, "password_hash" character varying(255) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "mosque_id" uuid NOT NULL, CONSTRAINT "UQ_dcd0c8a4b10af9c986e510b9ecc" UNIQUE ("email"), CONSTRAINT "PK_06744d221bb6145dc61e5dc441d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "admin_users" ADD CONSTRAINT "FK_08ff9a8b0ed3f24fe7d9ee0c4c6" FOREIGN KEY ("mosque_id") REFERENCES "mosques"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "admin_users" DROP CONSTRAINT "FK_08ff9a8b0ed3f24fe7d9ee0c4c6"`);
        await queryRunner.query(`DROP TABLE "admin_users"`);
    }

}
