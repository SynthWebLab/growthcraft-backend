// Example test file
// This ensures Jest runs successfully even without real tests yet

describe('Example Test Suite', () => {
  it('should pass a basic test', () => {
    expect(true).toBe(true);
  });

  it('should perform basic arithmetic', () => {
    expect(2 + 2).toBe(4);
  });

  it('should handle strings', () => {
    const message = 'GrowthCraft Backend';
    expect(message).toContain('Backend');
  });
});

describe('Environment Setup', () => {
  it('should be in test environment', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });

  it('should have test JWT secrets', () => {
    expect(process.env.JWT_SECRET).toBeDefined();
    expect(process.env.JWT_REFRESH_SECRET).toBeDefined();
  });
});
