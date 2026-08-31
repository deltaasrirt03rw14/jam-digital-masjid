import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Mosque } from "../../mosques/entities/mosque.entity";

@Entity("events")
export class Event {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 255 })
  title: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "timestamptz" })
  start_time: Date;

  @Column({ type: "timestamptz", nullable: true })
  end_time: Date;

  @ManyToOne(() => Mosque, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "mosque_id" })
  mosque: Mosque;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date;
}
