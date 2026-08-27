export class EnvUtil {
  /**
   * Validate that required environment variables are set
   */
  public validateEnvVars(requiredVars: string[]): void {
    const missingVars: string[] = [];

    for (const varName of requiredVars) {
      const value = process.env[varName];
      if (!value || value.trim() === '') {
        missingVars.push(varName);
      }
    }

    if (missingVars.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missingVars.join(', ')}\n` +
          'Please check your .env file and ensure all required variables are set.'
      );
    }

    // Reject weak or default secrets in production
    if (this.isProduction()) {
      const insecureSecrets = [
        'default-cookie-secret',
        'your-cookie-secret',
        'your-cookie-secret-change-this-in-production',
        'your-super-secret-jwt-key-change-this-in-production',
        'your-super-secret-refresh-key-change-this-in-production',
      ];

      const secretKeys = ['COOKIE_SECRET', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
      for (const key of secretKeys) {
        const val = process.env[key];
        if (val && (insecureSecrets.includes(val) || val.length < 32)) {
          throw new Error(
            `Insecure ${key} detected in production! Secret must be at least 32 characters long and not use default placeholder values.`
          );
        }
      }
    }
  }

  /**
   * Get environment variable with default value
   */
  public getEnvVar(name: string, defaultValue?: string): string {
    const value = process.env[name];

    if (value === undefined) {
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw new Error(`Environment variable ${name} is not set`);
    }

    return value;
  }

  /**
   * Get environment variable as number
   */
  public getEnvVarAsNumber(name: string, defaultValue?: number): number {
    const value = process.env[name];

    if (value === undefined) {
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw new Error(`Environment variable ${name} is not set`);
    }

    const numValue = parseInt(value, 10);

    if (isNaN(numValue)) {
      throw new Error(`Environment variable ${name} is not a valid number: ${value}`);
    }

    return numValue;
  }

  /**
   * Get environment variable as boolean
   */
  public getEnvVarAsBoolean(name: string, defaultValue?: boolean): boolean {
    const value = process.env[name];

    if (value === undefined) {
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw new Error(`Environment variable ${name} is not set`);
    }

    return value.toLowerCase() === 'true';
  }

  /**
   * Check if we're in development mode
   */
  public isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development';
  }

  /**
   * Check if we're in production mode
   */
  public isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  /**
   * Check if we're in test mode
   */
  public isTest(): boolean {
    return process.env.NODE_ENV === 'test';
  }

  /**
   * Get all environment variables with a specific prefix
   */
  public getEnvVarsWithPrefix(prefix: string): Record<string, string> {
    const result: Record<string, string> = {};

    for (const [key, value] of Object.entries(process.env)) {
      if (key.startsWith(prefix) && value !== undefined) {
        result[key] = value;
      }
    }

    return result;
  }
}

export const envUtil = new EnvUtil();
