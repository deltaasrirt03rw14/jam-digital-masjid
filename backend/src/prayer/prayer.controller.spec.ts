import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { PrayerController } from './prayer.controller';
import { PrayerService } from './prayer.service';
import { DeviceGuard } from '../auth/guards/device.guard';

describe('PrayerController', () => {
  let controller: PrayerController;
  let service: any;

  beforeEach(async () => {
    service = {
      getPrayerSchedule: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PrayerController],
      providers: [
        {
          provide: PrayerService,
          useValue: service,
        },
      ],
    })
      .overrideGuard(DeviceGuard)
      .useValue({ canActivate: () => true }) // We test controller logic, not the guard itself here
      .compile();

    controller = module.get<PrayerController>(PrayerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return 403 if device mosque_id does not match URL', async () => {
    const req = { device: { mosque_id: 'm1' } };
    await expect(controller.getSchedule('m2', '2026-08-23', req)).rejects.toThrow(
      new HttpException('Forbidden: Device is not registered to this mosque', HttpStatus.FORBIDDEN),
    );
  });

  it('should return 400 for invalid date format', async () => {
    const req = { device: { mosque_id: 'm1' } };
    await expect(controller.getSchedule('m1', 'invalid', req)).rejects.toThrow(
      new HttpException('Invalid date format. Expected YYYY-MM-DD.', HttpStatus.BAD_REQUEST),
    );
  });

  it('should call service for valid request', async () => {
    const req = { device: { mosque_id: 'm1' } };
    service.getPrayerSchedule.mockResolvedValue({ id: 'uuid' });

    const result = await controller.getSchedule('m1', '2026-08-23', req);
    expect(result.id).toBe('uuid');
    expect(service.getPrayerSchedule).toHaveBeenCalledWith('m1', '2026-08-23');
  });
});
