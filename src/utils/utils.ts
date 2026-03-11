import { ApiError } from "./try-catch";
import { JwtPayload, sign, verify } from "jsonwebtoken";
import fs from "fs";
import path from "path";
import multer from "multer";
import nodemailer from "nodemailer";
import { DisableButtonModel } from "../db/schema/disbale-button.schema";

export function checkFields(
  fields: Record<string, unknown>,
  optionalFields: string[]
) {
  if (!Object.keys(fields).length)
    throw TError("Please fill all required fields", 400);
  const keys = Object.keys(fields);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (optionalFields.includes(key)) continue;
    if (!fields[key] && key === "email")
      throw new ApiError(`user is required`, 400);
    if (!fields[key]) throw new ApiError(`${key} is required`, 400);
  }
}

export function TError(err: string, status: number) {
  throw new ApiError(err, status);
}

export function generateHash(password: string) {
  if (!password) TError("Password is required", 400);
  const secret = process.env.SECRET!;
  const hash = sign({ password }, secret);
  return hash;
}

export function comparehash(password: string, hash: string) {
  const secret = process.env.SECRET!;
  const hashPass = verify(hash, secret) as { password: string; iat: number };
  return hashPass.password === password;
}

export function generateToken(id: string) {
  const secret = process.env.SECRET!;
  const token = sign({ id }, secret, { expiresIn: "1d" });
  return token;
}

export function verifyToken(token: string) {
  const secret = process.env.SECRET!;
  if (!token) TError("Token is required", 400);
  try {
    const decoded = verify(token, secret);
    return decoded as JwtPayload;
  } catch (_err) {
    TError("Yuor session has expired", 400);
  }
}

export function removeFile(name: string) {
  const deletePath = path.join(__dirname, "../../uploads", name);
  const fileExists = fs.existsSync(deletePath);
  if (!fileExists) return;
  fs.unlink(deletePath, (err) => {
    if (err) return TError("File not found", 404);
  });
}

export function multerStorage(uploadDir: string): multer.StorageEngine {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const fileName = `${Date.now()}-${file.originalname.replace(/ /g, "")}`;
      cb(null, fileName);
    },
  });
  return storage;
}

function getPassword(hash: string) {
  const secret = process.env.SECRET!;
  const hashPass = verify(hash, secret) as { password: string; iat: number };
  return hashPass.password;
}

export async function sendPasswordMail(password: string, to: string) {
  const transport = nodemailer.createTransport({
    port: 587,
    secure: false,
    host: "smtp-mail.outlook.com",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD,
    },
  });

  const info = await transport.sendMail({
    from: process.env.EMAIL,
    to,
    subject: "Recovery Password",
    text: `Password ${getPassword(password)}`,
  });
  if (info.accepted) {
    return "Recovery email sent successfully";
  }
  return "Error in sending recovery email";
}

export async function isFunctionDisable(
  type: "upload" | "background" | "chat" | "delete"
) {
  if (type === "chat") {
    const disable = await DisableButtonModel.findOne({ name: "chat" }).lean();
    return disable?.disable;
  } else if (type === "background") {
    const disable = await DisableButtonModel.findOne({
      name: "background",
    }).lean();
    return disable?.disable;
  } else if (type === "upload") {
    const disable = await DisableButtonModel.findOne({
      name: "upload",
    }).lean();
    return disable?.disable;
  } else {
    const disable = await DisableButtonModel.findOne({
      name: "delete",
    }).lean();
    return disable?.disable;
  }
}
