import {
  updateCollegeSchema,
  updateEmployerSchema,
  createCourseSchema,
  updateCourseSchema,
  createTrainingProgramSchema,
  updateTrainingProgramSchema,
  createEventSchema,
  updateEventSchema,
  toggleEventStatusSchema,
  updateUserStatusSchema,
  toggleAmbassadorSchema,
  updateEnquirySchema,
  updateRegistrationSchema,
  recordMentorPayoutSchema,
  confirmMentorPayoutSchema,
} from '@/modules/admin/validators/admin.validator';

describe('Admin Request Body Validation & Mass Assignment Prevention (GC-293 / GC-304)', () => {
  describe('College Admin Validation', () => {
    it('should accept valid college update payload', () => {
      const validPayload = {
        name: 'Tech Institute of Science',
        email: 'dean@techinstitute.edu',
        phone: '+91 9876543210',
        address: '123 College St',
        city: 'Bengaluru',
        state: 'Karnataka',
        website: 'https://techinstitute.edu',
        contact_person: 'Dr. Ramesh Kumar',
        partnership_type: 'Gold' as const,
        is_active: true,
      };

      const result = updateCollegeSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it('should reject invalid partnership tier', () => {
      const invalidPayload = {
        name: 'Tech College',
        partnership_type: 'Diamond', // Invalid tier
      };

      const result = updateCollegeSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });

    it('should reject unexpected fields to prevent mass assignment', () => {
      const maliciousPayload = {
        name: 'Tech College',
        isVerified: true, // Should not be directly updatable
        registeredStudents: ['64b8f0123456789abcdef012'], // Mass assignment attempt
      };

      const result = updateCollegeSchema.safeParse(maliciousPayload);
      expect(result.success).toBe(false);
    });
  });

  describe('Employer Admin Validation', () => {
    it('should accept valid employer update payload', () => {
      const validPayload = {
        company_name: 'Acme Software',
        email: 'hr@acmesoftware.com',
        industry: 'IT/Software' as const,
        company_size: '51-200' as const,
        website: 'https://acmesoftware.com',
        contact_person: 'John Doe',
        hiring_needs: 'Looking for 10 React interns',
        is_active: true,
      };

      const result = updateEmployerSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it('should reject invalid industry or company size', () => {
      const invalidPayload = {
        company_name: 'Acme Software',
        industry: 'InvalidIndustry',
        company_size: 'UnknownSize',
      };

      const result = updateEmployerSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });

    it('should reject unexpected fields to prevent mass assignment', () => {
      const maliciousPayload = {
        company_name: 'Acme Software',
        totalHires: 500, // Should not be mass-assigned
        jobsPosted: ['64b8f0123456789abcdef012'],
      };

      const result = updateEmployerSchema.safeParse(maliciousPayload);
      expect(result.success).toBe(false);
    });
  });

  describe('Course Admin Validation', () => {
    it('should accept valid course creation payload', () => {
      const validPayload = {
        title: 'Full Stack MERN Development',
        description: 'Comprehensive offline bootcamp covering React, Node, Express, and MongoDB.',
        shortDescription: 'Master Full Stack Development with hands-on practice.',
        category: 'Web Development',
        price: 4999,
        originalPrice: 7999,
        duration: 40,
        lessonsCount: 30,
        difficultyLevel: 'Beginner',
        tags: ['React', 'Node.js', 'MongoDB'],
        isPublished: true,
        isFeatured: false,
      };

      const result = createCourseSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it('should reject course creation with negative price or short title', () => {
      const invalidPayload = {
        title: 'A', // Too short
        description: 'Short', // Too short
        price: -50, // Negative price
      };

      const result = createCourseSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });

    it('should reject unexpected fields in course update (e.g. deletedAt, rating, enrollmentCount)', () => {
      const maliciousUpdate = {
        title: 'Updated Course Title',
        deletedAt: null, // Mass assignment attempt
        rating: 5.0, // Mass assignment attempt
        enrollmentCount: 9999, // Mass assignment attempt
      };

      const result = updateCourseSchema.safeParse(maliciousUpdate);
      expect(result.success).toBe(false);
    });

    it('should accept valid partial course update', () => {
      const validUpdate = {
        title: 'Updated Advanced React Course',
        price: 5999,
        isPublished: true,
      };

      const result = updateCourseSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });
  });

  describe('Training Program Admin Validation', () => {
    it('should accept valid training program creation payload', () => {
      const validPayload = {
        title: 'Cloud DevOps Engineering',
        description: 'In-depth industry training with AWS, Docker, Kubernetes, and CI/CD pipelines.',
        domain: 'DevOps & Cloud',
        durationDays: 45,
        price: 9999,
        originalPrice: 14999,
        tools: ['Docker', 'Kubernetes', 'AWS', 'Terraform'],
        level: 'Intermediate',
        isPublished: true,
        isFeatured: true,
      };

      const result = createTrainingProgramSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it('should reject training program update with mass assignment fields', () => {
      const maliciousUpdate = {
        title: 'Updated DevOps Training',
        deletedAt: null,
        enrollmentCount: 500,
        rating: 4.9,
      };

      const result = updateTrainingProgramSchema.safeParse(maliciousUpdate);
      expect(result.success).toBe(false);
    });

    it('should accept valid partial training program update', () => {
      const validUpdate = {
        price: 8999,
        isFeatured: false,
      };

      const result = updateTrainingProgramSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });
  });

  describe('Event Admin Validation', () => {
    it('should accept valid event creation payload', () => {
      const validPayload = {
        title: 'AI & Data Science Campus Hackathon',
        domain: 'Artificial Intelligence',
        type: 'Hackathon' as const,
        description: '48-hour offline campus hackathon solving real-world challenges.',
        durationDays: 2,
        price: 0,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000 * 2).toISOString(),
        maxSeats: 100,
        mode: 'Offline' as const,
        isPublished: true,
      };

      const result = createEventSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it('should reject mass assignment fields in event update', () => {
      const maliciousUpdate = {
        title: 'Updated Hackathon',
        deletedAt: null,
        enrolledCount: 150,
      };

      const result = updateEventSchema.safeParse(maliciousUpdate);
      expect(result.success).toBe(false);
    });

    it('should validate toggleEventStatus payload', () => {
      expect(toggleEventStatusSchema.safeParse({ status: 'Open' }).success).toBe(true);
      expect(toggleEventStatusSchema.safeParse({ status: 'Closed' }).success).toBe(true);
      expect(toggleEventStatusSchema.safeParse({ status: 'InvalidStatus' }).success).toBe(false);
      expect(toggleEventStatusSchema.safeParse({}).success).toBe(true); // Status optional to toggle
    });
  });

  describe('Other Admin Endpoints Validation', () => {
    it('should validate updateUserStatus', () => {
      expect(updateUserStatusSchema.safeParse({ isActive: true }).success).toBe(true);
      expect(updateUserStatusSchema.safeParse({ isActive: false }).success).toBe(true);
      expect(updateUserStatusSchema.safeParse({ isActive: 'invalid' }).success).toBe(false);
      expect(updateUserStatusSchema.safeParse({}).success).toBe(false);
    });

    it('should validate toggleAmbassador', () => {
      expect(toggleAmbassadorSchema.safeParse({ isAmbassador: true }).success).toBe(true);
      expect(toggleAmbassadorSchema.safeParse({ isAmbassador: false }).success).toBe(true);
      expect(toggleAmbassadorSchema.safeParse({ isAmbassador: 'yes' }).success).toBe(false);
      expect(toggleAmbassadorSchema.safeParse({}).success).toBe(false);
    });

    it('should validate updateEnquiry', () => {
      expect(
        updateEnquirySchema.safeParse({
          enquiry_type: 'callback',
          status: 'contacted',
          notes: 'Spoke with student regarding course fees',
        }).success
      ).toBe(true);

      expect(
        updateEnquirySchema.safeParse({
          enquiry_type: '',
          status: 'contacted',
        }).success
      ).toBe(false);
    });

    it('should validate updateRegistration', () => {
      expect(
        updateRegistrationSchema.safeParse({
          item_type: 'bootcamp',
          status: 'confirmed',
          payment_status: 'paid',
          notes: 'Offline cash collection verified',
        }).success
      ).toBe(true);

      expect(
        updateRegistrationSchema.safeParse({
          item_type: 'bootcamp',
          status: 'confirmed',
        }).success
      ).toBe(false);
    });

    it('should validate recordMentorPayout and confirmMentorPayout', () => {
      expect(
        recordMentorPayoutSchema.safeParse({
          amount: 15000,
          period: 'June 2026',
          notes: 'Regular batch teaching sessions',
        }).success
      ).toBe(true);

      expect(
        recordMentorPayoutSchema.safeParse({
          amount: -500,
          period: 'June 2026',
        }).success
      ).toBe(false);

      expect(
        confirmMentorPayoutSchema.safeParse({
          razorpayPaymentId: 'pay_123456789',
        }).success
      ).toBe(true);
    });
  });
});
