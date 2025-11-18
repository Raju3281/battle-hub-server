import nodemailer from "nodemailer";

export const sendMail = async (to, subject, html) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user:'creationsnxg@gmail.com',
      pass: 'ruhh qgas dkvs snmz',
    },
  });

  const mailOptions = {
    from: `"BattleHub" <creationsnxg@gmail.com>`,
    to,
    subject,
    html,
  };

  await transporter.sendMail(mailOptions);
};
