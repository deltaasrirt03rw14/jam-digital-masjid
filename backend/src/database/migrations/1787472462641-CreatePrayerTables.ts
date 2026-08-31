import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePrayerTables1787472462641 implements MigrationInterface {
  name = "CreatePrayerTables1787472462641";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "prayer_schedules" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "mosque_id" uuid NOT NULL, "schedule_date" date NOT NULL, "imsak" TIME, "subuh" TIME, "syuruq" TIME, "dzuhur" TIME, "ashar" TIME, "maghrib" TIME, "isya" TIME, "source_provider" character varying NOT NULL, "retrieved_at" TIMESTAMP NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_da4c104f5f8967080d70e677179" UNIQUE ("mosque_id", "schedule_date"), CONSTRAINT "PK_f6b4c3e0f624304d16c50e47704" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "prayer_configs" ("mosque_id" uuid NOT NULL, "timezone" character varying NOT NULL, "myquran_location_id" character varying, "equran_provinsi" character varying, "equran_kabkota" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_8c960c18841df0fb0225dd28246" PRIMARY KEY ("mosque_id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "prayer_schedules" ADD CONSTRAINT "FK_30e7cbcd9de30578f430466d9af" FOREIGN KEY ("mosque_id") REFERENCES "mosques"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "prayer_configs" ADD CONSTRAINT "FK_8c960c18841df0fb0225dd28246" FOREIGN KEY ("mosque_id") REFERENCES "mosques"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "prayer_configs" DROP CONSTRAINT "FK_8c960c18841df0fb0225dd28246"`,
    );
    await queryRunner.query(
      `ALTER TABLE "prayer_schedules" DROP CONSTRAINT "FK_30e7cbcd9de30578f430466d9af"`,
    );
    await queryRunner.query(`DROP TABLE "prayer_configs"`);
    await queryRunner.query(`DROP TABLE "prayer_schedules"`);
  }
}
