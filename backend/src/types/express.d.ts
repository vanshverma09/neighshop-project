import { IUser } from './shared/user.types';

declare global {
  namespace Express {
    interface Request {
      user?: IUser | null;
    }
  }
}

export {};
