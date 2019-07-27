import { format, parseISO } from 'date-fns';
import pt from 'date-fns/locale/pt';
import Mail from '../../lib/Mail';

class CancellationMail {
  get key() {
    return 'CancellationMail';
  }

  async handle({ data }) {
    const { meetup, user } = data;
    await Mail.sendMail({
      to: `${meetup.User.name} <${meetup.User.email}>`,
      subject: `Um novo usuário se inscreveu no seu Meetup: ${meetup.title}`,
      template: 'cancellation',
      context: {
        host: meetup.User.name,
        meetupTitle: meetup.title,
        meetupDate: format(
          parseISO(meetup.date),
          "'dia' dd 'de' MMMM', ás' H:mm'h'",
          {
            locale: pt,
          }
        ),
        userName: user.name,
        userEmail: user.email,
      },
    });
  }
}

export default new CancellationMail();
