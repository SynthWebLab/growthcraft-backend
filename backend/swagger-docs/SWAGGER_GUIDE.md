# Swagger API Documentation Guide

## Overview

This project uses Swagger/OpenAPI 3.0 for automatic API documentation. We have two types of documentation available:

1. **Manual Documentation** - Detailed, hand-written docs with full descriptions
2. **Auto-Generated Documentation** - Automatically generated from your routes

## Accessing Swagger Documentation

### Development Environment

Once your server is running (`npm run dev`), access the documentation at:

- **Manual Docs**: `http://localhost:5001/api-docs`
- **Auto-Generated Docs**: `http://localhost:5001/api-docs-auto`
- **Swagger JSON**: `http://localhost:5001/api-docs.json`

### Production Environment

By default, Swagger is **disabled in production** for security reasons. To enable it, set in your `.env`:

```env
SWAGGER_ENABLED=true
```

## Configuration

### Environment Variables

Configure Swagger behavior in your `.env` file:

```env
# Enable/disable Swagger documentation
SWAGGER_ENABLED=true

# Custom paths for documentation
SWAGGER_PATH=/api-docs
SWAGGER_AUTO_PATH=/api-docs-auto
```

### Swagger Config Files

- `src/config/swagger.config.ts` - Manual documentation configuration
- `src/config/swagger-output.json` - Auto-generated documentation (generated automatically)
- `scripts/swagger-autogen.js` - Auto-generation script

## How Auto-Generation Works

### Automatic Generation

The auto-generation runs automatically when you:

```bash
npm run dev      # Generates docs then starts dev server
npm run build    # Generates docs then builds project
```

Or manually:

```bash
npm run swagger:auto
```

### What Gets Auto-Generated

The `swagger-autogen` library scans your Express routes and automatically creates documentation for:

- All HTTP methods (GET, POST, PUT, PATCH, DELETE)
- Route paths
- Request parameters
- Response structures

## Adding Documentation to New Endpoints

### Option 1: Auto-Generated (Zero Effort)

Just create your route normally:

```typescript
router.post('/courses', courseController.createCourse);
```

Run `npm run swagger:auto` and it appears in Swagger automatically!

### Option 2: Enhanced Auto-Generated (Minimal Effort)

Add simple comments to enhance the auto-generated docs:

```typescript
router.post('/courses',
  // #swagger.tags = ['Courses']
  // #swagger.summary = 'Create a new course'
  // #swagger.description = 'Creates a new course in the system'
  courseController.createCourse
);
```

### Option 3: Manual Documentation (Full Control)

Add detailed JSDoc comments for complete control:

```typescript
/**
 * @swagger
 * /courses:
 *   post:
 *     summary: Create a new course
 *     tags: [Courses]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *                 example: Introduction to TypeScript
 *               description:
 *                 type: string
 *                 example: Learn TypeScript from scratch
 *               price:
 *                 type: number
 *                 example: 49.99
 *     responses:
 *       201:
 *         description: Course created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     course:
 *                       $ref: '#/components/schemas/Course'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 */
router.post('/courses', authenticate, courseController.createCourse);
```

## Adding New Schemas

Define reusable schemas in `src/config/swagger.config.ts`:

```typescript
components: {
  schemas: {
    Course: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' },
        price: { type: 'number' },
        instructor: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
  },
}
```

Then reference it in your routes:

```typescript
$ref: '#/components/schemas/Course'
```

## Security Schemes

### Cookie-Based Authentication

Our API uses HTTP-only cookies for authentication. Swagger is configured with two security schemes:

```typescript
securitySchemes: {
  cookieAuth: {
    type: 'apiKey',
    in: 'cookie',
    name: 'accessToken',
  },
  refreshCookieAuth: {
    type: 'apiKey',
    in: 'cookie',
    name: 'refreshToken',
  },
}
```

### Using Security in Routes

Apply security to protected endpoints:

```typescript
/**
 * @swagger
 * /auth/profile:
 *   get:
 *     security:
 *       - cookieAuth: []
 */
```

