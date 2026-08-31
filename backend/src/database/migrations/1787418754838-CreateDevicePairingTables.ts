import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateDevicePairingTables1787418754838 implements MigrationInterface {
  name = "CreateDevicePairingTables1787418754838";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "devices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "device_identifier" uuid NOT NULL, "mosque_id" uuid NOT NULL, "name" character varying(255), "status" character varying(50) NOT NULL DEFAULT 'ACTIVE', "api_key_hash" character varying(255) NOT NULL, "last_heartbeat_at" TIMESTAMP WITH TIME ZONE, "disabled_at" TIMESTAMP WITH TIME ZONE, "revoked_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_4caa5e5123e1fc20fe097b2d4e0" UNIQUE ("device_identifier"), CONSTRAINT "PK_b1514758245c12daf43486dd1f0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "device_pairing_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "mosque_id" uuid NOT NULL, "token_hash" character varying(255) NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "used_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_ab62fd36e8679a63721388ff01b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "mosques" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "config_version" integer NOT NULL DEFAULT '1', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_71710b8536d75494ce828a5a573" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "devices" ADD CONSTRAINT "FK_d5043927711494610f357d0f4c4" FOREIGN KEY ("mosque_id") REFERENCES "mosques"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "device_pairing_tokens" ADD CONSTRAINT "FK_145c5d4855ca0495f2c721508e6" FOREIGN KEY ("mosque_id") REFERENCES "mosques"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "device_pairing_tokens" DROP CONSTRAINT "FK_145c5d4855ca0495f2c721508e6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "devices" DROP CONSTRAINT "FK_d5043927711494610f357d0f4c4"`,
    );
    await queryRunner.query(`DROP TABLE "mosques"`);
    await queryRunner.query(`DROP TABLE "device_pairing_tokens"`);
    await queryRunner.query(`DROP TABLE "devices"`);
  }
}
