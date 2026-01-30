import { Hono } from 'hono';
import { AppDataSource } from '../config/database';
import { Schedule, ScheduleType } from '../entities/Schedule';
import { schedulerService } from '../services/SchedulerService';
import { ApplianceAction } from '../types/nature';

const router = new Hono();

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

router.get('/schedules', async (c) => {
  try {
    const scheduleRepository = AppDataSource.getRepository(Schedule);
    const schedules = await scheduleRepository.find({
      order: { createdAt: 'DESC' },
    });
    return c.json(schedules);
  } catch (error) {
    console.error('Failed to fetch schedules:', error);
    return c.json({ error: 'Failed to fetch schedules' }, 500);
  }
});

router.get('/schedules/:id', async (c) => {
  try {
    const scheduleRepository = AppDataSource.getRepository(Schedule);
    const schedule = await scheduleRepository.findOne({
      where: { id: parseInt(c.req.param('id')) },
    });

    if (!schedule) {
      return c.json({ error: 'Schedule not found' }, 404);
    }

    return c.json(schedule);
  } catch (error) {
    console.error('Failed to fetch schedule:', error);
    return c.json({ error: 'Failed to fetch schedule' }, 500);
  }
});

router.post('/schedules', async (c) => {
  try {
    const body = await c.req.json<CreateScheduleBody>();

    if (!body.applianceId || !body.action || !body.scheduleType) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    if (body.scheduleType === 'once' && !body.executeAt) {
      return c.json({ error: 'executeAt is required for one-time schedules' }, 400);
    }

    if (body.scheduleType === 'recurring' && !body.cronExpression) {
      return c.json({ error: 'cronExpression is required for recurring schedules' }, 400);
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

    return c.json(savedSchedule, 201);
  } catch (error) {
    console.error('Failed to create schedule:', error);
    return c.json({ error: 'Failed to create schedule' }, 500);
  }
});

router.put('/schedules/:id', async (c) => {
  try {
    const scheduleRepository = AppDataSource.getRepository(Schedule);
    const schedule = await scheduleRepository.findOne({
      where: { id: parseInt(c.req.param('id')) },
    });

    if (!schedule) {
      return c.json({ error: 'Schedule not found' }, 404);
    }

    const body = await c.req.json<Partial<CreateScheduleBody>>();

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

    return c.json(updatedSchedule);
  } catch (error) {
    console.error('Failed to update schedule:', error);
    return c.json({ error: 'Failed to update schedule' }, 500);
  }
});

router.delete('/schedules/:id', async (c) => {
  try {
    const scheduleRepository = AppDataSource.getRepository(Schedule);
    const scheduleId = parseInt(c.req.param('id'));
    const schedule = await scheduleRepository.findOne({
      where: { id: scheduleId },
    });

    if (!schedule) {
      return c.json({ error: 'Schedule not found' }, 404);
    }

    schedulerService.removeSchedule(scheduleId);
    await scheduleRepository.remove(schedule);

    return c.body(null, 204);
  } catch (error) {
    console.error('Failed to delete schedule:', error);
    return c.json({ error: 'Failed to delete schedule' }, 500);
  }
});

router.post('/schedules/:id/toggle', async (c) => {
  try {
    const scheduleRepository = AppDataSource.getRepository(Schedule);
    const schedule = await scheduleRepository.findOne({
      where: { id: parseInt(c.req.param('id')) },
    });

    if (!schedule) {
      return c.json({ error: 'Schedule not found' }, 404);
    }

    schedule.isEnabled = !schedule.isEnabled;
    const updatedSchedule = await scheduleRepository.save(schedule);

    if (schedule.isEnabled) {
      schedulerService.addSchedule(updatedSchedule);
    } else {
      schedulerService.removeSchedule(schedule.id);
    }

    return c.json(updatedSchedule);
  } catch (error) {
    console.error('Failed to toggle schedule:', error);
    return c.json({ error: 'Failed to toggle schedule' }, 500);
  }
});

export default router;
