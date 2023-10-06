const nodemailer = require('nodemailer');
const { convert } = require('html-to-text');

module.exports = class Email {
  constructor(emailText, subject, email) {
    this.email = email;
    this.subject = subject;
    this.emailText = emailText;
  }

  newTransport() {
    return nodemailer.createTransport({
      host: process.env.BREVO_HOST,
      port: process.env.BREVO_PORT,
      auth: {
        user: process.env.BREVO_USERNAME,
        pass: process.env.BREVO_PASSWORD,
      },
    });
  }

  async send() {
    const html = `<!DOCTYPE html>
    <html lang="en"><head>
    <meta charset="UTF-8"><meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.subject}</title>
    </head>
    <body>${this.emailText}</body>
    </html>`;

    const options = {
      wordwrap: 430,
    };

  
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: this.email,
      subject: this.subject,
      html,
      text: convert(html, options),
    };

    await this.newTransport().sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log(info);
      }
    });
  }
};
