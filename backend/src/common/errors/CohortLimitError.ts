import { AppError } from './AppError';

export interface CohortLimitDetails {
  tier: string;
  limit: number;
  used: number;
  attempted: number;
  remaining: number;
  nextTier: string | null;
}

/**
 * Thrown when a college tries to add more students than its partnership tier's
 * cohort cap allows. Carries the numbers the client needs to prompt an upgrade.
 */
export class CohortLimitError extends AppError {
  public readonly details: CohortLimitDetails;

  constructor(details: CohortLimitDetails) {
    const upgradeHint = details.nextTier ? ` Upgrade to ${details.nextTier} to add more.` : '';
    super(
      `Your ${details.tier} plan allows up to ${details.limit} students (${details.used} used). ` +
        `This import would add ${details.attempted}, exceeding the limit.${upgradeHint}`,
      403,
      'COHORT_LIMIT_EXCEEDED'
    );
    this.details = details;
    Object.setPrototypeOf(this, CohortLimitError.prototype);
  }
}

export default CohortLimitError;
