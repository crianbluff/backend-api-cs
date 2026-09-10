import swaggerJsdoc from 'swagger-jsdoc';

import { env } from './env';
import { CONTINENTS, GENDERS, GROUP_TYPES, REGIONS } from '../types/global.types';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',

    info: {
      title: 'Guests API',
      version: '1.0.0',
      description: 'REST API for couchsurfing guests.',
    },

    servers: [
      {
        url: `http://localhost:${env.PORT}/api/${env.API_VERSION}`,
        description: 'Local dev',
      },
    ],

    tags: [
      {
        name: 'Guests',
        description: 'Guest management endpoints',
      },
      {
        name: 'Groups',
        description: 'Guest group management endpoints',
      },
      {
        name: 'Hosted',
        description: 'Hosted guest management endpoints',
      },
    ],

    components: {
      schemas: {
        /**
         * Campos individuales de un guest.
         *
         * Usados en guests solo y members de grupos.
         */
        IndividualFields: {
          type: 'object',

          required: ['hometownCode', 'countryCodeWeMet', 'continent', 'region', 'fullName', 'gender'],

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

            countryCodeWeMet: {
              type: 'string',
              example: 'CHN',
              description: 'ISO 3166-1 alpha-3 country code',
            },

            livingInCode: {
              type: 'string',
              nullable: true,
              example: 'DEU',
              description: 'ISO 3166-1 alpha-3 country code',
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

            cityWeMet: {
              type: 'string',
              nullable: true,
              maxLength: 200,
            },

            locationWeMet: {
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
              oneOf: [
                {
                  type: 'string',
                },
                {
                  type: 'number',
                },
              ],
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

            ambassador: {
              type: 'boolean',
              default: false,
            },

            didTheyReq: {
              type: 'boolean',
              default: false,
            },

            isGay: {
              type: 'boolean',
              default: false,
            },

            theirReference: {
              type: 'string',
              nullable: true,
              maxLength: 500,
            },

            myReference: {
              type: 'string',
              nullable: true,
              maxLength: 500,
            },

            hangOut: {
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

        /**
         * Campos compartidos por la visita de un guest.
         */
        SharedVisitFields: {
          type: 'object',

          required: ['visitedDate'],

          properties: {
            visitedDate: {
              type: 'string',
              example: '2026-01',
              description: 'ISO 8601: YYYY, YYYY-MM or YYYY-MM-DD',
            },
          },
        },

        /**
         * Companion de un Hosted.
         *
         * Estos campos son propios del companion y NO incluyen
         * información específica de la visita como nights, rating,
         * visitedDate, countryCodeWeMet, etc.
         */
        CompanionshipMember: {
          type: 'object',

          required: [
            'hometownCode',
            'prefixCode',
            'continent',
            'region',
            'fullName',
            'gender',
            'whatsapp',
            'ambassador',
            'isFirstTime',
          ],

          properties: {
            hometownCode: {
              type: 'string',
              example: 'AUT',
              description: 'ISO 3166-1 alpha-3 country code',
            },

            prefixCode: {
              type: 'string',
              example: '+43',
            },

            continent: {
              type: 'string',
              enum: CONTINENTS,
              example: 'europe',
            },

            region: {
              type: 'string',
              enum: REGIONS,
              example: 'central_europe',
            },

            fullName: {
              type: 'string',
              maxLength: 200,
              example: 'Jon-Matteo Brüggenwerth',
            },

            hometown: {
              type: 'string',
              nullable: true,
              maxLength: 200,
              example: 'Gallneukirchen, Upper Austria',
            },

            livingIn: {
              type: 'string',
              nullable: true,
              maxLength: 200,
              example: 'Gallneukirchen, Upper Austria',
            },

            livingInCode: {
              type: 'string',
              nullable: true,
              example: 'AUT',
              description: 'ISO 3166-1 alpha-3 country code',
            },

            birthDate: {
              type: 'string',
              nullable: true,
              example: '2000-05',
              description: 'ISO 8601: YYYY, YYYY-MM or YYYY-MM-DD',
            },

            urlProfileCs: {
              type: 'string',
              nullable: true,
              example: 'jonmatt90719330',
            },

            gender: {
              type: 'string',
              enum: GENDERS,
              example: 'male',
            },

            whatsapp: {
              type: 'string',
              maxLength: 20,
              example: '67761775275',
            },

            instagram: {
              type: 'string',
              nullable: true,
              maxLength: 100,
              example: 'jon.matteo_brg',
            },

            ambassador: {
              type: 'boolean',
              default: false,
            },

            isFirstTime: {
              type: 'boolean',
              default: false,
            },
          },
        },

        /**
         * Documento completo de un Guest.
         */
        GuestDocument: {
          allOf: [
            {
              $ref: '#/components/schemas/SharedVisitFields',
            },
            {
              $ref: '#/components/schemas/IndividualFields',
            },
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

        /**
         * Documento completo de Hosted.
         * groupTypeCompanionship indica con quién viajó.
         */
        HostedDocument: {
          type: 'object',

          properties: {
            guestId: {
              type: 'string',
              example: 'aT84plm2UiN',
            },

            nights: {
              type: 'integer',
              minimum: 1,
            },

            hangOut: {
              type: 'boolean',
              default: false,
            },

            visitedDate: {
              type: 'string',
              example: '2026-11-20',
              description: 'ISO 8601: YYYY, YYYY-MM or YYYY-MM-DD',
            },

            isFirstTime: {
              type: 'boolean',
              default: false,
            },

            ambassador: {
              type: 'boolean',
              default: false,
            },

            didTheyReq: {
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

            theirReference: {
              type: 'string',
              nullable: true,
              maxLength: 500,
            },

            myReference: {
              type: 'string',
              nullable: true,
              maxLength: 500,
            },

            rating: {
              type: 'integer',
              nullable: true,
              minimum: 1,
              maximum: 5,
            },

            hometownCode: {
              type: 'string',
              example: 'COL',
            },

            countryCodeWeMet: {
              type: 'string',
              example: 'PAN',
            },

            cityWeMet: {
              type: 'string',
              nullable: true,
              example: 'Panamá City',
            },

            locationWeMet: {
              type: 'string',
              nullable: true,
              example: 'Albrook Mall',
            },

            prefixCode: {
              type: 'string',
              nullable: true,
              example: '+57',
            },

            continent: {
              type: 'string',
              enum: CONTINENTS,
              example: 'america',
            },

            region: {
              type: 'string',
              enum: REGIONS,
              example: 'south_america',
            },

            fullName: {
              type: 'string',
              maxLength: 200,
              example: 'Carlos Ramirez',
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

            livingInCode: {
              type: 'string',
              nullable: true,
              example: 'COL',
            },

            birthDate: {
              type: 'string',
              nullable: true,
              example: '1999-07-03',
            },

            occupation: {
              type: 'array',
              items: {
                type: 'string',
              },
            },

            urlProfileCs: {
              nullable: true,
              oneOf: [
                {
                  type: 'string',
                },
                {
                  type: 'number',
                },
              ],
            },

            gender: {
              type: 'string',
              enum: GENDERS,
            },

            isGay: {
              type: 'boolean',
              default: false,
            },

            whatsapp: {
              type: 'string',
              nullable: true,
            },

            instagram: {
              type: 'string',
              nullable: true,
            },

            groupTypeCompanionship: {
              type: 'string',
              enum: GROUP_TYPES,
              example: 'friends',
              description: 'How the user traveled/stayed: solo, couple, friends or family.',
            },

            companionshipMembers: {
              type: 'array',
              minItems: 0,
              maxItems: 4,
              items: {
                $ref: '#/components/schemas/CompanionshipMember',
              },
              description:
                'Empty when groupTypeCompanionship is solo. Requires at least one member for couple, friends or family.',
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

        /**
         * Elemento de lista para guests solo.
         */
        SoloListItem: {
          type: 'object',

          properties: {
            guestId: {
              type: 'string',
            },

            groupId: {
              nullable: true,
              example: null,
            },

            groupType: {
              nullable: true,
              example: null,
            },

            isFirstTime: {
              type: 'boolean',
            },

            ambassador: {
              type: 'boolean',
            },

            didTheyReq: {
              type: 'boolean',
            },

            isGay: {
              type: 'boolean',
            },

            theirReference: {
              type: 'string',
              nullable: true,
            },

            myReference: {
              type: 'string',
              nullable: true,
            },

            nights: {
              type: 'number',
            },

            stayed: {
              type: 'boolean',
            },

            visitedDate: {
              type: 'string',
            },

            hangOut: {
              type: 'boolean',
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

            fullName: {
              type: 'string',
            },

            hometownCode: {
              type: 'string',
            },

            countryCodeWeMet: {
              type: 'string',
            },

            livingInCode: {
              type: 'string',
              nullable: true,
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

            birthDate: {
              type: 'string',
              nullable: true,
            },

            occupation: {
              type: 'array',
              items: {
                type: 'string',
              },
            },

            urlProfileCs: {
              nullable: true,
            },

            livingIn: {
              type: 'string',
              nullable: true,
            },

            cityWeMet: {
              type: 'string',
              nullable: true,
            },

            locationWeMet: {
              type: 'string',
              nullable: true,
            },

            hometown: {
              type: 'string',
              nullable: true,
            },

            rating: {
              type: 'number',
              nullable: true,
            },

            gender: {
              type: 'string',
              enum: GENDERS,
            },

            whatsapp: {
              type: 'string',
              nullable: true,
            },
          },
        },

        GroupMemberListItem: {
          type: 'object',

          properties: {
            guestId: {
              type: 'string',
            },

            isFirstTime: {
              type: 'boolean',
            },

            ambassador: {
              type: 'boolean',
            },

            didTheyReq: {
              type: 'boolean',
            },

            isGay: {
              type: 'boolean',
            },

            theirReference: {
              type: 'string',
              nullable: true,
              maxLength: 500,
            },

            myReference: {
              type: 'string',
              nullable: true,
              maxLength: 500,
            },

            hangOut: {
              type: 'boolean',
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

            fullName: {
              type: 'string',
            },

            hometownCode: {
              type: 'string',
            },

            countryCodeWeMet: {
              type: 'string',
            },

            livingInCode: {
              type: 'string',
              nullable: true,
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

            birthDate: {
              type: 'string',
              nullable: true,
            },

            occupation: {
              type: 'array',
              items: {
                type: 'string',
              },
            },

            urlProfileCs: {
              nullable: true,
            },

            livingIn: {
              type: 'string',
              nullable: true,
            },

            cityWeMet: {
              type: 'string',
              nullable: true,
            },

            locationWeMet: {
              type: 'string',
              nullable: true,
            },

            hometown: {
              type: 'string',
              nullable: true,
            },

            rating: {
              type: 'number',
              nullable: true,
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
          },
        },

        GroupListItem: {
          type: 'object',

          properties: {
            groupId: {
              type: 'string',
            },

            groupType: {
              type: 'string',
              enum: GROUP_TYPES,
            },

            nights: {
              type: 'number',
            },

            stayed: {
              type: 'boolean',
            },

            visitedDate: {
              type: 'string',
            },

            members: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/GroupMemberListItem',
              },
            },
          },
        },

        PaginatedGuests: {
          type: 'object',

          properties: {
            success: {
              type: 'boolean',
              example: true,
            },

            message: {
              type: 'string',
            },

            data: {
              type: 'array',

              items: {
                oneOf: [
                  {
                    $ref: '#/components/schemas/SoloListItem',
                  },
                  {
                    $ref: '#/components/schemas/GroupListItem',
                  },
                ],
              },
            },

            total: {
              type: 'number',
              example: 120,
            },

            page: {
              type: 'number',
              example: 1,
            },

            limit: {
              type: 'number',
              example: 10,
            },

            totalPages: {
              type: 'number',
              example: 12,
            },

            hasNextPage: {
              type: 'boolean',
            },

            hasPrevPage: {
              type: 'boolean',
            },
          },
        },

        /**
         * Respuesta paginada para Hosted.
         */
        PaginatedHosted: {
          type: 'object',

          properties: {
            success: {
              type: 'boolean',
              example: true,
            },

            message: {
              type: 'string',
              example: 'Hosted records retrieved successfully',
            },

            data: {
              type: 'array',

              items: {
                $ref: '#/components/schemas/HostedDocument',
              },
            },

            total: {
              type: 'number',
              example: 120,
            },

            page: {
              type: 'number',
              example: 1,
            },

            limit: {
              type: 'number',
              example: 10,
            },

            totalPages: {
              type: 'number',
              example: 12,
            },

            hasNextPage: {
              type: 'boolean',
              example: true,
            },

            hasPrevPage: {
              type: 'boolean',
              example: false,
            },
          },
        },

        /**
         * Crear un guest solo.
         */
        CreateSoloGuestDto: {
          allOf: [
            {
              $ref: '#/components/schemas/SharedVisitFields',
            },
            {
              $ref: '#/components/schemas/IndividualFields',
            },
          ],
        },

        /**
         * Crear un Hosted.
         *
         */
        CreateHostedDto: {
          type: 'object',

          required: [
            'nights',
            'hometownCode',
            'countryCodeWeMet',
            'continent',
            'region',
            'fullName',
            'gender',
            'visitedDate',
            'groupTypeCompanionship',
          ],

          properties: {
            theirReference: {
              type: 'string',
              nullable: true,
              maxLength: 500,
            },

            myReference: {
              type: 'string',
              nullable: true,
              maxLength: 500,
            },

            didTheyReq: {
              type: 'boolean',
              default: false,
            },

            nights: {
              type: 'integer',
              minimum: 1,
              example: 2,
            },

            rating: {
              type: 'integer',
              nullable: true,
              minimum: 1,
              maximum: 5,
              example: 4,
            },

            hometownCode: {
              type: 'string',
              example: 'COL',
            },

            countryCodeWeMet: {
              type: 'string',
              example: 'PAN',
            },

            cityWeMet: {
              type: 'string',
              nullable: true,
              example: 'Panamá City',
            },

            locationWeMet: {
              type: 'string',
              nullable: true,
              example: 'Albrook Mall',
            },

            prefixCode: {
              type: 'string',
              nullable: true,
              example: '+57',
            },

            continent: {
              type: 'string',
              enum: CONTINENTS,
              example: 'america',
            },

            region: {
              type: 'string',
              enum: REGIONS,
              example: 'south_america',
            },

            fullName: {
              type: 'string',
              maxLength: 200,
              example: 'Carlos Ramirez',
            },

            hometown: {
              type: 'string',
              nullable: true,
              example: 'Tunja, Boyacá',
            },

            livingIn: {
              type: 'string',
              nullable: true,
              example: 'Tunja, Boyacá',
            },

            livingInCode: {
              type: 'string',
              nullable: true,
              example: 'COL',
            },

            birthDate: {
              type: 'string',
              nullable: true,
              example: '1999-07-03',
            },

            hangOut: {
              type: 'boolean',
              default: false,
            },

            urlProfileCs: {
              nullable: true,

              oneOf: [
                {
                  type: 'string',
                },
                {
                  type: 'number',
                },
              ],
            },

            occupation: {
              type: 'array',

              items: {
                type: 'string',
              },
            },

            gender: {
              type: 'string',
              enum: GENDERS,
              example: 'male',
            },

            whatsapp: {
              type: 'string',
              nullable: true,
            },

            instagram: {
              type: 'string',
              nullable: true,
            },

            gift: {
              type: 'array',
              nullable: true,

              items: {
                type: 'string',
              },
            },

            isFirstTime: {
              type: 'boolean',
              default: false,
            },

            comments: {
              type: 'string',
              nullable: true,
              maxLength: 2000,
            },

            ambassador: {
              type: 'boolean',
              default: false,
            },

            isGay: {
              type: 'boolean',
              default: false,
            },

            visitedDate: {
              type: 'string',
              example: '2026-11-20',
              description: 'ISO 8601: YYYY, YYYY-MM or YYYY-MM-DD',
            },

            groupTypeCompanionship: {
              type: 'string',
              enum: GROUP_TYPES,
              example: 'friends',
              description: 'How the user traveled/stayed: solo, couple, friends or family.',
            },

            companionshipMembers: {
              type: 'array',
              minItems: 0,
              maxItems: 4,

              items: {
                $ref: '#/components/schemas/CompanionshipMember',
              },

              description:
                'Empty when groupTypeCompanionship is solo. Requires at least one member for couple, friends or family.',
            },
          },
        },

        /**
         * Actualizar un Hosted.
         *
         * Todos los campos son opcionales.
         */
        UpdateHostedDto: {
          type: 'object',

          properties: {
            theirReference: {
              type: 'string',
              nullable: true,
              maxLength: 500,
            },

            myReference: {
              type: 'string',
              nullable: true,
              maxLength: 500,
            },

            didTheyReq: {
              type: 'boolean',
            },

            nights: {
              type: 'integer',
              minimum: 1,
            },

            rating: {
              type: 'integer',
              nullable: true,
              minimum: 1,
              maximum: 5,
            },

            hometownCode: {
              type: 'string',
            },

            countryCodeWeMet: {
              type: 'string',
            },

            cityWeMet: {
              type: 'string',
              nullable: true,
            },

            locationWeMet: {
              type: 'string',
              nullable: true,
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
            },

            livingIn: {
              type: 'string',
              nullable: true,
            },

            livingInCode: {
              type: 'string',
              nullable: true,
            },

            birthDate: {
              type: 'string',
              nullable: true,
            },

            hangOut: {
              type: 'boolean',
            },

            urlProfileCs: {
              nullable: true,

              oneOf: [
                {
                  type: 'string',
                },
                {
                  type: 'number',
                },
              ],
            },

            occupation: {
              type: 'array',

              items: {
                type: 'string',
              },
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

            gift: {
              type: 'array',
              nullable: true,

              items: {
                type: 'string',
              },
            },

            isFirstTime: {
              type: 'boolean',
            },

            comments: {
              type: 'string',
              nullable: true,
              maxLength: 2000,
            },

            ambassador: {
              type: 'boolean',
            },

            isGay: {
              type: 'boolean',
            },

            visitedDate: {
              type: 'string',
              description: 'ISO 8601: YYYY, YYYY-MM or YYYY-MM-DD',
            },

            groupTypeCompanionship: {
              type: 'string',
              enum: GROUP_TYPES,
            },

            companionshipMembers: {
              type: 'array',
              minItems: 0,
              maxItems: 4,

              items: {
                $ref: '#/components/schemas/CompanionshipMember',
              },

              description:
                'Empty when groupTypeCompanionship is solo. Requires at least one member for couple, friends or family.',
            },
          },
        },

        CreateGroupGuestDto: {
          type: 'object',

          required: ['visitedDate', 'groupType', 'members'],

          properties: {
            visitedDate: {
              type: 'string',
              example: '2026-01',
              description: 'ISO 8601: YYYY, YYYY-MM or YYYY-MM-DD',
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
