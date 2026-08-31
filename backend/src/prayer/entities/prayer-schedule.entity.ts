import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from "typeorm";
import { Mosque } from "../../mosques/entities/mosque.entity";

@Entity("prayer_schedules")
@Unique(["mosque_id", "schedule_date"])
export class PrayerSchedule {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("uuid")
  mosque_id: string;

  @ManyToOne(() => Mosque, { onDelete: "CASCADE" })
  @JoinColumn({ name: "mosque_id" })
  mosque: Mosque;

  @Column({ type: "date" })
  schedule_date: string;

  @Column({ type: "time", nullable: true })
  imsak: string | null;

  @Column({ type: "time", nullable: true })
  subuh: string | null;

  @Column({ type: "time", nullable: true })
  syuruq: string | null;

  @Column({ type: "time", nullable: true })
  dzuhur: string | null;

  @Column({ type: "time", nullable: true })
  ashar: string | null;

  @Column({ type: "time", nullable: true })
  maghrib: string | null;

  @Column({ type: "time", nullable: true })
  isya: string | null;

  @Column({ type: "varchar" })
  source_provider: string;

  @Column({ type: "timestamp" })
  retrieved_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
