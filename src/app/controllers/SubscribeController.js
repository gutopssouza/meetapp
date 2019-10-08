import { isBefore } from 'date-fns';
import { Op } from 'sequelize';
import User from '../models/User';
import Meetup from '../models/Meetup';
import File from '../models/File';
import MeetupUser from '../models/MeetupUser';
import Queue from '../../lib/Queue';
import CancellationMail from '../jobs/CancellationMail';

class SubscribeController {
  async store(req, res) {
    const user = await User.findByPk(req.userId);
    const meetup = await Meetup.findByPk(req.params.meetupId, {
      include: [User],
    });

    if (meetup.user_id === req.userId) {
      return res
        .status(400)
        .json({ error: 'Can´t subscribe to your own mettup' });
    }

    if (isBefore(meetup.date, new Date())) {
      return res.status(400).json({ error: 'Can´t subscribe to past meetups' });
    }

    const checkDate = await MeetupUser.findOne({
      where: {
        user_id: user.id,
      },
      include: [
        {
          model: Meetup,
          required: true,
          where: {
            date: meetup.date,
          },
        },
      ],
    });

    if (checkDate) {
      return res
        .status(400)
        .json({ error: 'Can´t subscribe to two meetups at the same time' });
    }

    const subscription = await MeetupUser.create({
      user_id: user.id,
      meetup_id: meetup.id,
    });

    // console.log('Fila executou');

    await Queue.add(CancellationMail.key, {
      meetup,
      user,
    });

    return res.json(subscription);
  }

  async index(req, res) {
    const subscriptions = await MeetupUser.findAll({
      where: {
        user_id: req.userId,
      },
      include: [
        {
          model: Meetup,
          where: {
            date: {
              [Op.gt]: new Date(),
            },
          },
          required: true,
          include: [
            User,
            {
              model: File,
              as: 'banner',
              attributes: ['id', 'path', 'url'],
            },
          ],
        },
      ],
      order: [[Meetup, 'date']],
    });

    return res.json(subscriptions);
  }

  async delete(req, res) {
    const meetupUser = await MeetupUser.findByPk(req.params.id);
    const meetup = await Meetup.findByPk(meetupUser.meetup_id);

    if (meetupUser.user_id !== req.userId) {
      return res.status(401).json({
        error: 'You do not have permission to unsubscribe to this meetup.',
      });
    }

    if (isBefore(meetup.date, new Date())) {
      return res
        .status(400)
        .json({ error: 'You are not allowed to unsubscribe past meetups' });
    }

    await meetupUser.destroy({ force: true });

    return res.json({ ok: true });
  }
}

export default new SubscribeController();
