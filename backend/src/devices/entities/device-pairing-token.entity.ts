import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Mosque } from "../../mosques/entities/mosque.entity";

@Entity("device_pairing_tokens")
export class DevicePairingToken {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  mosque_id: string;

  @ManyToOne(() => Mosque, (mosque) => mosque.pairingTokens, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "mosque_id" })
  mosque: Mosque;

  @Column({ type: "varchar", length: 255 })
  token_hash: string;

  @Column({ type: "timestamptz" })
  expires_at: Date;

  @Column({ type: "timestamptz", nullable: true })
  used_at: Date;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;
}
