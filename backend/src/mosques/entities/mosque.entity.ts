import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { Device } from "../../devices/entities/device.entity";
import { DevicePairingToken } from "../../devices/entities/device-pairing-token.entity";
import { AdminUser } from "../../auth/entities/admin-user.entity";
import { Content } from "../../contents/entities/content.entity";
import { Media } from "../../media/entities/media.entity";
import { Event } from "../../events/entities/event.entity";

@Entity("mosques")
export class Mosque {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "int", default: 1 })
  config_version: number;

  @Column({ type: "text", nullable: true })
  address: string;

  @Column({ type: "varchar", length: 100, default: "Asia/Jakarta" })
  timezone: string;

  @Column({ type: "decimal", precision: 10, scale: 6, nullable: true })
  latitude: number;

  @Column({ type: "decimal", precision: 10, scale: 6, nullable: true })
  longitude: number;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date;

  @OneToMany(() => Device, (device) => device.mosque)
  devices: Device[];

  @OneToMany(() => DevicePairingToken, (token) => token.mosque)
  pairingTokens: DevicePairingToken[];

  @OneToMany(() => AdminUser, (admin) => admin.mosque)
  adminUsers: AdminUser[];

  @OneToMany(() => Content, (content) => content.mosque)
  contents: Content[];

  @OneToMany(() => Media, (media) => media.mosque)
  mediaAssets: Media[];

  @OneToMany(() => Event, (event) => event.mosque)
  events: Event[];
}
