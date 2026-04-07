# Swagger/OpenAPI Documentation Setup

## Overview
This project now includes automatic API documentation using Swagger/OpenAPI 3.0. All your API endpoints are automatically documented and accessible through an interactive UI.

## Access Documentation

### Development
- **Swagger UI**: http://localhost:5000/api-docs
- **OpenAPI JSON**: http://localhost:5000/api-docs.json

### Production
- Update the server URL in `src/config/swagger.config.ts` to match your production domain

## Features

✅ Interactive API documentation
✅ Try-it-out functionality for testing endpoints
✅ Cookie-based authentication support
✅ Automatic schema generation
✅ Request/response examples
✅ Error response documentation

## How It Works

### 1. Configuration
The Swagger configuration is in `src/config/swagger.config.ts`:
- API metadata (title, version, description)
- Server URLs (development/production)
- Security schemes (cookie authentication)
- Reusable schemas (User, Error, Success)
- Tags for grouping endpoints

### 2. JSDoc Annotations
API endpoints are documented using JSDoc comments in route files:

```typescript
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post('/login', authController.login);
```

### 3. Auto-Discovery
Swagger automatically scans these file patterns:
- `./src/routes/**/*.ts`
- `./src/modules/**/routes/*.ts`
- `./src/modules/**/controllers/*.ts`

## Adding Documentation to New Endpoints

When you create a new API endpoint, add JSDoc comments above the route:

```typescript
/**
 * @swagger
 * /your-endpoint:
 *   get:
 *     summary: Brief description
 *     tags: [YourTag]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: paramName
 *         schema:
 *           type: string
 *         description: Parameter description
 *     responses:
 *       200:
 *         description: Success response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/YourSchema'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/your-endpoint', yourController.yourMethod);
```

## Common Patterns

### Protected Endpoint (Requires Authentication)
```typescript
/**
 * @swagger
 * /protected-route:
 *   get:
 *     security:
 *       - cookieAuth: []
 */
```

### Request Body
```typescript
/**
 * @swagger
 * /create-something:
 *   post:
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - field1
 *               - field2
 *             properties:
 *               field1:
 *                 type: string
 *               field2:
 *                 type: number
 */
```

### Path Parameters
```typescript
/**
 * @swagger
 * /users/{userId}:
 *   get:
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 */
```

### Query Parameters
```typescript
/**
 * @swagger
 * /search:
 *   get:
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query
 */
```

## Adding New Schemas

To add reusable schemas, edit `src/config/swagger.config.ts`:

```typescript
components: {
  schemas: {
    YourNewSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        // ... more properties
      },
    },
  },
}
```

Then reference it in your routes:
```typescript
$ref: '#/components/schemas/YourNewSchema'
```

## Testing with Swagger UI

1. Start your server: `npm run dev`
2. Open http://localhost:5000/api-docs
3. Click on any endpoint to expand it
4. Click "Try it out"
5. Fill in parameters/body
6. Click "Execute"
7. View the response

### Testing Protected Endpoints

Since this API uses HTTP-only cookies:
1. First, call `/auth/login` or `/auth/register` via Swagger UI
2. The cookies will be automatically set in your browser
3. Now you can test protected endpoints
4. The cookies are sent automatically with each request

## Customization

### Change UI Theme
Edit `src/app.ts`:
```typescript
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Your API Docs',
  customfavIcon: '/path/to/favicon.ico',
}));
```

### Add More Tags
Edit `src/config/swagger.config.ts`:
```typescript
tags: [
  { name: 'Auth', description: 'Authentication endpoints' },
  { name: 'Users', description: 'User management' },
  { name: 'YourNewTag', description: 'Description' },
],
```

### Add Production Server
Edit `src/config/swagger.config.ts`:
```typescript
servers: [
  {
    url: `http://localhost:${config.PORT}/api/v1`,
    description: 'Development server',
  },
  {
    url: 'https://api.yourdomain.com/api/v1',
    description: 'Production server',
  },
],
```

## Best Practices

1. **Always document new endpoints** - Add Swagger comments when creating routes
2. **Use descriptive summaries** - Help users understand what each endpoint does
3. **Document all parameters** - Include type, description, and whether required
4. **Show example values** - Use `example:` field for clarity
5. **Document error responses** - Include common error codes (400, 401, 403, 404, 500)
6. **Use schemas for complex objects** - Define once, reference everywhere
7. **Group related endpoints** - Use tags to organize your API
8. **Keep it updated** - Update docs when you change endpoints

## Troubleshooting

### Documentation not showing up
- Check that your route file matches the patterns in `swagger.config.ts`
- Ensure JSDoc comments use `@swagger` tag
- Restart the server after adding new documentation

### Syntax errors in Swagger UI
- Validate your YAML syntax in JSDoc comments
- Check indentation (use spaces, not tabs)
- Ensure all referenced schemas exist

### Authentication not working
- Make sure you've logged in first via Swagger UI
- Check that cookies are enabled in your browser
- Verify the security scheme is correctly defined

## Resources

- [Swagger/OpenAPI Specification](https://swagger.io/specification/)
- [swagger-jsdoc Documentation](https://github.com/Surnet/swagger-jsdoc)
- [swagger-ui-express Documentation](https://github.com/scottie1984/swagger-ui-express)

## Next Steps

1. Document any additional endpoints you create
2. Add more detailed schemas for complex data types
3. Consider adding examples for common use cases
4. Update production server URL before deployment
