import { isBefore } from 'date-fns';
import { Op } from 'sequelize';
import User from '../models/User';
import Meetup from '../models/Meetup';
import MeetupUser from '../models/MeetupUser';

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
        },
      ],
      order: [[Meetup, 'date']],
    });

    return res.json(subscriptions);
  }
}

export default new SubscribeController();
