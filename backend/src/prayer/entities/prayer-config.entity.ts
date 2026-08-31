import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  OneToOne,
} from "typeorm";
import { Mosque } from "../../mosques/entities/mosque.entity";

@Entity("prayer_configs")
export class PrayerConfig {
  @PrimaryColumn("uuid")
  mosque_id: string;

  @OneToOne(() => Mosque, { onDelete: "CASCADE" })
  @JoinColumn({ name: "mosque_id" })
  mosque: Mosque;

  @Column({ type: "varchar" })
  timezone: string;

  @Column({ type: "varchar", nullable: true })
  myquran_location_id: string | null;

  @Column({ type: "varchar", nullable: true })
  equran_provinsi: string | null;

  @Column({ type: "varchar", nullable: true })
  equran_kabkota: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
