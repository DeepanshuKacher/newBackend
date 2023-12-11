import { Injectable, NotImplementedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";

@Injectable()
export class MailServiceService {
  constructor(private readonly config: ConfigService) { }
  async sendMail(email: string, text: string) {
    const transporter = nodemailer.createTransport({
      host: this.config.get('mail_host'),
      port: parseInt(this.config.get('mail_port')),
      secure: true,
      auth: {
        user: this.config.get('mail_user'),
        pass: this.config.get('mail_user_password'),
      },
    });

    console.log(this.config.get('mail_user'),
      this.config.get('mail_user_password'));

    return await transporter
      .sendMail({
        from: this.config.get('mail_user'),
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
