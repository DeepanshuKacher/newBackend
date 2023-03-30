import { Injectable, NotImplementedException } from "@nestjs/common";
import * as nodemailer from "nodemailer";
import { constants } from "src/useFullItems";

@Injectable()
export class MailServiceService {
  async sendMail(email: string, text: string) {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: "eatrofoods@gmail.com",
        pass: "zvcbewvcihijmdzz",
      },
    });
    return await transporter
      .sendMail({
        from: "eatrofoods@gmail.com",
        to: email,
        subject: "Message",
        text,
      })
      .catch((error) => {
        console.log({ error });
        throw new NotImplementedException();
      });
    //   (error, info) => {
    //     if (error) throw new NotImplementedException();
    //     else if (info) return info;
    //   },
    // );
  }
}
