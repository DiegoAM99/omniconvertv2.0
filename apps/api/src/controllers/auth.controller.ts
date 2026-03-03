import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { signupSchema, loginSchema } from '@omniconvert/utils';
import { AppError } from '../middleware/error-handler';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret';

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

// Generate access token (7 days)
export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

// Generate refresh token (30 days)
export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '30d' });
};

// Verify access token
export const verifyAccessToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    throw new AppError('Invalid or expired token', 401, 'INVALID_TOKEN');
  }
};

// Signup handler
export const signup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const validatedData = signupSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      throw new AppError('Email already registered', 400, 'EMAIL_EXISTS');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // Create user with free subscription
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        name: validatedData.name,
        password: hashedPassword,
        role: 'user',
        subscription: {
          create: {
            tier: 'free',
            status: 'active',
          },
        },
      },
      include: {
        subscription: true,
      },
    });

    // Generate tokens
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Login handler
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const validatedData = loginSchema.parse(req.body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
      include: { subscription: true },
    });

    if (!user || !user.password) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(validatedData.password, user.password);

    if (!isValidPassword) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Generate tokens
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          subscription: user.subscription,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Logout handler (client-side token removal is primary mechanism)
export const logout = async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      message: 'Logged out successfully',
    },
  });
};

// Get current user
export const getCurrentUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        image: true,
        createdAt: true,
        subscription: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};
