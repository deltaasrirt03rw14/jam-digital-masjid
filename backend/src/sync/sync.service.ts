import { Injectable, NotFoundException } from "@nestjs/common";
import { MosquesService } from "../mosques/mosques.service";
import { ContentsService } from "../contents/contents.service";
import { MediaService } from "../media/media.service";
import { EventsService } from "../events/events.service";

export interface SyncPayload {
  mosque: {
    id: string;
    name: string;
    address: string;
    timezone: string;
    latitude: number;
    longitude: number;
    config_version: number;
  };
  contents: any[];
  media: any[];
  events: any[];
}

@Injectable()
export class SyncService {
  constructor(
    private readonly mosquesService: MosquesService,
    private readonly contentsService: ContentsService,
    private readonly mediaService: MediaService,
    private readonly eventsService: EventsService,
  ) {}

  async getSyncData(mosqueId: string): Promise<SyncPayload> {
    const mosque = await this.mosquesService.findOne(mosqueId);
    if (!mosque) {
      throw new NotFoundException("Mosque not found");
    }

    const [contents, media, events] = await Promise.all([
      this.contentsService.findAll(mosqueId),
      this.mediaService.findAll(mosqueId),
      this.eventsService.findAll(mosqueId),
    ]);

    return {
      mosque: {
        id: mosque.id,
        name: mosque.name,
        address: mosque.address,
        timezone: mosque.timezone,
        latitude: mosque.latitude,
        longitude: mosque.longitude,
        config_version: mosque.config_version,
      },
      contents,
      media,
      events,
    };
  }
}
