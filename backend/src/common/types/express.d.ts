// Express type extensions
import type { UserRole } from '../constants/user.constants';

declare global {
  namespace Express {
    interface User {
      userId: string;
      email: string;
      role: UserRole;
    }
    
    interface Request {
      user?: User;
    }
  }
}

export {};
