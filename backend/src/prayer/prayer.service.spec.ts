import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HttpException, HttpStatus } from '@nestjs/common';
import { PrayerService } from './prayer.service';
import { PrayerSchedule } from './entities/prayer-schedule.entity';
import { PrayerConfig } from './entities/prayer-config.entity';
import { MyQuranProvider } from './providers/myquran.provider';
import { EQuranProvider } from './providers/equran.provider';

describe('PrayerService', () => {
  let service: PrayerService;
  let scheduleRepo: any;
  let configRepo: any;
  let myQuranProvider: any;
  let eQuranProvider: any;

  beforeEach(async () => {
    scheduleRepo = {
      findOne: jest.fn(),
      upsert: jest.fn(),
    };
    configRepo = {
      findOne: jest.fn(),
    };
    myQuranProvider = {
      getMonthlySchedule: jest.fn(),
    };
    eQuranProvider = {
      getMonthlySchedule: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrayerService,
        {
          provide: getRepositoryToken(PrayerSchedule),
          useValue: scheduleRepo,
        },
        {
          provide: getRepositoryToken(PrayerConfig),
          useValue: configRepo,
        },
        {
          provide: MyQuranProvider,
          useValue: myQuranProvider,
        },
        {
          provide: EQuranProvider,
          useValue: eQuranProvider,
        },
      ],
    }).compile();

    service = module.get<PrayerService>(PrayerService);
  });

  it('should return cache hit immediately', async () => {
    const cachedSchedule = new PrayerSchedule();
    cachedSchedule.id = 'uuid';
    cachedSchedule.schedule_date = '2026-08-23';

    scheduleRepo.findOne.mockResolvedValue(cachedSchedule);

    const result = await service.getPrayerSchedule('m1', '2026-08-23');
    expect(result).toEqual(cachedSchedule);
    expect(configRepo.findOne).not.toHaveBeenCalled();
    expect(myQuranProvider.getMonthlySchedule).not.toHaveBeenCalled();
  });

  it('should fallback to EQuran when myQuran fails', async () => {
    scheduleRepo.findOne
      .mockResolvedValueOnce(null) // cache miss
      .mockResolvedValueOnce({ id: 'new-id' }); // after upsert

    configRepo.findOne.mockResolvedValue(new PrayerConfig());

    myQuranProvider.getMonthlySchedule.mockRejectedValue(new Error('timeout'));
    eQuranProvider.getMonthlySchedule.mockResolvedValue([{ schedule_date: '2026-08-23' }]);

    const result = await service.getPrayerSchedule('m1', '2026-08-23');
    expect(eQuranProvider.getMonthlySchedule).toHaveBeenCalled();
    expect(scheduleRepo.upsert).toHaveBeenCalled();
    expect(result.id).toBe('new-id');
  });

  it('should return 502 when both providers fail', async () => {
    scheduleRepo.findOne.mockResolvedValue(null);
    configRepo.findOne.mockResolvedValue(new PrayerConfig());

    myQuranProvider.getMonthlySchedule.mockRejectedValue(new Error('timeout'));
    eQuranProvider.getMonthlySchedule.mockRejectedValue(new Error('timeout'));

    await expect(service.getPrayerSchedule('m1', '2026-08-23')).rejects.toThrow(
      new HttpException('Bad Gateway: Unable to fetch schedule from any provider', HttpStatus.BAD_GATEWAY),
    );
  });
});
