import { Response } from 'express';
import { HttpStatus } from '@/common/constants/http-status.constant';

export interface SuccessResponse<T = any> {
  success: true;
  message: string;
  data?: T;
  meta?: {
    timestamp: string;
    requestId?: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export class SuccessResponseHelper {
  /**
   * Send success response
   */
  public static send<T>(
    res: Response,
    data?: T,
    message: string = 'Success',
    statusCode: number = HttpStatus.OK,
    meta?: any
  ): Response {
    const response: SuccessResponse<T> = {
      success: true,
      message,
      ...(data !== undefined && { data }),
      meta: {
        timestamp: new Date().toISOString(),
        ...meta,
      },
    };

    return res.status(statusCode).json(response);
  }

  /**
   * Send created response (201)
   */
  public static created<T>(
    res: Response,
    data?: T,
    message: string = 'Resource created successfully'
  ): Response {
    return this.send(res, data, message, HttpStatus.CREATED);
  }

  /**
   * Send OK response (200)
   */
  public static ok<T>(res: Response, data?: T, message: string = 'Success'): Response {
    return this.send(res, data, message, HttpStatus.OK);
  }

  /**
   * Send no content response (204)
   */
  public static noContent(res: Response): Response {
    return res.status(HttpStatus.NO_CONTENT).send();
  }

  /**
   * Send paginated response
   */
  public static paginated<T>(
    res: Response,
    data: T[],
    pagination: {
      page: number;
      limit: number;
      total: number;
    },
    message: string = 'Data retrieved successfully'
  ): Response {
    const totalPages = Math.ceil(pagination.total / pagination.limit);

    return this.send(res, data, message, HttpStatus.OK, {
      pagination: {
        ...pagination,
        totalPages,
      },
    });
  }

  /**
   * Send authentication success response
   */
  public static authenticated<T>(
    res: Response,
    data: T,
    message: string = 'Authentication successful'
  ): Response {
    return this.send(res, data, message, HttpStatus.OK);
  }

  /**
   * Send logout success response
   */
  public static logout(res: Response, message: string = 'Logged out successfully'): Response {
    return this.send(res, undefined, message, HttpStatus.OK);
  }
}

export default SuccessResponseHelper;
