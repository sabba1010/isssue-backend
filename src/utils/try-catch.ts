import { NextFunction, Request, Response } from "express";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.message = message;
    this.status = status;
  }
}

export function TryCatch<T>(
  fn: (_req: Request, _res: Response, _next: NextFunction) => Promise<T>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
