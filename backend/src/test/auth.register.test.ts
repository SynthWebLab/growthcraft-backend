import mongoose from 'mongoose';
import { authService } from '@/modules/auth/services/auth.service';
import { User } from '@/database/models/User.model';
import { CollegeProfile } from '@/database/models/CollegeProfile.model';
import { emailService } from '@/common/services/email.service';
import { UserRole } from '@/common/constants/user.constants';

describe('AuthService.register - Transaction Support', () => {
  let mockSession: {
    startTransaction: jest.Mock;
    commitTransaction: jest.Mock;
    abortTransaction: jest.Mock;
    endSession: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockSession = {
      startTransaction: jest.fn(),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      abortTransaction: jest.fn().mockResolvedValue(undefined),
      endSession: jest.fn().mockResolvedValue(undefined),
    };

    jest.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession as any);
    jest.spyOn(emailService, 'sendVerificationOTP').mockResolvedValue(undefined as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should start transaction, commit, and end session on successful registration', async () => {
    jest.spyOn(User, 'findOne').mockReturnValue({
      session: jest.fn().mockResolvedValue(null),
    } as any);

    jest.spyOn(User.prototype, 'save').mockImplementation(function (this: any) {
      this._id = new mongoose.Types.ObjectId();
      return Promise.resolve(this);
    });

    jest.spyOn(CollegeProfile.prototype, 'save').mockImplementation(function (this: any) {
      this._id = new mongoose.Types.ObjectId();
      return Promise.resolve(this);
    });

    const result = await authService.register({
      fullName: 'Test College Admin',
      email: 'college@test.edu',
      phone: '9876543210',
      password: 'SecurePassword123!',
      role: UserRole.COLLEGE,
      collegeData: {
        institutionName: 'Test University',
        city: 'Bengaluru',
        state: 'Karnataka',
        contactPerson: 'Dean Smith',
        designation: 'Dean',
        officialEmail: 'dean@test.edu',
        phone: '9876543210',
      },
    });

    expect(mongoose.startSession).toHaveBeenCalled();
    expect(mockSession.startTransaction).toHaveBeenCalled();
    expect(mockSession.commitTransaction).toHaveBeenCalled();
    expect(mockSession.abortTransaction).not.toHaveBeenCalled();
    expect(mockSession.endSession).toHaveBeenCalled();
    expect(result.user.email).toBe('college@test.edu');
    expect(result.collegeProfile?.collegeName).toBe('Test University');
    expect(emailService.sendVerificationOTP).toHaveBeenCalled();
  });

  it('should abort transaction and end session when profile creation fails, without manual deletion', async () => {
    jest.spyOn(User, 'findOne').mockReturnValue({
      session: jest.fn().mockResolvedValue(null),
    } as any);

    const findByIdAndDeleteSpy = jest.spyOn(User, 'findByIdAndDelete');

    jest.spyOn(User.prototype, 'save').mockImplementation(function (this: any) {
      this._id = new mongoose.Types.ObjectId();
      return Promise.resolve(this);
    });

    // Simulate failure during CollegeProfile saving
    jest.spyOn(CollegeProfile.prototype, 'save').mockRejectedValue(new Error('College profile DB error'));

    await expect(
      authService.register({
        fullName: 'Failed College Admin',
        email: 'fail@test.edu',
        phone: '9876543210',
        password: 'SecurePassword123!',
        role: UserRole.COLLEGE,
        collegeData: {
          institutionName: 'Fail University',
          city: 'Bengaluru',
          state: 'Karnataka',
          contactPerson: 'Dean Smith',
          designation: 'Dean',
          officialEmail: 'dean@test.edu',
          phone: '9876543210',
        },
      })
    ).rejects.toThrow('College profile DB error');

    expect(mockSession.startTransaction).toHaveBeenCalled();
    expect(mockSession.abortTransaction).toHaveBeenCalled();
    expect(mockSession.commitTransaction).not.toHaveBeenCalled();
    expect(mockSession.endSession).toHaveBeenCalled();

    // Verify manual findByIdAndDelete was NOT used
    expect(findByIdAndDeleteSpy).not.toHaveBeenCalled();

    // Verify email was NOT sent when transaction failed
    expect(emailService.sendVerificationOTP).not.toHaveBeenCalled();
  });
});
