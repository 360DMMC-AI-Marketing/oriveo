import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";

let s3 = null;

function getS3() {
  if (!s3 && process.env.AWS_ACCESS_KEY_ID) {
    s3 = new S3Client({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }
  return s3;
}

export async function uploadAudio(fileBuffer, fileName) {
  const s3Client = getS3();
  if (s3Client) {
    try {
      const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: `recordings/${fileName}`,
        Body: fileBuffer,
        ContentType: "audio/mpeg",
      });
      await s3Client.send(command);
      return {
        url: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/recordings/${fileName}`,
        error: null,
      };
    } catch (error) {
      return { url: "", error: error.message };
    }
  }
  const localPath = path.join("uploads", fileName);
  fs.mkdirSync("uploads", { recursive: true });
  fs.writeFileSync(localPath, fileBuffer);
  return { url: `/uploads/${fileName}`, error: null };
}
