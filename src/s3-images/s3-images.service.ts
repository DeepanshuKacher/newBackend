import {
  PutObjectCommand,
  PutObjectCommandInput,
  S3,
} from "@aws-sdk/client-s3";
import { constants, privateContstants } from "src/useFullItems";
import { Injectable, UnprocessableEntityException } from "@nestjs/common";

@Injectable()
export class S3ImagesService {
  private readonly s3Client: S3;
  constructor() {
    this.s3Client = new S3({
      forcePathStyle: false, // Configures to use subdomain/virtual calling format.
      endpoint: privateContstants.s3Endpoint,
      region: privateContstants.s3Region,
      credentials: {
        // accessKeyId: process.env.SPACES_KEY,
        accessKeyId: privateContstants.s3AccessKeyId,
        // secretAccessKey: process.env.SPACES_SECRET,
        secretAccessKey: privateContstants.s3SecretAccessKey,
      },
    });
  }

  createImage(name: string, restaurantId: string, file: Express.Multer.File) {
    try {

      const bucketParams: PutObjectCommandInput = {
        Bucket: constants.s3Bucket,
        Key: privateContstants.objectKey(restaurantId, name),
        Body: file?.buffer,
        ACL: "public-read	",
      };
      this.s3Client.send(new PutObjectCommand(bucketParams));
    } catch (error) {
      if (constants.IS_DEVELOPMENT) console.log(error);
      throw new UnprocessableEntityException();
    }
  }

  deleteImage(restaurantId: string, name: string) {
    try {
      this.s3Client.deleteObject({
        Bucket: constants.s3Bucket,
        Key: privateContstants.objectKey(restaurantId, name),
      });
    } catch (error) {
      if (constants.IS_DEVELOPMENT) console.log(error);
      throw new UnprocessableEntityException();
    }
  }
}
