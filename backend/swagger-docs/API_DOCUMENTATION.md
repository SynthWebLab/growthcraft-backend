# API Documentation Guide

## 🚀 Quick Start

Your API now has automatic, interactive documentation powered by Swagger/OpenAPI!

### Access the Documentation

1. Start your server:

   ```bash
   npm run dev
   ```

2. Open your browser:

   ```
   http://localhost:5000/api-docs
   ```

3. Start exploring and testing your APIs!

## 📚 Documentation Files

| File                                | Purpose                             |
| ----------------------------------- | ----------------------------------- |
| `SWAGGER_SETUP.md`                  | Complete setup guide and how-to     |
| `SWAGGER_QUICK_REFERENCE.md`        | Quick reference for common patterns |
| `SWAGGER_IMPLEMENTATION_SUMMARY.md` | What was implemented and features   |
| `SWAGGER_ARCHITECTURE.md`           | System architecture and data flow   |
| `.swagger-checklist.md`             | Checklist for adding new endpoints  |
| `API_DOCUMENTATION.md`              | This file - overview and navigation |

## 🎯 What You Can Do

### 1. Browse All Endpoints

- View all available API endpoints
- See request/response schemas
- Understand authentication requirements
- Check required parameters

### 2. Test APIs Interactively

- Click "Try it out" on any endpoint
- Fill in parameters and request body
- Execute real API calls
- View actual responses

### 3. Understand Authentication

- See which endpoints require authentication
- Test login/register flows
- Cookies are handled automatically
- Test protected endpoints after login

### 4. View Schemas

- See all data models
- Understand field types and requirements
- View example values
- Check validation rules

## 📖 Documentation Structure

```
API Documentation
├── Auth Endpoints
│   ├── POST /auth/register
│   ├── POST /auth/login
│   ├── POST /auth/refresh
│   ├── GET /auth/profile (protected)
│   ├── POST /auth/logout (protected)
│   └── POST /auth/logout-all (protected)
│
└── User Endpoints
    ├── GET /users (admin only)
    ├── GET /users/{userId} (protected)
    ├── PATCH /users/{userId} (protected)
    └── DELETE /users/{userId} (admin only)
```

## 🔐 Testing Protected Endpoints

### Step-by-Step Guide

1. **Register or Login**
   - Go to `/auth/register` or `/auth/login`
   - Click "Try it out"
   - Fill in credentials
   - Click "Execute"
   - Cookies are automatically set

2. **Test Protected Endpoints**
   - Navigate to any protected endpoint (marked with 🔒)
   - Click "Try it out"
   - Fill in required parameters
   - Click "Execute"
   - Cookies are sent automatically

3. **Logout**
   - Use `/auth/logout` to end current session
   - Use `/auth/logout-all` to end all sessions

## 🛠️ For Developers

### Adding New Endpoints

1. **Create the route**

   ```typescript
   router.get('/new-endpoint', controller.method);
   ```

2. **Add Swagger documentation**

   ```typescript
   /**
    * @swagger
    * /new-endpoint:
    *   get:
    *     summary: What this does
    *     tags: [YourTag]
    *     responses:
    *       200:
    *         description: Success
    */
   router.get('/new-endpoint', controller.method);
   ```

3. **Test in Swagger UI**
   - Restart server
   - Open http://localhost:5000/api-docs
   - Find your new endpoint
   - Test it!

### Using the Template Generator

```bash
npm run swagger:generate
```

This interactive tool helps you create Swagger documentation templates quickly.

### File Locations

- **Configuration**: `src/config/swagger.config.ts`
- **App Setup**: `src/app.ts`
- **Route Examples**: `src/modules/auth/routes/*.ts`
- **Template Generator**: `scripts/generate-swagger-template.js`

## 📋 Common Tasks

### View OpenAPI JSON

```
http://localhost:5000/api-docs.json
```

### Generate Client SDK

Use the OpenAPI JSON to generate client SDKs:

```bash
# Example with openapi-generator
openapi-generator-cli generate \
  -i http://localhost:5000/api-docs.json \
  -g typescript-axios \
  -o ./client-sdk
```

