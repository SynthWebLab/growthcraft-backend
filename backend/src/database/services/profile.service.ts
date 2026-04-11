import mongoose from 'mongoose';
import { UserRole } from '@/common/constants/user.constants';
import {
  StudentProfile,
  CollegeProfile,
  MentorProfile,
  AmbassadorProfile,
  HiringPartnerProfile,
  IStudentProfile,
  ICollegeProfile,
  IMentorProfile,
  IAmbassadorProfile,
  IHiringPartnerProfile,
} from '../models';

type ProfileModel =
  | typeof StudentProfile
  | typeof CollegeProfile
  | typeof MentorProfile
  | typeof AmbassadorProfile
  | typeof HiringPartnerProfile;

type ProfileDocument =
  | IStudentProfile
  | ICollegeProfile
  | IMentorProfile
  | IAmbassadorProfile
  | IHiringPartnerProfile;

/**
 * Get the appropriate profile model based on user role
 */
export const getProfileModel = (role: UserRole): ProfileModel | null => {
  const modelMap: Record<UserRole, ProfileModel> = {
    [UserRole.STUDENT]: StudentProfile,
    [UserRole.COLLEGE]: CollegeProfile,
    [UserRole.MENTOR]: MentorProfile,
    [UserRole.AMBASSADOR]: AmbassadorProfile,
    [UserRole.HIRING_PARTNER]: HiringPartnerProfile,
  };

  return modelMap[role] || null;
};

/**
 * Create a profile for a user based on their role
 */
export const createProfile = async (
  userId: mongoose.Types.ObjectId,
  role: UserRole,
  profileData: Partial<ProfileDocument>
): Promise<ProfileDocument | null> => {
  const ProfileModel = getProfileModel(role);

  if (!ProfileModel) {
    throw new Error(`No profile model found for role: ${role}`);
  }

  const profile = await ProfileModel.create({
    userId,
    ...profileData,
  });

  return profile as ProfileDocument;
};

/**
 * Get a user's profile based on their role
 */
export const getProfile = async (
  userId: mongoose.Types.ObjectId,
  role: UserRole
): Promise<ProfileDocument | null> => {
  const ProfileModel = getProfileModel(role);

  if (!ProfileModel) {
    return null;
  }

  const profile = await ProfileModel.findOne({ userId });
  return profile as ProfileDocument | null;
};

/**
 * Update a user's profile
 */
export const updateProfile = async (
  userId: mongoose.Types.ObjectId,
  role: UserRole,
  updateData: Partial<ProfileDocument>
): Promise<ProfileDocument | null> => {
  const ProfileModel = getProfileModel(role);

  if (!ProfileModel) {
    throw new Error(`No profile model found for role: ${role}`);
  }

  const profile = await ProfileModel.findOneAndUpdate({ userId }, updateData, {
    new: true,
    runValidators: true,
  });

  return profile as ProfileDocument | null;
};

/**
 * Delete a user's profile
 */
export const deleteProfile = async (
  userId: mongoose.Types.ObjectId,
  role: UserRole
): Promise<boolean> => {
  const ProfileModel = getProfileModel(role);

  if (!ProfileModel) {
    return false;
  }

  const result = await ProfileModel.deleteOne({ userId });
  return result.deletedCount > 0;
};

/**
 * Get user with their profile populated
 */
export const getUserWithProfile = async (userId: mongoose.Types.ObjectId, role: UserRole) => {
  const { User } = await import('../models');
  const user = await User.findById(userId);

  if (!user) {
    return null;
  }

  const profile = await getProfile(userId, role);

  return {
    user,
    profile,
  };
};
