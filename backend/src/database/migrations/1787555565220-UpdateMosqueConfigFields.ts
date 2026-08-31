import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateMosqueConfigFields1787555565220 implements MigrationInterface {
    name = 'UpdateMosqueConfigFields1787555565220'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "mosques" ADD "address" text`);
        await queryRunner.query(`ALTER TABLE "mosques" ADD "timezone" character varying(100) NOT NULL DEFAULT 'Asia/Jakarta'`);
        await queryRunner.query(`ALTER TABLE "mosques" ADD "latitude" numeric(10,6)`);
        await queryRunner.query(`ALTER TABLE "mosques" ADD "longitude" numeric(10,6)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "mosques" DROP COLUMN "longitude"`);
        await queryRunner.query(`ALTER TABLE "mosques" DROP COLUMN "latitude"`);
        await queryRunner.query(`ALTER TABLE "mosques" DROP COLUMN "timezone"`);
        await queryRunner.query(`ALTER TABLE "mosques" DROP COLUMN "address"`);
    }

}
