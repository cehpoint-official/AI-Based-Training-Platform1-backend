import nodemailer from "nodemailer";
import { Router } from "express";
const emailRouter = Router();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  service: "gmail",
  secure: true,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
});

emailRouter.post("/sendcertificate", async (req, res) => {
  const { html, email } = req.body;

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    service: "gmail",
    secure: true,
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD,
    },
  });

  const options = {
    from: process.env.EMAIL,
    to: email,
    subject: "Certification of completion",
    html: html,
  };

  transporter.sendMail(options, (error, info) => {
    if (error) {
      res.status(500).json({ success: false, message: "Failed to send email" });
    } else {
      res.json({ success: true, message: "Email sent successfully" });
    }
  });
});

//SEND MAIL
emailRouter.post("/data", async (req, res) => {
  const receivedData = req.body;

  try {
    const emailHtml = receivedData.html;

    const options = {
      from: process.env.EMAIL,
      to: receivedData.to,
      subject: receivedData.subject,
      html: emailHtml,
    };

    const data = await transporter.sendMail(options);
    res.status(200).json(data);
  } catch (error) {
    res.status(400).json(error);
  }
});
export default emailRouter;
