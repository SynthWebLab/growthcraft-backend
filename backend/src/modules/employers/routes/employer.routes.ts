import { Router, Request, Response, NextFunction } from 'express';
import { employerController } from '../controllers/employer.controller';
import { EmployerValidator } from '../validators/employer.validator';
import { authenticate } from '@/common/middleware/authenticate.middleware';
import { authorize } from '@/common/middleware/authorize.middleware';
import { UserRole } from '@/common/constants/user.constants';

// Router for /api/v1/employers
export const employerRouter = Router();

employerRouter.use(authenticate);
employerRouter.use(authorize([UserRole.EMPLOYER]));

employerRouter.get('/dashboard', (req: Request, res: Response, next: NextFunction) => {
  void employerController.getDashboard(req, res, next);
});

employerRouter.get('/jobs', (req: Request, res: Response, next: NextFunction) => {
  void employerController.getJobs(req, res, next);
});

employerRouter.post(
  '/jobs',
  EmployerValidator.createJob(),
  (req: Request, res: Response, next: NextFunction) => {
    void employerController.createJob(req, res, next);
  }
);

employerRouter.put(
  '/jobs/:id',
  EmployerValidator.updateJob(),
  (req: Request, res: Response, next: NextFunction) => {
    void employerController.updateJob(req, res, next);
  }
);

employerRouter.patch(
  '/jobs/:id/status',
  EmployerValidator.updateJobStatus(),
  (req: Request, res: Response, next: NextFunction) => {
    void employerController.updateJobStatus(req, res, next);
  }
);

employerRouter.delete('/jobs/:id', (req: Request, res: Response, next: NextFunction) => {
  void employerController.deleteJob(req, res, next);
});

employerRouter.get('/profile', (req: Request, res: Response, next: NextFunction) => {
  void employerController.getProfile(req, res, next);
});

employerRouter.patch(
  '/profile',
  EmployerValidator.updateProfile(),
  (req: Request, res: Response, next: NextFunction) => {
    void employerController.updateProfile(req, res, next);
  }
);


// Router for /api/v1/talent
export const talentRouter = Router();

talentRouter.use(authenticate);
talentRouter.use(authorize([UserRole.EMPLOYER]));

talentRouter.get('/', (req: Request, res: Response, next: NextFunction) => {
  void employerController.getTalentPool(req, res, next);
});


// Router for /api/v1/public/jobs
export const publicJobsRouter = Router();

publicJobsRouter.get('/', (req: Request, res: Response, next: NextFunction) => {
  void employerController.getPublicActiveJobs(req, res, next);
});
