import jwt from 'jsonwebtoken';
import { config } from './index';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export class JwtConfig {
  private static instance: JwtConfig;

  private constructor() {}

  public static getInstance(): JwtConfig {
    if (!JwtConfig.instance) {
      JwtConfig.instance = new JwtConfig();
    }
    return JwtConfig.instance;
  }

  public generateAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRES_IN,
      issuer: 'growthcraft-api',
      audience: 'growthcraft-client',
    } as jwt.SignOptions);
  }

  public generateRefreshToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, config.JWT_REFRESH_SECRET, {
      expiresIn: config.JWT_REFRESH_EXPIRES_IN,
      issuer: 'growthcraft-api',
      audience: 'growthcraft-client',
    } as jwt.SignOptions);
  }

  public generateTokenPair(payload: Omit<JwtPayload, 'iat' | 'exp'>): TokenPair {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }

  public verifyAccessToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, config.JWT_SECRET, {
        issuer: 'growthcraft-api',
        audience: 'growthcraft-client',
      }) as JwtPayload;
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Access token expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid access token format');
      }
      throw new Error('Invalid access token');
    }
  }

  public verifyRefreshToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, config.JWT_REFRESH_SECRET, {
        issuer: 'growthcraft-api',
        audience: 'growthcraft-client',
      }) as JwtPayload;
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Refresh token expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid refresh token format');
      }
      throw new Error('Invalid refresh token');
    }
  }

  public decodeToken(token: string): JwtPayload | null {
    try {
      return jwt.decode(token) as JwtPayload;
    } catch (error) {
      return null;
    }
  }

  public getTokenExpirationTime(expiresIn: string): Date {
    const now = new Date();
    const match = expiresIn.match(/^(\d+)([smhd])$/);

    if (!match) {
      throw new Error('Invalid expiration format');
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return new Date(now.getTime() + value * 1000);
      case 'm':
        return new Date(now.getTime() + value * 60 * 1000);
      case 'h':
        return new Date(now.getTime() + value * 60 * 60 * 1000);
      case 'd':
        return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
      default:
        throw new Error('Invalid time unit');
    }
  }
}

export const jwtConfig = JwtConfig.getInstance();
