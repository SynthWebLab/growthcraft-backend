import { RedisConfig, redisConfig } from '../config/redis.config';
import { logger } from '../common/utils/logger.util';

describe('RedisConfig - SCAN iteration & delByPattern', () => {
  let mockClient: any;
  let loggerErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    loggerErrorSpy = jest.spyOn(logger, 'error').mockImplementation(() => logger);

    mockClient = {
      scan: jest.fn(),
      del: jest.fn(),
      keys: jest.fn(),
      isOpen: true,
    };

    // Inject mock client and connected state into singleton instance
    (redisConfig as any).client = mockClient;
    (redisConfig as any).isConnected = true;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('delByPattern', () => {
    it('should delete keys in batches using SCAN without calling KEYS', async () => {
      // Setup mock scan responses across 2 pages
      mockClient.scan
        .mockResolvedValueOnce({
          cursor: '42',
          keys: ['public:course:1', 'public:course:2'],
        })
        .mockResolvedValueOnce({
          cursor: '0',
          keys: ['public:course:3'],
        });
      mockClient.del.mockResolvedValue(1);

      const totalDeleted = await redisConfig.delByPattern('public:course:*', 50);

      expect(totalDeleted).toBe(3);
      // Ensure KEYS was NOT called
      expect(mockClient.keys).not.toHaveBeenCalled();

      // Ensure SCAN was called with initial cursor '0' and subsequent cursor '42'
      expect(mockClient.scan).toHaveBeenCalledTimes(2);
      expect(mockClient.scan).toHaveBeenNthCalledWith(1, '0', {
        MATCH: 'public:course:*',
        COUNT: 50,
      });
      expect(mockClient.scan).toHaveBeenNthCalledWith(2, '42', {
        MATCH: 'public:course:*',
        COUNT: 50,
      });

      // Ensure DEL was called with each batch
      expect(mockClient.del).toHaveBeenCalledTimes(2);
      expect(mockClient.del).toHaveBeenNthCalledWith(1, ['public:course:1', 'public:course:2']);
      expect(mockClient.del).toHaveBeenNthCalledWith(2, ['public:course:3']);
    });

    it('should handle zero matching keys without calling DEL', async () => {
      mockClient.scan.mockResolvedValueOnce({
        cursor: '0',
        keys: [],
      });

      const totalDeleted = await redisConfig.delByPattern('unknown:*');

      expect(totalDeleted).toBe(0);
      expect(mockClient.scan).toHaveBeenCalledTimes(1);
      expect(mockClient.del).not.toHaveBeenCalled();
      expect(mockClient.keys).not.toHaveBeenCalled();
    });

    it('should return 0 when client is not connected', async () => {
      (redisConfig as any).isConnected = false;

      const totalDeleted = await redisConfig.delByPattern('test:*');

      expect(totalDeleted).toBe(0);
      expect(mockClient.scan).not.toHaveBeenCalled();
      expect(mockClient.del).not.toHaveBeenCalled();
    });

    it('should catch error and return partial count when scan fails', async () => {
      mockClient.scan.mockRejectedValueOnce(new Error('Redis connection lost'));

      const totalDeleted = await redisConfig.delByPattern('error:*');

      expect(totalDeleted).toBe(0);
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Redis DEL pattern error:',
        expect.any(Error)
      );
    });
  });

  describe('keys / scanKeys', () => {
    it('should collect all keys across SCAN iterations without calling KEYS', async () => {
      mockClient.scan
        .mockResolvedValueOnce({
          cursor: '15',
          keys: ['key:1', 'key:2'],
        })
        .mockResolvedValueOnce({
          cursor: '0',
          keys: ['key:3'],
        });

      const keys = await redisConfig.keys('key:*', 100);

      expect(keys).toEqual(['key:1', 'key:2', 'key:3']);
      expect(mockClient.keys).not.toHaveBeenCalled();
      expect(mockClient.scan).toHaveBeenCalledTimes(2);
    });

    it('should support scanKeys as an alias for keys', async () => {
      mockClient.scan.mockResolvedValueOnce({
        cursor: '0',
        keys: ['alias:1'],
      });

      const keys = await redisConfig.scanKeys('alias:*');

      expect(keys).toEqual(['alias:1']);
      expect(mockClient.scan).toHaveBeenCalledWith('0', {
        MATCH: 'alias:*',
        COUNT: 100,
      });
    });

    it('should return empty array when not connected', async () => {
      (redisConfig as any).isConnected = false;

      const keys = await redisConfig.keys('pattern:*');

      expect(keys).toEqual([]);
      expect(mockClient.scan).not.toHaveBeenCalled();
    });

    it('should catch error and return empty array when scan fails', async () => {
      mockClient.scan.mockRejectedValueOnce(new Error('SCAN failed'));

      const keys = await redisConfig.keys('error:*');

      expect(keys).toEqual([]);
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Redis SCAN error:',
        expect.any(Error)
      );
    });
  });

  describe('delByPatterns', () => {
    it('should delete multiple patterns sequentially', async () => {
      mockClient.scan
        .mockResolvedValueOnce({
          cursor: '0',
          keys: ['batch1:key1'],
        })
        .mockResolvedValueOnce({
          cursor: '0',
          keys: ['batch2:key1', 'batch2:key2'],
        });
      mockClient.del.mockResolvedValue(1);

      const totalDeleted = await redisConfig.delByPatterns(['batch1:*', 'batch2:*']);

      expect(totalDeleted).toBe(3);
      expect(mockClient.scan).toHaveBeenCalledTimes(2);
      expect(mockClient.del).toHaveBeenCalledTimes(2);
    });
  });
});
