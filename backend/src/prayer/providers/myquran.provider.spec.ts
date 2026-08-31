import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { MyQuranProvider } from './myquran.provider';
import { PrayerConfig } from '../entities/prayer-config.entity';
import { of } from 'rxjs';

describe('MyQuranProvider', () => {
  let provider: MyQuranProvider;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MyQuranProvider,
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    provider = module.get<MyQuranProvider>(MyQuranProvider);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  it('should parse array response and map terbit to syuruq', async () => {
    const config = new PrayerConfig();
    config.myquran_location_id = 'test_hash';
    const mosqueId = 'm1';
    const year = 2026;
    const month = 8;

    jest.spyOn(httpService, 'get').mockReturnValue(
      of({
        data: {
          status: true,
          data: {
            jadwal: [
              {
                date: '2026-08-23',
                tanggal: 'Minggu, 23/08/2026',
                imsak: '04:10',
                subuh: '04:20',
                terbit: '05:40',
                dzuhur: '11:40',
                ashar: '15:00',
                maghrib: '17:45',
                isya: '18:55',
              },
            ],
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      })
    );

    const result = await provider.getMonthlySchedule(mosqueId, config, year, month);
    expect(result.length).toBe(1);
    expect(result[0].schedule_date).toBe('2026-08-23');
    expect(result[0].syuruq).toBe('05:40:00');
    expect(result[0].imsak).toBe('04:10:00');
    expect(result[0].source_provider).toBe('myQuran');
  });

  it('should throw error if config is missing', async () => {
    const config = new PrayerConfig();
    await expect(provider.getMonthlySchedule('m1', config, 2026, 8)).rejects.toThrow('myQuran location ID is not configured');
  });
});
