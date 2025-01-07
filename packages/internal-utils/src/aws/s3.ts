import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { AWS_REGION } from "./aws";

const s3 = new S3Client({ region: AWS_REGION });

export const writeS3Object = async (
  bucketName: string,
  path: string,
  data: string
) => {
  await s3.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: path,
      Body: data,
    })
  );

  return `https://${bucketName}.s3.${AWS_REGION}.amazonaws.com/${path}`;
};
