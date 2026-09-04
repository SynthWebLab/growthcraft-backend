import crypto from 'crypto';
import { MentorProfile, IMentorProfile } from '@/database/models/MentorProfile.model';
import { User, IUser } from '@/database/models/User.model';
import { logger } from '@/common/utils/logger.util';
import { redisConfig } from '@/config/redis.config';
import { NotFoundError } from '@/common/errors/NotFoundError';

export interface PublicMentorItem {
  _id: string;
  userId: string;
  name: string;
  photo: string;
  company: string;
  areaOfExpertise: string;
  expertiseTags: string[];
  sessionsDelivered: number;
  rating: number;
  bio: string;
  experienceYears: number;
  isVerified: boolean;
  linkedinUrl?: string;
}

export interface PublicMentorQueryParams {
  limit?: number;
  page?: number;
  search?: string;
  areaOfExpertise?: string;
  sortBy?: 'rating' | 'sessions' | 'experience' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface PublicMentorResponse {
  mentors: PublicMentorItem[];
  total: number;
}

export class PublicMentorService {
  private static instance: PublicMentorService | null = null;
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly CACHE_PREFIX = 'public:mentors:v2';

  private constructor() {}

  public static getInstance(): PublicMentorService {
    if (!PublicMentorService.instance) {
      PublicMentorService.instance = new PublicMentorService();
    }
    return PublicMentorService.instance;
  }

