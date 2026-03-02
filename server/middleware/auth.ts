import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { supabase } from '../utils/supabase';

export interface AuthenticatedRequest extends Request {
  user?: any;
}

const SECRET_KEY = process.env.JWT_SECRET || 'secret-key-change-me';

export const protect = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!supabase) return res.status(503).json({ error: 'Database service is unavailable' });
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query.token) {
    token = req.query.token as string;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, SECRET_KEY) as any;
      
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', decoded.id)
        .single();

      if (error || !user) {
        return res.status(401).json({ error: 'Not authorized, user not found' });
      }

      req.user = {
        id: user.id,
        email: user.email,
        isAdmin: user.is_admin,
        fullName: user.full_name,
        department: user.department,
        regNo: user.reg_no,
        balance: user.balance
      };
      return next();
    } catch (error) {
      return res.status(401).json({ error: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authorized, no token' });
  }
};

export const admin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(401).json({ error: 'Not authorized as an admin' });
  }
};
