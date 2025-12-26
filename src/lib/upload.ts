import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import multerS3 from "multer-s3";
import { S3Client } from "@aws-sdk/client-s3";

const isProd = process.env.NODE_ENV === "production";

// s3 설정
const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// 로컬 저장소
const uploadDir = path.join(process.cwd(), "public", "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const localStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  },
});

export const upload = multer({
  storage: isProd
    ? multerS3({
        s3,
        bucket: process.env.AWS_S3_BUCKET!,
        acl: "public-read",
        key: (
          _req: Express.Request,
          file: Express.Multer.File,
          cb: (error: any, key?: string) => void,
        ) => {
          const ext = path.extname(file.originalname);
          const name = `uploads/${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}${ext}`;
          cb(null, name);
        },
      })
    : localStorage,
});

// 이미지 url
export const buildImageUrl = (pathOrKey: string) =>
  isProd
    ? `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${pathOrKey}`
    : `${process.env.IMAGE_BASE_URL || "http://localhost:3000"}/uploads/${pathOrKey}`;
