import { Injectable, NotImplementedException } from "@nestjs/common";
import * as nodemailer from "nodemailer";

@Injectable()
export class MailServiceService {
  async sendMail(email: string, text: string) {
    const transporter = nodemailer.createTransport({
      host: "mail.eatrofoods.com",
      port: 465,
      secure: true,
      auth: {
        user: "care@eatrofoods.com",
        pass: "9m4P,Br4T5",
      },
    });
    return await transporter.sendMail({
      from: "care@eatrofoods.com",
      to: email,
      subject: "Message",
      text,
    });
    //   (error, info) => {
    //     if (error) throw new NotImplementedException();
    //     else if (info) return info;
    //   },
    // );
  }
}
