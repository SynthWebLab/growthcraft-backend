import { Request, Response, NextFunction } from 'express';
import { reservationService, CreateReservationDTO } from '../services/reservation.service';
import { logger } from '@/common/utils/logger.util';

export class ReservationController {
  private static instance: ReservationController;

  private constructor() {}

  public static getInstance(): ReservationController {
    if (!ReservationController.instance) {
      ReservationController.instance = new ReservationController();
    }
    return ReservationController.instance;
  }

  /**
   * Create a new reservation
   * POST /api/v1/reservations
   */
  public async createReservation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data: CreateReservationDTO = {
        name: req.body.name?.trim(),
        email: req.body.email?.trim(),
        phone: req.body.phone?.trim(),
        itemType: req.body.itemType?.trim(),
        itemId: req.body.itemId?.trim(),
        notes: req.body.notes?.trim(),
        source: req.body.source || 'web',
      };

      const reservation = await reservationService.createReservation(data);

      res.status(201).json({
        success: true,
        message: 'Reservation created successfully',
        data: {
          reservation,
        },
      });
    } catch (error: any) {
      logger.error('Create reservation controller error:', error);
      next(error);
    }
  }

  /**
   * Get reservation by ID
   * GET /api/v1/reservations/:id
   */
  public async getReservationById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const reservation = await reservationService.getReservationById(id);

      if (!reservation) {
        res.status(404).json({
          success: false,
          message: 'Reservation not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          reservation,
        },
      });
    } catch (error: any) {
      logger.error('Get reservation by ID controller error:', error);
      next(error);
    }
  }

  /**
   * Get reservations by email
   * GET /api/v1/reservations/email/:email
   */
  public async getReservationsByEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.params;

      const reservations = await reservationService.getReservationsByEmail(email);

      res.status(200).json({
        success: true,
        data: {
          reservations,
          count: reservations.length,
        },
      });
    } catch (error: any) {
      logger.error('Get reservations by email controller error:', error);
      next(error);
    }
  }

  /**
   * Confirm reservation
   * POST /api/v1/reservations/:id/confirm
   */
  public async confirmReservation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const reservation = await reservationService.confirmReservation(id);

      res.status(200).json({
        success: true,
        message: 'Reservation confirmed successfully',
        data: {
          reservation,
        },
      });
    } catch (error: any) {
      logger.error('Confirm reservation controller error:', error);
      next(error);
    }
  }

  /**
   * Cancel reservation
   * POST /api/v1/reservations/:id/cancel
   */
  public async cancelReservation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const reservation = await reservationService.cancelReservation(id);

      res.status(200).json({
        success: true,
        message: 'Reservation cancelled successfully',
        data: {
          reservation,
        },
      });
    } catch (error: any) {
      logger.error('Cancel reservation controller error:', error);
      next(error);
    }
  }
}

export const reservationController = ReservationController.getInstance();
