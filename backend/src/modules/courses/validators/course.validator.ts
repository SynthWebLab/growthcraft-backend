import { query, ValidationChain } from 'express-validator';

export class CourseValidator {
  /**
   * Validate query parameters for getting courses
   * Note: Category and difficulty validation is now lenient since values are dynamic
   */
  public static getCourses(): ValidationChain[] {
    return [
      // Offset-based pagination
      query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer')
        .toInt(),
      
      query('limit')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('Limit must be between 1 and 50')
        .toInt(),

      // Cursor-based pagination
      query('cursor')
        .optional()
        .isString()
        .trim()
        .notEmpty()
        .withMessage('Cursor must be a non-empty string'),

      query('useCursor')
        .optional()
        .isBoolean()
        .withMessage('useCursor must be a boolean')
        .toBoolean(),

      // Filtering - values are now dynamic from database
      query('category')
        .optional()
        .isString()
        .trim()
        .notEmpty()
        .withMessage('Category must be a non-empty string'),

      query('difficultyLevel')
        .optional()
        .isString()
        .trim()
        .notEmpty()
        .withMessage('Difficulty level must be a non-empty string'),

      query('minPrice')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Minimum price must be a non-negative number')
        .toFloat(),

      query('maxPrice')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Maximum price must be a non-negative number')
        .toFloat(),

      query('minRating')
        .optional()
        .isFloat({ min: 0, max: 5 })
        .withMessage('Minimum rating must be between 0 and 5')
        .toFloat(),

      query('tags')
        .optional()
        .isString()
        .withMessage('Tags must be a string (comma-separated)'),

      // Search
      query('search')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Search query must be between 1 and 100 characters'),

      // Sorting
      query('sortBy')
        .optional()
        .isIn(['title', 'price', 'rating', 'enrollmentCount', 'createdAt', 'duration'])
        .withMessage('Invalid sort field'),

      query('sortOrder')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('Sort order must be either asc or desc'),
    ];
  }
}
