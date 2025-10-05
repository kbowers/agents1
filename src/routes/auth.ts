import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { registerSchema, loginSchema } from '../schemas.js';
import { run, get } from '../../db/index.js';

const router = Router();

// POST /auth/register
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = registerSchema.parse(req.body);
    
    // Check if user already exists
    const existingUser = get('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Insert user
    const result = run(
      'INSERT INTO users (email, password_hash) VALUES (?, ?)',
      [email, passwordHash]
    );
    
    res.status(201).json({ 
      message: 'User created successfully',
      userId: result.lastInsertRowid 
    });
  } catch (error) {
    next(error);
  }
});

// POST /auth/login
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    
    // Find user
    const user = get('SELECT id, password_hash FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
    const token = jwt.sign(
      { userId: user.id },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    res.json({ 
      message: 'Login successful',
      token,
      userId: user.id
    });
  } catch (error) {
    next(error);
  }
});

export default router;