  /**
   * Get public mentors with caching, filtering, and pagination
   */
  public async getMentors(params: PublicMentorQueryParams = {}): Promise<PublicMentorResponse> {
    try {
      const cacheKey = this.generateCacheKey(params);
      const cached = await this.getFromCache(cacheKey);
      if (cached) {
        logger.info(`Cache hit for public mentors: ${cacheKey}`);
        return cached;
      }

      logger.info(`Cache miss for public mentors: ${cacheKey}`);

      const limit = params.limit ? Math.min(100, Math.max(1, params.limit)) : 50;
      const page = Math.max(1, params.page || 1);
      const skip = (page - 1) * limit;

      // 1. Build query for MentorProfile
      const profileFilter: any = {};
      if (params.areaOfExpertise && params.areaOfExpertise !== 'All') {
        profileFilter.areaOfExpertise = params.areaOfExpertise;
      }

      // 2. Fetch mentor profiles with populated active user
      const profiles = await MentorProfile.find(profileFilter)
        .populate<{ userId: IUser }>({
          path: 'userId',
          match: { role: 'mentor', isActive: true },
          select: 'fullName email phone avatar isActive role',
        })
        .exec();

      // 3. Filter out profiles where populated userId is null (i.e. inactive or non-mentor user)
      let validProfiles = profiles.filter((p) => Boolean(p.userId));

      // 4. Apply search filter in-memory across fullName, organization, expertise, specializations
      if (params.search && params.search.trim()) {
        const query = params.search.trim().toLowerCase();
        validProfiles = validProfiles.filter((p) => {
          const name = p.userId?.fullName?.toLowerCase() || '';
          const org = p.currentOrganization?.toLowerCase() || '';
          const expertise = p.areaOfExpertise?.toLowerCase() || '';
          const specs = (p.specializations || []).map((s) => s.toLowerCase()).join(' ');
          return (
            name.includes(query) ||
            org.includes(query) ||
            expertise.includes(query) ||
            specs.includes(query)
          );
        });
      }

      // 5. Apply sorting
      const sortBy = params.sortBy || 'rating';
      const sortOrder = params.sortOrder === 'asc' ? 1 : -1;

      validProfiles.sort((a, b) => {
        if (sortBy === 'rating') {
          return sortOrder * ((b.rating || 0) - (a.rating || 0));
        }
        if (sortBy === 'sessions') {
          return sortOrder * ((b.totalSessions || 0) - (a.totalSessions || 0));
        }
        if (sortBy === 'experience') {
          return sortOrder * ((b.experienceYears || 0) - (a.experienceYears || 0));
        }
        return sortOrder * (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      });

      const total = validProfiles.length;
      const paginated = validProfiles.slice(skip, skip + limit);

      const mentors: PublicMentorItem[] = paginated.map(this.mapToPublicMentor);

      const result: PublicMentorResponse = { mentors, total };

      await this.setInCache(cacheKey, result);
      return result;
    } catch (error: any) {
      logger.error('PublicMentorService.getMentors error:', error);
      throw error;
    }
  }

  /**
   * Get single mentor by ID
   */
  public async getMentorById(id: string): Promise<PublicMentorItem> {
    try {
      const cacheKey = `${this.CACHE_PREFIX}:item:${id}`;
      const cached = await this.getFromCache(cacheKey);
      if (cached) return cached;

      let profile = await MentorProfile.findById(id)
        .populate<{ userId: IUser }>('userId', 'fullName email phone avatar isActive role')
        .exec();

      if (!profile) {
        // Fallback: search by userId
        profile = await MentorProfile.findOne({ userId: id })
          .populate<{ userId: IUser }>('userId', 'fullName email phone avatar isActive role')
          .exec();
      }

      if (!profile || !profile.userId || !profile.userId.isActive) {
        throw new NotFoundError('Mentor not found');
      }

      const mentor = this.mapToPublicMentor(profile);
      await this.setInCache(cacheKey, mentor);
      return mentor;
    } catch (error: any) {
      logger.error('PublicMentorService.getMentorById error:', error);
      throw error;
    }
  }

  /**
   * Map raw MentorProfile and populated User to PublicMentorItem
   */
  private mapToPublicMentor(profile: any): PublicMentorItem {
    const user = profile.userId as any;
    const name = user?.fullName || 'GrowthCraft Mentor';

    // Prioritize explicit avatar, then user avatar, then dynamic Dicebear avatar
    const photo =
      profile.avatar && profile.avatar.trim() !== ''
        ? profile.avatar
        : user?.avatar && user.avatar.trim() !== ''
        ? user.avatar
        : `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;

    // Build rich expertise tags
    let expertiseTags: string[] = [];
    if (profile.specializations && profile.specializations.length > 0) {
      expertiseTags = profile.specializations.filter(Boolean);
    }
    if (expertiseTags.length === 0 && profile.areaOfExpertise) {
      expertiseTags = [profile.areaOfExpertise];
    }

    return {
      _id: profile._id.toString(),
      userId: user?._id ? user._id.toString() : '',
      name,
      photo,
      company: profile.currentOrganization || 'Tech Partner',
      areaOfExpertise: profile.areaOfExpertise || 'Software Engineering',
      expertiseTags,
      sessionsDelivered: profile.totalSessions || 0,
      rating: profile.rating > 0 ? profile.rating : 4.8,
      bio: profile.bio || '',
      experienceYears: profile.experienceYears || 0,
      isVerified: Boolean(profile.isVerified),
      linkedinUrl: profile.linkedinUrl || profile.linkedIn || '',
    };
  }

  private generateCacheKey(params: PublicMentorQueryParams): string {
    const sorted = {
      limit: params.limit || 50,
      page: params.page || 1,
      search: (params.search || '').trim().toLowerCase(),
      areaOfExpertise: params.areaOfExpertise || '',
      sortBy: params.sortBy || 'rating',
      sortOrder: params.sortOrder || 'desc',
    };
    const hash = crypto.createHash('md5').update(JSON.stringify(sorted)).digest('hex');
    return `${this.CACHE_PREFIX}:${hash}`;
  }

  private async getFromCache(key: string): Promise<any | null> {
    try {
      const cached = await redisConfig.get(key);
      if (cached) {
        return JSON.parse(cached);
      }
      return null;
    } catch (error) {
      logger.warn(`Redis get error for key ${key}:`, error);
      return null;
    }
  }

  private async setInCache(key: string, data: any): Promise<void> {
    try {
      await redisConfig.set(key, JSON.stringify(data), this.CACHE_TTL);
    } catch (error) {
      logger.warn(`Redis set error for key ${key}:`, error);
    }
  }
}

export const publicMentorService = PublicMentorService.getInstance();
