const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: {
    title: 'Plus Admin API',
    description: 'API documentation for Plus Admin application',
    version: '1.0.0',
    contact: {
      name: 'API Support',
      email: 'support@example.com'
    }
  },
  host: 'localhost:80',
  basePath: '/',
  schemes: ['http', 'https'],
  consumes: ['application/json'],
  produces: ['application/json'],
  tags: [
    {
      name: 'Authentication',
      description: 'Authentication endpoints'
    },
    {
      name: 'Users',
      description: 'User management endpoints'
    },
    {
      name: 'Roles',
      description: 'Role management endpoints'
    },
    {
      name: 'Data',
      description: 'Data management endpoints'
    },
    {
      name: 'Grievances',
      description: 'Grievance management endpoints'
    },
    {
      name: 'PDF',
      description: 'PDF generation endpoints'
    },
    {
      name: 'GeoServer',
      description: 'GeoServer management endpoints'
    }
  ],
  securityDefinitions: {
    bearerAuth: {
      type: 'apiKey',
      name: 'x-access-token',
      in: 'header',
      description: 'JWT token for authentication'
    }
  },
  definitions: {
    User: {
      id: 1,
      username: 'john_doe',
      email: 'john@example.com',
      name: 'John Doe',
      phone: '254712345678',
      isactive: true,
      county_id: 1,
      roles: ['admin'],
      user_roles: [
        {
          role: 'admin',
          county_id: 1,
          subcounty_id: null,
          ward_id: null,
          settlement_id: null
        }
      ]
    },
    LoginRequest: {
      username: 'john_doe',
      password: 'password123'
    },
    SignupRequest: {
      username: 'new_user',
      email: 'newuser@example.com',
      password: 'password123',
      name: 'New User',
      phone: '254712345678'
    },
    LoginResponse: {
      id: 1,
      username: 'john_doe',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '254712345678',
      roles: ['admin'],
      user_roles: [],
      county_id: 1,
      accessToken: 'jwt_token_here',
      code: '0000',
      message: 'Login Successful'
    },
    ErrorResponse: {
      message: 'Error description',
      code: 'ERROR_CODE'
    },
    SuccessResponse: {
      message: 'Success message',
      code: '0000',
      data: {}
    }
  }
};

const outputFile = './swagger.json';
const endpointsFiles = ['./server.js'];

// Generate swagger.json
swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
  console.log('Swagger documentation generated successfully!');
  console.log('File saved to:', outputFile);
}); 