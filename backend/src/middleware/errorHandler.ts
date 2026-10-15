import { Request, Response, NextFunction } from 'express';
import { ENV } from '../config/env';

export interface AppError extends Error {
  status?: number;
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
}

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction): void {
  console.error('Unhandled Server Error:', err.message || err);
  let status = err.status || 500;
  if (err.name === 'MulterError' || (err.message && err.message.includes('Only image files'))) {
    status = 400;
  }
  res.status(status).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: ENV.NODE_ENV === 'development' ? err.stack : undefined
  });
}
