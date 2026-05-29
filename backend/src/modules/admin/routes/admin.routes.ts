import { Router, Request, Response, NextFunction } from 'express';
import { batchController } from '../controllers/batch.controller';

const router = Router();

router.post('/batches', (req: Request, res: Response, next: NextFunction) => {
  void batchController.createBatch(req, res, next);
});

export default router;
