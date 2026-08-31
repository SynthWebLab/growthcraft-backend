import { AuthService } from '@/modules/auth/services/auth.service';
import { TokenService } from '@/modules/auth/services/token.service';
import { RedisTokenService } from '@/modules/auth/services/redis-token.service';
import { NotificationService } from '@/modules/notifications/services/notification.service';
import { SocketService } from '@/modules/notifications/services/socket.service';
import { CourseConfigService } from '@/modules/courses/services/course-config.service';
import { StudentDashboardService } from '@/modules/students/services/student-dashboard.service';
import { CollegeDashboardService } from '@/modules/colleges/services/college-dashboard.service';
import { BatchService } from '@/modules/admin/services/batch.service';

describe('Service Testing & Dependency Injection Patterns', () => {
  afterEach(() => {
    // Verify that resetInstance hooks properly clear singleton instances
    AuthService.resetInstance();
    TokenService.resetInstance();
    RedisTokenService.resetInstance();
    NotificationService.resetInstance();
    SocketService.resetInstance();
    CourseConfigService.resetInstance();
    StudentDashboardService.resetInstance();
    CollegeDashboardService.resetInstance();
    BatchService.resetInstance();
  });

  describe('Direct Instantiation with Mock Dependencies (No Module Mocking)', () => {
    it('allows new AuthService() with injected mock TokenService and RedisTokenService', () => {
      const mockTokenService = {
        generateTokenPair: jest.fn().mockReturnValue({
          accessToken: 'mock_access',
          refreshToken: 'mock_refresh',
        }),
        storeRefreshToken: jest.fn().mockResolvedValue(undefined),
      } as unknown as TokenService;

      const mockRedisTokenService = {
        isAvailable: jest.fn().mockReturnValue(true),
        storeRefreshToken: jest.fn().mockResolvedValue(undefined),
      } as unknown as RedisTokenService;

      // Demonstrates clean direct constructor instantiation and injection
      const authServiceInstance = new AuthService({
        tokenService: mockTokenService,
        redisTokenService: mockRedisTokenService,
      });

      expect(authServiceInstance).toBeInstanceOf(AuthService);
      expect(authServiceInstance).toBeDefined();
    });

    it('allows new NotificationService() with injected mock SocketService', () => {
      const mockSocketService = {
        emitToUser: jest.fn(),
      } as unknown as SocketService;

      const notificationServiceInstance = new NotificationService({
        socketService: mockSocketService,
      });

      expect(notificationServiceInstance).toBeInstanceOf(NotificationService);
      expect(notificationServiceInstance).toBeDefined();
    });
  });

  describe('Isolated Instantiation for Domain Services', () => {
    it('can instantiate StudentDashboardService directly in test without singleton coupling', () => {
      const studentDashboard = new StudentDashboardService();
      expect(studentDashboard).toBeInstanceOf(StudentDashboardService);
    });

    it('can instantiate CollegeDashboardService directly in test without singleton coupling', () => {
      const collegeDashboard = new CollegeDashboardService();
      expect(collegeDashboard).toBeInstanceOf(CollegeDashboardService);
    });

    it('can instantiate BatchService directly in test without singleton coupling', () => {
      const batchService = new BatchService();
      expect(batchService).toBeInstanceOf(BatchService);
    });
  });

  describe('Test Lifecycle Isolation & Pollution Prevention', () => {
    it('clears CourseConfigService cache and singleton across test boundaries via resetInstance', () => {
      const instance1 = CourseConfigService.getInstance();
      expect(instance1).toBeDefined();

      CourseConfigService.resetInstance();

      const instance2 = CourseConfigService.getInstance();
      expect(instance2).toBeDefined();
      expect(instance2).not.toBe(instance1);
    });

    it('allows setInstance for stubbing a global service in integration contexts', () => {
      const mockService = {
        register: jest.fn(),
      } as unknown as AuthService;

      AuthService.setInstance(mockService);
      expect(AuthService.getInstance()).toBe(mockService);

      AuthService.resetInstance();
      expect(AuthService.getInstance()).not.toBe(mockService);
    });
  });
});
