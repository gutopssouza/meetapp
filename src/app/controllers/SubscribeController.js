import { isBefore } from 'date-fns';
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
}

export default new SubscribeController();
