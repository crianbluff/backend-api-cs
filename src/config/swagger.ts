import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Guests API',
      version: '1.0.0',
      description: 'REST API to manage couchsurfing guests — solo travellers and couples.',
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}/api/${env.API_VERSION}`,
        description: 'Local development server',
      },
    ],
    tags: [{ name: 'Guests', description: 'Guest management endpoints' }],
    components: {
      schemas: {
        IndividualInfo: {
          type: 'object',
          required: ['countryCode', 'continent', 'fullName', 'gender'],
          properties: {
            rating: { type: 'number', nullable: true, minimum: 1, maximum: 5 },
            countryCode: { type: 'string', example: 'mar' },
            prefixCode: { type: 'string', nullable: true, example: '+212' },
            continent: {
              type: 'string',
              enum: ['Africa', 'South America', 'North America', 'Central America', 'Europe', 'Asia', 'Oceania'],
            },
            fullName: { type: 'string', example: 'Simo Amri' },
            birthplace: { type: 'string', nullable: true },
            livingIn: { type: 'string', nullable: true },
            birthyear: { type: 'number', nullable: true },
            occupation: { type: 'array', items: { type: 'string' } },
            urlProfileCs: { nullable: true },
            gender: { type: 'string', enum: ['male', 'female', 'trans'] },
            whatsapp: { type: 'string', nullable: true },
            instagram: { type: 'string', nullable: true },
          },
        },
        GuestBase: {
          type: 'object',
          properties: {
            guestId: { type: 'string', example: 'aT84plm2UiN' },
            nights: { type: 'number', example: 2 },
            stayed: { type: 'boolean' },
            didWeHangOut: { type: 'boolean' },
            visitedMonth: {
              type: 'string',
              enum: [
                'January',
                'February',
                'March',
                'April',
                'May',
                'June',
                'July',
                'August',
                'September',
                'October',
                'November',
                'December',
              ],
            },
            visitedYear: { type: 'number', example: 2025 },
            gift: { type: 'array', items: { type: 'string' }, nullable: true },
            comments: { type: 'string', nullable: true },
            wasACouple: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        SoloGuest: {
          allOf: [
            { $ref: '#/components/schemas/GuestBase' },
            { $ref: '#/components/schemas/IndividualInfo' },
            { type: 'object', properties: { wasACouple: { type: 'boolean', enum: [false] }, coupleId: { nullable: true } } },
          ],
        },
        CoupleGuest: {
          allOf: [
            { $ref: '#/components/schemas/GuestBase' },
            {
              type: 'object',
              properties: {
                wasACouple: { type: 'boolean', enum: [true] },
                coupleId: { type: 'string', example: 'zzl09j7A791adlOIS' },
                coupleInfo: {
                  type: 'array',
                  minItems: 2,
                  maxItems: 2,
                  items: { $ref: '#/components/schemas/IndividualInfo' },
                },
              },
            },
          ],
        },
        Guest: {
          oneOf: [{ $ref: '#/components/schemas/SoloGuest' }, { $ref: '#/components/schemas/CoupleGuest' }],
          discriminator: { propertyName: 'wasACouple' },
        },
        CreateSoloGuestDto: {
          type: 'object',
          required: [
            'nights',
            'stayed',
            'countryCode',
            'continent',
            'fullName',
            'gender',
            'didWeHangOut',
            'visitedMonth',
            'visitedYear',
          ],
          properties: {
            nights: { type: 'number', minimum: 1 },
            stayed: { type: 'boolean' },
            rating: { type: 'number', nullable: true, minimum: 1, maximum: 5 },
            countryCode: { type: 'string' },
            prefixCode: { type: 'string', nullable: true },
            continent: {
              type: 'string',
              enum: ['Africa', 'South America', 'North America', 'Central America', 'Europe', 'Asia', 'Oceania'],
            },
            fullName: { type: 'string' },
            birthplace: { type: 'string', nullable: true },
            livingIn: { type: 'string', nullable: true },
            birthyear: { type: 'number', nullable: true },
            occupation: { type: 'array', items: { type: 'string' } },
            urlProfileCs: { nullable: true },
            gender: { type: 'string', enum: ['male', 'female', 'trans'] },
            whatsapp: { type: 'string', nullable: true },
            instagram: { type: 'string', nullable: true },
            gift: { type: 'array', items: { type: 'string' }, nullable: true },
            comments: { type: 'string', nullable: true },
            didWeHangOut: { type: 'boolean' },
            visitedMonth: {
              type: 'string',
              enum: [
                'January',
                'February',
                'March',
                'April',
                'May',
                'June',
                'July',
                'August',
                'September',
                'October',
                'November',
                'December',
              ],
            },
            visitedYear: { type: 'number', minimum: 2007 },
            wasACouple: { type: 'boolean', enum: [false] },
          },
        },
        CreateCoupleGuestDto: {
          type: 'object',
          required: ['nights', 'stayed', 'didWeHangOut', 'visitedMonth', 'visitedYear', 'wasACouple', 'coupleInfo'],
          properties: {
            nights: { type: 'number', minimum: 1 },
            stayed: { type: 'boolean' },
            didWeHangOut: { type: 'boolean' },
            visitedMonth: {
              type: 'string',
              enum: [
                'January',
                'February',
                'March',
                'April',
                'May',
                'June',
                'July',
                'August',
                'September',
                'October',
                'November',
                'December',
              ],
            },
            visitedYear: { type: 'number', minimum: 2007 },
            wasACouple: { type: 'boolean', enum: [true] },
            gift: { type: 'array', items: { type: 'string' }, nullable: true },
            comments: { type: 'string', nullable: true },
            coupleInfo: { type: 'array', minItems: 2, maxItems: 2, items: { $ref: '#/components/schemas/IndividualInfo' } },
          },
        },
        // Flattened paginated response — no nested data.data
        PaginatedGuests: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Guests retrieved successfully' },
            data: { type: 'array', items: { $ref: '#/components/schemas/Guest' } },
            total: { type: 'number', example: 42 },
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 10 },
            totalPages: { type: 'number', example: 5 },
            hasNextPage: { type: 'boolean', example: true },
            hasPrevPage: { type: 'boolean', example: false },
          },
        },
        ApiSuccess: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: {},
          },
        },
        ApiError: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            errors: { type: 'array', items: { type: 'object' } },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
