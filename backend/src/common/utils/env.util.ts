export class EnvUtil {
  /**
   * Validate that required environment variables are set
   */
  public validateEnvVars(requiredVars: string[]): void {
    const missingVars: string[] = [];

    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        missingVars.push(varName);
      }
    }

    if (missingVars.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missingVars.join(', ')}\n` +
          'Please check your .env file and ensure all required variables are set.'
      );
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
