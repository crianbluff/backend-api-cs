import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env';

const CONTINENTS = ['africa', 'america', 'europe', 'asia', 'oceania'];

const REGIONS = [
  'north_america',
  'central_america',
  'south_america',
  'caribbean',
  'middle_east_asia',
  'southeast_asia',
  'eastern_asia',
  'south_asia',
  'central_asia',
  'west_europe',
  'scandinavia',
  'southern_europe',
  'northern_europe',
  'eastern_europe',
  'oceania',
  'africa',
];

const GENDERS = ['male', 'female', 'trans'];

// Sólo grupos reales
const GROUP_TYPES = ['solo', 'couple', 'friends', 'family'];

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: { title: 'Guests API', version: '1.0.0', description: 'REST API for couchsurfing guests.' },
    servers: [{ url: `http://localhost:${env.PORT}/api/${env.API_VERSION}`, description: 'Local dev' }],
    tags: [{ name: 'Guests', description: 'Guest management endpoints' }],
    components: {
      schemas: {
        IndividualFields: {
          type: 'object',
          required: ['hometownCode', 'continent', 'region', 'fullName', 'gender'],
          properties: {
            rating: {
              type: 'integer',
              nullable: true,
              minimum: 1,
              maximum: 5,
            },

            hometownCode: {
              type: 'string',
              example: 'CHN',
              description: 'ISO 3166-1 alpha-3 country code',
            },

            livingInCode: {
              type: 'string',
              nullable: true,
              example: 'DEU',
              description: 'ISO 3166-1 alpha-3 country code (optional)',
            },

            prefixCode: {
              type: 'string',
              nullable: true,
            },

            continent: {
              type: 'string',
              enum: CONTINENTS,
            },

            region: {
              type: 'string',
              enum: REGIONS,
            },

            fullName: {
              type: 'string',
              maxLength: 200,
            },

            hometown: {
              type: 'string',
              nullable: true,
              maxLength: 200,
            },

            livingIn: {
              type: 'string',
              nullable: true,
              maxLength: 200,
            },

            birthDate: {
              type: 'string',
              nullable: true,
              example: '1995-08-15',
              description: 'ISO 8601: YYYY, YYYY-MM or YYYY-MM-DD',
            },

            occupation: {
              type: 'array',
              items: {
                type: 'string',
              },
            },

            urlProfileCs: {
              nullable: true,
              oneOf: [{ type: 'string' }, { type: 'number' }],
            },

            gender: {
              type: 'string',
              enum: GENDERS,
            },

            whatsapp: {
              type: 'string',
              nullable: true,
            },

            instagram: {
              type: 'string',
              nullable: true,
            },

            isFirstTime: {
              type: 'boolean',
              default: false,
            },
          },
        },
        SharedVisitFields: {
          type: 'object',
          required: ['nights', 'stayed', 'hangOut', 'visitedDate'],
          properties: {
            nights: {
              type: 'integer',
              minimum: 1,
            },

            stayed: {
              type: 'boolean',
            },

            hangOut: {
              type: 'boolean',
            },

            visitedDate: {
              type: 'string',
              example: '2026-01',
              description: 'ISO 8601: YYYY, YYYY-MM or YYYY-MM-DD',
            },

            isFirstTime: {
              type: 'boolean',
              default: false,
            },

            gift: {
              type: 'array',
              nullable: true,
              items: {
                type: 'string',
              },
            },

            comments: {
              type: 'string',
              nullable: true,
              maxLength: 2000,
            },
          },
        },
        GuestDocument: {
          allOf: [
            { $ref: '#/components/schemas/SharedVisitFields' },
            { $ref: '#/components/schemas/IndividualFields' },
            {
              type: 'object',
              properties: {
                guestId: {
                  type: 'string',
                  example: 'aT84plm2UiN',
                },

                groupId: {
                  type: 'string',
                  nullable: true,
                },

                groupType: {
                  type: 'string',
                  enum: GROUP_TYPES,
                  nullable: true,
                },

                createdAt: {
                  type: 'string',
                  format: 'date-time',
                },

                updatedAt: {
                  type: 'string',
                  format: 'date-time',
                },
              },
            },
          ],
        },
        SoloListItem: {
          type: 'object',
          properties: {
            guestId: { type: 'string' },
            groupId: { nullable: true, example: null },
            groupType: { nullable: true, example: null },
            isFirstTime: { type: 'boolean' },
            nights: { type: 'number' },
            stayed: { type: 'boolean' },
            visitedDate: { type: 'string' },
            hangOut: { type: 'boolean' },
            fullName: { type: 'string' },
            hometownCode: { type: 'string' },
            livingInCode: { type: 'string', nullable: true },
            prefixCode: { type: 'string', nullable: true },
            continent: { type: 'string', enum: CONTINENTS },
            region: { type: 'string', enum: REGIONS },
            birthDate: { type: 'string', nullable: true },
            occupation: { type: 'array', items: { type: 'string' } },
            urlProfileCs: { nullable: true },
            livingIn: { type: 'string', nullable: true },
            hometown: { type: 'string', nullable: true },
            rating: { type: 'number', nullable: true },
            gender: { type: 'string', enum: GENDERS },
            whatsapp: { type: 'string', nullable: true },
          },
        },
        GroupMemberListItem: {
          type: 'object',
          properties: {
            guestId: { type: 'string' },
            isFirstTime: { type: 'boolean' },
            fullName: { type: 'string' },
            hometownCode: { type: 'string' },
            livingInCode: { type: 'string', nullable: true },
            prefixCode: { type: 'string', nullable: true },
            continent: { type: 'string', enum: CONTINENTS },
            region: { type: 'string', enum: REGIONS },
            birthDate: { type: 'string', nullable: true },
            occupation: { type: 'array', items: { type: 'string' } },
            urlProfileCs: { nullable: true },
            livingIn: { type: 'string', nullable: true },
            hometown: { type: 'string', nullable: true },
            rating: { type: 'number', nullable: true },
            gender: { type: 'string', enum: GENDERS },
            whatsapp: { type: 'string', nullable: true },
          },
        },
        GroupListItem: {
          type: 'object',
          properties: {
            groupId: { type: 'string' },
            groupType: { type: 'string', enum: GROUP_TYPES },
            nights: { type: 'number' },
            stayed: { type: 'boolean' },
            visitedDate: { type: 'string' },
            hangOut: { type: 'boolean' },
            gift: { type: 'array', items: { type: 'string' }, nullable: true },
            comments: { type: 'string', nullable: true },
            members: { type: 'array', items: { $ref: '#/components/schemas/GroupMemberListItem' } },
          },
        },
        PaginatedGuests: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: {
              type: 'array',
              items: {
                oneOf: [{ $ref: '#/components/schemas/SoloListItem' }, { $ref: '#/components/schemas/GroupListItem' }],
              },
            },
            total: { type: 'number', example: 120 },
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 10 },
            totalPages: { type: 'number', example: 12 },
            hasNextPage: { type: 'boolean' },
            hasPrevPage: { type: 'boolean' },
          },
        },
        CreateSoloGuestDto: {
          allOf: [{ $ref: '#/components/schemas/SharedVisitFields' }, { $ref: '#/components/schemas/IndividualFields' }],
        },
        CreateGroupGuestDto: {
          type: 'object',

          required: ['nights', 'stayed', 'hangOut', 'visitedDate', 'groupType', 'members'],

          properties: {
            nights: {
              type: 'integer',
              minimum: 1,
            },

            stayed: {
              type: 'boolean',
            },

            hangOut: {
              type: 'boolean',
            },

            visitedDate: {
              type: 'string',
              example: '2026-01',
              description: 'ISO 8601: YYYY, YYYY-MM or YYYY-MM-DD',
            },

            isFirstTime: {
              type: 'boolean',
              default: false,
            },

            gift: {
              type: 'array',
              nullable: true,
              items: {
                type: 'string',
              },
            },

            comments: {
              type: 'string',
              nullable: true,
            },

            groupType: {
              type: 'string',
              enum: GROUP_TYPES,
            },

            members: {
              type: 'array',
              minItems: 2,
              maxItems: 10,
              items: {
                $ref: '#/components/schemas/IndividualFields',
              },
            },
          },
        },
        ApiSuccess: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },

            message: {
              type: 'string',
              example: 'Operation completed successfully',
            },

            data: {
              type: 'object',
              nullable: true,
              additionalProperties: true,
            },
          },
        },
        ApiError: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },

            message: {
              type: 'string',
              example: 'Validation error',
            },

            errors: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: true,
              },
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
