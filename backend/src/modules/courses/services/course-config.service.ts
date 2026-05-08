import { CourseConfig, ICourseConfig } from '@/database/models/CourseConfig.model';
import { logger } from '@/common/utils/logger.util';

export class CourseConfigService {
  private static instance: CourseConfigService;
  private cache: Map<string, string[]> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  public static getInstance(): CourseConfigService {
    if (!CourseConfigService.instance) {
      CourseConfigService.instance = new CourseConfigService();
    }
    return CourseConfigService.instance;
  }

  /**
   * Get configuration values by key with caching
   */
  private async getConfigValues(key: string): Promise<string[]> {
    try {
      // Check cache
      const cached = this.cache.get(key);
      const expiry = this.cacheExpiry.get(key);
      
      if (cached && expiry && Date.now() < expiry) {
        return cached;
      }

      // Fetch from database
      const config = await CourseConfig.findOne({ key, isActive: true }).exec();
      
      if (!config || !config.values || config.values.length === 0) {
        logger.warn(`No config found for key: ${key}, using defaults`);
        return this.getDefaultValues(key);
      }

      // Update cache
      this.cache.set(key, config.values);
      this.cacheExpiry.set(key, Date.now() + this.CACHE_TTL);

      return config.values;
    } catch (error: any) {
      logger.error(`Error fetching config for key ${key}:`, error);
      return this.getDefaultValues(key);
    }
  }

  /**
   * Get default values if database config is not available
   */
  private getDefaultValues(key: string): string[] {
    const defaults: Record<string, string[]> = {
      categories: ['MERN', 'UI/UX', 'DataScience', 'DevOps', 'Other'],
      difficultyLevels: ['Beginner', 'Intermediate', 'Advanced'],
      courseTypes: ['Course', 'Bootcamp'],
    };
    return defaults[key] || [];
  }

  /**
   * Get all categories
   */
  public async getCategories(): Promise<string[]> {
    return this.getConfigValues('categories');
  }

  /**
   * Get all difficulty levels
   */
  public async getDifficultyLevels(): Promise<string[]> {
    return this.getConfigValues('difficultyLevels');
  }

  /**
   * Get all course types
   */
  public async getCourseTypes(): Promise<string[]> {
    return this.getConfigValues('courseTypes');
  }

  /**
   * Get all configurations at once
   */
  public async getAllConfigs(): Promise<{
    categories: string[];
    difficultyLevels: string[];
    courseTypes: string[];
  }> {
    const [categories, difficultyLevels, courseTypes] = await Promise.all([
      this.getCategories(),
      this.getDifficultyLevels(),
      this.getCourseTypes(),
    ]);

    return {
      categories,
      difficultyLevels,
      courseTypes,
    };
  }

  /**
   * Update configuration values (for admin use)
   */
  public async updateConfig(key: string, values: string[]): Promise<ICourseConfig> {
    try {
      const config = await CourseConfig.findOneAndUpdate(
        { key },
        { values, isActive: true },
        { new: true, upsert: true }
      ).exec();

      // Clear cache for this key
      this.cache.delete(key);
      this.cacheExpiry.delete(key);

      logger.info(`Updated config for key: ${key}`);
      return config!;
    } catch (error: any) {
      logger.error(`Error updating config for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Validate if a value exists in a config
   */
  public async validateValue(key: string, value: string): Promise<boolean> {
    const values = await this.getConfigValues(key);
    return values.includes(value);
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  public clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
    logger.info('Course config cache cleared');
  }

  /**
   * Initialize default configurations in database
   */
  public async initializeDefaults(): Promise<void> {
    try {
      const defaults = [
        { key: 'categories', values: ['MERN', 'UI/UX', 'DataScience', 'DevOps', 'Other'] },
        { key: 'difficultyLevels', values: ['Beginner', 'Intermediate', 'Advanced'] },
        { key: 'courseTypes', values: ['Course', 'Bootcamp'] },
      ];

      for (const config of defaults) {
        const exists = await CourseConfig.findOne({ key: config.key }).exec();
        if (!exists) {
          await CourseConfig.create(config);
          logger.info(`Initialized default config for: ${config.key}`);
        }
      }
    } catch (error: any) {
      logger.error('Error initializing default configs:', error);
      throw error;
    }
  }
}

export const courseConfigService = CourseConfigService.getInstance();
