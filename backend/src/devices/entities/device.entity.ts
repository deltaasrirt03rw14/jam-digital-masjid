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

@Entity("devices")
export class Device {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid", unique: true })
  device_identifier: string;

  @Column({ type: "uuid" })
  mosque_id: string;

  @ManyToOne(() => Mosque, (mosque) => mosque.devices, { onDelete: "CASCADE" })
  @JoinColumn({ name: "mosque_id" })
  mosque: Mosque;

  @Column({ type: "varchar", length: 255, nullable: true })
  name: string;

  @Column({ type: "varchar", length: 50, default: "ACTIVE" })
  status: "ACTIVE" | "DISABLED" | "REVOKED";

  @Column({ type: "varchar", length: 255 })
  api_key_hash: string;

  @Column({ type: "timestamptz", nullable: true })
  last_heartbeat_at: Date;

  @Column({ type: "timestamptz", nullable: true })
  disabled_at: Date;

  @Column({ type: "timestamptz", nullable: true })
  revoked_at: Date;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date;
}
