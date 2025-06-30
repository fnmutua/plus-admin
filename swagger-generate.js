const swaggerJsdoc = require('swagger-jsdoc');
const fs = require('fs');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Plus Admin API',
      description: 'API documentation for Plus Admin application',
      version: '1.0.0',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:80',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'apiKey',
          name: 'x-access-token',
          in: 'header',
          description: 'JWT token for authentication'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            username: { type: 'string', example: 'john_doe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            name: { type: 'string', example: 'John Doe' },
            phone: { type: 'string', example: '254712345678' },
            isactive: { type: 'boolean', example: true },
            county_id: { type: 'integer', example: 1 },
            roles: { type: 'array', items: { type: 'string' }, example: ['admin'] },
            user_roles: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  role: { type: 'string', example: 'admin' },
                  county_id: { type: 'integer', example: 1 },
                  subcounty_id: { type: 'integer', nullable: true },
                  ward_id: { type: 'integer', nullable: true },
                  settlement_id: { type: 'integer', nullable: true }
                }
              }
            }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: { type: 'string', example: 'john_doe' },
            password: { type: 'string', example: 'password123' }
          }
        },
        SignupRequest: {
          type: 'object',
          required: ['username', 'email', 'password', 'name', 'phone'],
          properties: {
            username: { type: 'string', example: 'new_user' },
            email: { type: 'string', format: 'email', example: 'newuser@example.com' },
            password: { type: 'string', example: 'password123' },
            name: { type: 'string', example: 'New User' },
            phone: { type: 'string', example: '254712345678' }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            username: { type: 'string', example: 'john_doe' },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', example: 'john@example.com' },
            phone: { type: 'string', example: '254712345678' },
            roles: { type: 'array', items: { type: 'string' }, example: ['admin'] },
            user_roles: { type: 'array', items: { type: 'object' } },
            county_id: { type: 'integer', example: 1 },
            accessToken: { type: 'string', example: 'jwt_token_here' },
            code: { type: 'string', example: '0000' },
            message: { type: 'string', example: 'Login Successful' }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Error description' },
            code: { type: 'string', example: 'ERROR_CODE' }
          }
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Success message' },
            code: { type: 'string', example: '0000' },
            data: { type: 'object' }
          }
        },
        County: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Nairobi County' },
            code: { type: 'string', example: 'NBI' },
            geom: { type: 'string', example: 'POLYGON((...))' }
          }
        },
        Subcounty: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Westlands Subcounty' },
            code: { type: 'string', example: 'WEST' },
            county_id: { type: 'integer', example: 1 },
            geom: { type: 'string', example: 'POLYGON((...))' }
          }
        },
        Ward: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Westlands Ward' },
            code: { type: 'string', example: 'WEST01' },
            subcounty_id: { type: 'integer', example: 1 },
            county_id: { type: 'integer', example: 1 },
            geom: { type: 'string', example: 'POLYGON((...))' }
          }
        },
        Settlement: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Westlands Settlement' },
            code: { type: 'string', example: 'WEST001' },
            ward_id: { type: 'integer', example: 1 },
            subcounty_id: { type: 'integer', example: 1 },
            county_id: { type: 'integer', example: 1 },
            geom: { type: 'string', example: 'POLYGON((...))' }
          }
        }
      }
    },
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
    ]
  },
  apis: [
    './server/app/routes/auth.routes.js',
    './server/app/routes/user.routes.js',
    './server/app/routes/role.routes.js',
    './server/app/routes/all.routes.js',
    './server/app/routes/grievance.routes.js',
    './server/app/routes/pdf.routes.js',
    './server/app/routes/geoserver.routes.js'
  ]
};

const specs = swaggerJsdoc(options);

// Write to file
fs.writeFileSync('./swagger.json', JSON.stringify(specs, null, 2));

console.log('Swagger documentation generated successfully!');
console.log('File saved to: ./swagger.json');
console.log(`Generated ${Object.keys(specs.paths || {}).length} endpoints`); 