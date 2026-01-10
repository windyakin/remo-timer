import { Router, Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Schedule, ScheduleType } from '../entities/Schedule';
import { schedulerService } from '../services/SchedulerService';
import { ApplianceAction } from '../types/nature';

const router = Router();

interface CreateScheduleBody {
  name?: string;
  applianceId: string;
  applianceName: string;
  applianceType: string;
  action: ApplianceAction;
  scheduleType: ScheduleType;
  executeAt?: string;
  cronExpression?: string;
}

router.get('/schedules', async (_req: Request, res: Response) => {
  try {
    const scheduleRepository = AppDataSource.getRepository(Schedule);
    const schedules = await scheduleRepository.find({
      order: { createdAt: 'DESC' },
    });
    res.json(schedules);
  } catch (error) {
    console.error('Failed to fetch schedules:', error);
    res.status(500).json({ error: 'Failed to fetch schedules' });
  }
});

router.get('/schedules/:id', async (req: Request, res: Response) => {
  try {
    const scheduleRepository = AppDataSource.getRepository(Schedule);
    const schedule = await scheduleRepository.findOne({
      where: { id: parseInt(req.params.id) },
    });

    if (!schedule) {
      res.status(404).json({ error: 'Schedule not found' });
      return;
    }

    res.json(schedule);
  } catch (error) {
    console.error('Failed to fetch schedule:', error);
    res.status(500).json({ error: 'Failed to fetch schedule' });
  }
});

router.post('/schedules', async (req: Request, res: Response) => {
  try {
    const body: CreateScheduleBody = req.body;

    if (!body.applianceId || !body.action || !body.scheduleType) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    if (body.scheduleType === 'once' && !body.executeAt) {
      res.status(400).json({ error: 'executeAt is required for one-time schedules' });
      return;
    }

    if (body.scheduleType === 'recurring' && !body.cronExpression) {
      res.status(400).json({ error: 'cronExpression is required for recurring schedules' });
      return;
    }

    const scheduleRepository = AppDataSource.getRepository(Schedule);
    const schedule = new Schedule();
    schedule.name = body.name || null;
    schedule.applianceId = body.applianceId;
    schedule.applianceName = body.applianceName;
    schedule.applianceType = body.applianceType;
    schedule.action = body.action;
    schedule.scheduleType = body.scheduleType;
    schedule.executeAt = body.executeAt ? new Date(body.executeAt) : null;
    schedule.cronExpression = body.cronExpression || null;
    schedule.isEnabled = true;

    const savedSchedule = await scheduleRepository.save(schedule);
    schedulerService.addSchedule(savedSchedule);

    res.status(201).json(savedSchedule);
  } catch (error) {
    console.error('Failed to create schedule:', error);
    res.status(500).json({ error: 'Failed to create schedule' });
  }
});

router.put('/schedules/:id', async (req: Request, res: Response) => {
  try {
    const scheduleRepository = AppDataSource.getRepository(Schedule);
    const schedule = await scheduleRepository.findOne({
      where: { id: parseInt(req.params.id) },
    });

    if (!schedule) {
      res.status(404).json({ error: 'Schedule not found' });
      return;
    }

    const body: Partial<CreateScheduleBody> = req.body;

    if (body.name !== undefined) schedule.name = body.name || null;
    if (body.applianceId !== undefined) schedule.applianceId = body.applianceId;
    if (body.applianceName !== undefined) schedule.applianceName = body.applianceName;
    if (body.applianceType !== undefined) schedule.applianceType = body.applianceType;
    if (body.action !== undefined) schedule.action = body.action;
    if (body.scheduleType !== undefined) schedule.scheduleType = body.scheduleType;
    if (body.executeAt !== undefined) {
      schedule.executeAt = body.executeAt ? new Date(body.executeAt) : null;
    }
    if (body.cronExpression !== undefined) {
      schedule.cronExpression = body.cronExpression || null;
    }

    const updatedSchedule = await scheduleRepository.save(schedule);
    schedulerService.addSchedule(updatedSchedule);

    res.json(updatedSchedule);
  } catch (error) {
    console.error('Failed to update schedule:', error);
    res.status(500).json({ error: 'Failed to update schedule' });
  }
});

router.delete('/schedules/:id', async (req: Request, res: Response) => {
  try {
    const scheduleRepository = AppDataSource.getRepository(Schedule);
    const scheduleId = parseInt(req.params.id);
    const schedule = await scheduleRepository.findOne({
      where: { id: scheduleId },
    });

    if (!schedule) {
      res.status(404).json({ error: 'Schedule not found' });
      return;
    }

    schedulerService.removeSchedule(scheduleId);
    await scheduleRepository.remove(schedule);

    res.status(204).send();
  } catch (error) {
    console.error('Failed to delete schedule:', error);
    res.status(500).json({ error: 'Failed to delete schedule' });
  }
});

router.post('/schedules/:id/toggle', async (req: Request, res: Response) => {
  try {
    const scheduleRepository = AppDataSource.getRepository(Schedule);
    const schedule = await scheduleRepository.findOne({
      where: { id: parseInt(req.params.id) },
    });

    if (!schedule) {
      res.status(404).json({ error: 'Schedule not found' });
      return;
    }

    schedule.isEnabled = !schedule.isEnabled;
    const updatedSchedule = await scheduleRepository.save(schedule);

    if (schedule.isEnabled) {
      schedulerService.addSchedule(updatedSchedule);
    } else {
      schedulerService.removeSchedule(schedule.id);
    }

    res.json(updatedSchedule);
  } catch (error) {
    console.error('Failed to toggle schedule:', error);
    res.status(500).json({ error: 'Failed to toggle schedule' });
  }
});

export default router;