### Export Documentation

1. Open http://localhost:5000/api-docs.json
2. Save the JSON file
3. Import into Postman, Insomnia, or other tools

### Share with Team

- Share the `/api-docs` URL with your team
- They can test APIs without any setup
- No need for separate API documentation

## 🎨 Customization

### Change API Title/Description

Edit `src/config/swagger.config.ts`:

```typescript
info: {
  title: 'Your API Title',
  version: '1.0.0',
  description: 'Your API description',
}
```

### Add Production Server

Edit `src/config/swagger.config.ts`:

```typescript
servers: [
  {
    url: 'https://api.yourdomain.com/api/v1',
    description: 'Production server',
  },
];
```

### Customize UI

Edit `src/app.ts`:

```typescript
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Your API Docs',
    customfavIcon: '/favicon.ico',
  })
);
```

## 🔍 Troubleshooting

### Documentation not showing

- Check that server is running
- Verify route files match scan patterns
- Ensure `@swagger` tag is present
- Restart server after changes

### Endpoint not appearing

- Check JSDoc syntax (YAML format)
- Verify file is in scanned directory
- Look for syntax errors in console
- Validate indentation (use spaces)

### Authentication not working

- Login first via Swagger UI
- Check that cookies are enabled
- Verify security scheme in documentation
- Check browser console for errors

### Can't test endpoint

- Ensure server is running
- Check CORS settings
- Verify endpoint path is correct
- Check for validation errors

## 📊 Benefits

### For Developers

- ✅ No need to maintain separate docs
- ✅ Documentation stays in sync with code
- ✅ Easy to test endpoints
- ✅ Quick onboarding for new team members

### For Frontend Developers

- ✅ Clear API contracts
- ✅ Interactive testing
- ✅ Example requests/responses
- ✅ No need to read code

### For QA/Testing

- ✅ Test APIs without code
- ✅ Understand expected behavior
- ✅ Verify error responses
- ✅ Check authentication flows

### For Product/Management

- ✅ See what APIs exist
- ✅ Understand capabilities
- ✅ Share with stakeholders
- ✅ Plan integrations

## 🎓 Learning Resources

### Official Documentation

- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger UI](https://swagger.io/tools/swagger-ui/)
- [swagger-jsdoc](https://github.com/Surnet/swagger-jsdoc)

### Tutorials

- [OpenAPI Tutorial](https://swagger.io/docs/specification/about/)
- [JSDoc to OpenAPI](https://github.com/Surnet/swagger-jsdoc/blob/master/docs/GETTING-STARTED.md)

### Tools

- [Swagger Editor](https://editor.swagger.io/) - Validate OpenAPI specs
- [Postman](https://www.postman.com/) - Import OpenAPI specs
- [OpenAPI Generator](https://openapi-generator.tech/) - Generate client SDKs

## 🚀 Next Steps

1. **Explore the Documentation**
   - Open http://localhost:5000/api-docs
   - Try out different endpoints
   - Test authentication flows

2. **Read the Guides**
   - `SWAGGER_SETUP.md` for detailed setup info
   - `SWAGGER_QUICK_REFERENCE.md` for quick patterns
   - `.swagger-checklist.md` for adding new endpoints

3. **Add Your Own Endpoints**
   - Use `npm run swagger:generate` for templates
   - Follow existing examples
   - Test in Swagger UI

4. **Share with Your Team**
   - Show them the `/api-docs` URL
   - Walk through the documentation
   - Demonstrate testing features

## 💡 Tips

- **Document as you code** - Add Swagger comments when creating routes
- **Use examples** - They help users understand the API
- **Test immediately** - Verify documentation in Swagger UI
- **Keep it updated** - Update docs when changing endpoints
- **Reuse schemas** - Define once, reference everywhere
- **Be consistent** - Follow the same patterns throughout

## 🎉 Success!

Your API documentation is now live and automatically maintained. Happy coding!

**Access it now**: http://localhost:5001/api-docs

---

For questions or issues, refer to the detailed guides or check the troubleshooting section.
