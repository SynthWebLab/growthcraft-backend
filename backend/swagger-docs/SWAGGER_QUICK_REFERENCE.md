# Swagger Quick Reference

## Access Points

- **Swagger UI**: http://localhost:5001/api-docs
- **OpenAPI JSON**: http://localhost:5001/api-docs.json

## Quick Template for New Endpoints

```typescript
/**
 * @swagger
 * /your-path:
 *   method:
 *     summary: What this endpoint does
 *     tags: [TagName]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path|query|header
 *         name: paramName
 *         required: true|false
 *         schema:
 *           type: string|number|boolean|array|object
 *         description: What this parameter is for
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - field1
 *             properties:
 *               field1:
 *                 type: string
 *                 example: "example value"
 *     responses:
 *       200:
 *         description: Success message
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SchemaName'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.method('/your-path', controller.method);
```

## Common Schema References

- `$ref: '#/components/schemas/User'` - User object
- `$ref: '#/components/schemas/Error'` - Error response
- `$ref: '#/components/schemas/Success'` - Success response

## HTTP Methods

- `get` - Retrieve data
- `post` - Create new resource
- `patch` - Update existing resource (partial)
- `put` - Replace existing resource (full)
- `delete` - Remove resource

## Parameter Locations

- `path` - URL path parameter (e.g., `/users/{id}`)
- `query` - Query string parameter (e.g., `?page=1`)
- `header` - HTTP header
- `cookie` - Cookie value

## Common Data Types

- `string` - Text
- `number` - Numeric value
- `integer` - Whole number
- `boolean` - true/false
- `array` - List of items
- `object` - Complex object

## Security Schemes

- `cookieAuth` - Access token (for most protected routes)
- `refreshCookieAuth` - Refresh token (for /auth/refresh)

## Tags (Current)

- `Auth` - Authentication endpoints
- `Users` - User management endpoints

## File Locations

- **Config**: `src/config/swagger.config.ts`
- **App Setup**: `src/app.ts`
- **Route Examples**: `src/modules/auth/routes/*.ts`

## Testing Flow

1. Start server: `npm run dev`
2. Open: http://localhost:5000/api-docs
3. Login via `/auth/login` endpoint
4. Test protected endpoints (cookies auto-sent)
5. View responses in Swagger UI
