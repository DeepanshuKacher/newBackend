import { S3 } from "@aws-sdk/client-s3";
import multer from "multer";
import multerS3 from "multer-s3";

const s3Client = new S3({
  forcePathStyle: false, // Configures to use subdomain/virtual calling format.
  endpoint: "https://s3-object.sgp1.digitaloceanspaces.com",
  region: "us-east-1",
  credentials: {
    // accessKeyId: process.env.SPACES_KEY,
    accessKeyId: "DO00YKWXZBZKVEGE9Q8C",
    // secretAccessKey: process.env.SPACES_SECRET,
    secretAccessKey: "5H8Ab8r1QwNB10ltMDHIwxg3m07g+yjO1PhY2YVebT8",
  },
});

// Change bucket property to your Space name
// const uploadPhotos = multer({
//   storage: multerS3({  -----------uninstall multer-s3
//     s3: s3Client,
//     bucket: "laptopMobileSinghpur",
//     acl: "public-read",
//     key: function (request, file, cb) {
//       console.log(file);
//       cb(null, file.originalname);
//     },
//   }),
// }).array("upload", 1);

export { s3Client };
