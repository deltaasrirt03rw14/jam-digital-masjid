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

export enum ContentType {
  IMAGE = "IMAGE",
  VIDEO = "VIDEO",
  TEXT = "TEXT",
}

export enum ContentStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

@Entity("contents")
export class Content {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 255 })
  title: string;

  @Column({ type: "enum", enum: ContentType })
  type: ContentType;

  @Column({ type: "enum", enum: ContentStatus, default: ContentStatus.ACTIVE })
  status: ContentStatus;

  @Column({ type: "varchar", length: 255, nullable: true })
  scheduling: string;

  @Column({ type: "jsonb", nullable: true })
  content_data: any;

  @ManyToOne(() => Mosque, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "mosque_id" })
  mosque: Mosque;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date;
}
