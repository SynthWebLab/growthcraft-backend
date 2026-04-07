const swaggerAutogen = require('swagger-autogen')({ openapi: '3.0.0' });

const doc = {
  info: {
    title: 'GrowthCraft EdTech API',
    version: '1.0.0',
    description: 'Auto-generated API documentation for GrowthCraft EdTech SaaS Backend',
  },
  servers: [
    {
      url: 'http://localhost:3000/api/v1',
      description: 'Development server',
    },
    {
      url: 'https://api.growthcraft.com/api/v1',
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'accessToken',
        description: 'Access token stored in HTTP-only cookie',
      },
      refreshCookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'refreshToken',
        description: 'Refresh token stored in HTTP-only cookie',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          email: { type: 'string', format: 'email' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          role: { type: 'string', enum: ['user', 'admin', 'super_admin'] },
          isActive: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  tags: [
    { name: 'Auth', description: 'Authentication endpoints' },
    { name: 'Users', description: 'User management endpoints' },
  ],
};

const outputFile = './src/config/swagger-output.json';
const routes = ['./src/app.ts'];

swaggerAutogen(outputFile, routes, doc).then(({ success }) => {
  console.log(`Generated: ${success}`);
});