## Testing APIs in Swagger UI

### 1. Login First

1. Go to `/api-docs`
2. Find the `POST /auth/login` endpoint
3. Click "Try it out"
4. Enter credentials:
   ```json
   {
     "email": "user@example.com",
     "password": "SecurePass123!"
   }
   ```
5. Click "Execute"
6. The cookies are automatically stored in your browser

### 2. Test Protected Endpoints

After logging in, you can test any protected endpoint. The cookies are sent automatically.

### 3. Logout

Use the `POST /auth/logout` endpoint to clear your session.

## Best Practices

### 1. Always Document Errors

Include common error responses:

```typescript
responses:
  400:
    description: Validation error
  401:
    description: Unauthorized
  403:
    description: Forbidden
  404:
    description: Not found
  500:
    description: Internal server error
```

### 2. Use Tags to Organize

Group related endpoints with tags:

```typescript
tags: ['Auth', 'Users', 'Courses', 'Payments']
```

### 3. Provide Examples

Always include example values:

```typescript
example: "user@example.com"
```

### 4. Document Query Parameters

```typescript
parameters:
  - in: query
    name: page
    schema:
      type: integer
      default: 1
    description: Page number
  - in: query
    name: limit
    schema:
      type: integer
      default: 10
    description: Items per page
```

### 5. Security First

- **Never** enable Swagger in production without authentication
- Set `SWAGGER_ENABLED=false` in production `.env`
- Consider adding basic auth to Swagger UI in staging environments

## Troubleshooting

### Swagger UI Not Loading

1. Check if server is running: `http://localhost:5001/health`
2. Verify `SWAGGER_ENABLED=true` in `.env`
3. Check the correct port (5001, not 5000)
4. Look for errors in server logs

### Auto-Generation Not Working

1. Run manually: `npm run swagger:auto`
2. Check `src/config/swagger-output.json` was created
3. Verify routes are properly imported in `src/app.ts`
4. Check for TypeScript compilation errors

### Routes Not Appearing

1. Ensure routes are mounted in `src/app.ts`
2. Check the `apis` array in `swagger.config.ts` includes your route files
3. Restart the server after adding new routes
4. Run `npm run swagger:auto` to regenerate

### Authentication Not Working in Swagger

1. Login first using the `/auth/login` endpoint
2. Cookies are stored automatically in the browser
3. Make sure you're testing in the same browser tab
4. Check browser console for CORS errors

## Scripts Reference

```bash
# Generate auto-documentation
npm run swagger:auto

# Start dev server (auto-generates docs first)
npm run dev

# Build for production (auto-generates docs first)
npm run build

# Generate swagger template (legacy)
npm run swagger:generate
```

## File Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── swagger.config.ts          # Manual docs configuration
│   │   ├── swagger-auto.config.ts     # Auto-generated docs config
│   │   └── swagger-output.json        # Generated OpenAPI spec
│   ├── routes/
│   │   └── v1/
│   │       └── index.ts               # Route definitions
│   └── modules/
│       └── auth/
│           └── routes/
│               ├── auth.routes.ts     # Auth endpoints with docs
│               └── user.routes.ts     # User endpoints with docs
├── scripts/
│   └── swagger-autogen.js             # Auto-generation script
└── swagger-docs/
    └── SWAGGER_GUIDE.md               # This file
```

## Additional Resources

- [Swagger/OpenAPI Specification](https://swagger.io/specification/)
- [swagger-jsdoc Documentation](https://github.com/Surnet/swagger-jsdoc)
- [swagger-autogen Documentation](https://github.com/davibaltar/swagger-autogen)
- [Swagger UI Documentation](https://swagger.io/tools/swagger-ui/)

## Support

For issues or questions about Swagger documentation:

1. Check this guide first
2. Review the example routes in `src/modules/auth/routes/`
3. Check server logs for errors
4. Verify environment configuration

---

**Last Updated**: April 2026
**Version**: 1.0.0
