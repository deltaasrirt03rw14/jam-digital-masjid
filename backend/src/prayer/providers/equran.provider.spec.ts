import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { EQuranProvider } from './equran.provider';
import { PrayerConfig } from '../entities/prayer-config.entity';
import { of } from 'rxjs';

describe('EQuranProvider', () => {
  let provider: EQuranProvider;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EQuranProvider,
        {
          provide: HttpService,
          useValue: {
            post: jest.fn(),
          },
        },
      ],
    }).compile();

    provider = module.get<EQuranProvider>(EQuranProvider);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should normalize equran response', async () => {
    const config = new PrayerConfig();
    config.equran_provinsi = 'DKI JAKARTA';
    config.equran_kabkota = 'KOTA JAKARTA SELATAN';
    const mosqueId = 'm1';

    jest.spyOn(httpService, 'post').mockReturnValue(
      of({
        data: {
          data: [
            {
              tanggal: 'Rabu, 01/01/2026',
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
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      })
    );

    const result = await provider.getMonthlySchedule(mosqueId, config, 2026, 1);
    expect(result.length).toBe(1);
    expect(result[0].schedule_date).toBe('2026-01-01');
    expect(result[0].syuruq).toBe('05:40:00');
    expect(result[0].source_provider).toBe('EQuran');
  });
});
