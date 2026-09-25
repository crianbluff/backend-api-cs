import { Router } from 'express';
import { guestController } from '../controllers/guest.controller';
import { validate } from '../middlewares/validate.middleware';
import { updateGuestSchema, guestQuerySchema, createSoloGuestSchema } from '../utils/validation';
import { statsGuestController } from '../controllers/stats-guest.controller';
import { uploadGuestPhotos } from '../middlewares/upload.middleware';

const router = Router();

/**
 * @openapi
 * /guests:
 *   get:
 *     tags: [Guests]
 *     summary: Get all guests (solos flat, groups aggregated — groups count as 1)
 *     parameters:
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *         description: ISO 3166-1 alpha-3 country code (hometownCode)
 *         example: COL
 * 

 *       - in: query
 *         name: countryCodeWeMet
 *         schema:
 *           type: string
 *         description: ISO 3166-1 alpha-3 country code (hometownCode)
 *         example: COL

 *       - in: query
 *         name: gender
 *         schema:
 *           type: string
 *           enum: [male, female, trans]
  
 *       - in: query
 *         name: livingIn
 *         schema:
 *           type: string

 *       - in: query
 *         name: hometown
 *         schema:
 *           type: string

 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1

 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100

 *       - in: query
 *         name: rating
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         description: Filter guests by exact rating
 *         example: 4

 *       - in: query
 *         name: continent
 *         schema:
 *           type: string
 *           enum: [africa, america, europe, asia, oceania]

 *       - in: query
 *         name: region
 *         schema:
 *           type: string
 *           enum:
 *             [
 *               oceania,
 *               melanesia,
 *               micronesia,
 *               polinesia,
 *               central_asia,
 *               east_asia,
 *               south_asia,
 *               southeast_asia,
 *               west_asia,
 *               northern_africa,
 *               western_africa,
 *               central_africa,
 *               eastern_africa,
 *               southern_africa,
 *               south_america,
 *               north_america,
 *               central_america,
 *               caribbean,
 *               northern_europe,
 *               central_europe,
 *               western_europe,
 *               eastern_europe,
 *               southern_europe,
 *               scandinavia,
 *               baltics
 *             ]

 *       - in: query
 *         name: groupType
 *         schema:
 *           type: string
 *           enum: [solo, couple, friends, family]

 *       - in: query
 *         name: isFirstTime
 *         schema:
 *           type: string
 *           enum: [true, false]

 *       - in: query
 *         name: gift
 *         schema:
 *           type: string
 *           enum: [true, false] 
  
 *       - in: query
 *         name: gay
 *         schema:
 *           type: string
 *           enum: [true, false]

 *       - in: query
 *         name: ambassador
 *         schema:
 *           type: string
 *           enum: [true, false]

 *       - in: query
 *         name: hangOut
 *         schema:
 *           type: string
 *           enum: [true, false]

 *       - in: query
 *         name: didTheyReq
 *         schema:
 *           type: string
 *           enum: [true, false]
 *       - in: query
 *         name: birthDate
 *         schema:
 *           type: string
 *         description: |
 *           Filter guests by birth date. The format determines the type of search:
 *
 *           - YYYY: all guests born in that year.
 *             Example: 1999 → all guests born in 1999.
 *
 *           - MM: all guests born in that month, regardless of year or day.
 *             Example: 05 → all guests born in May.
 *
 *           - YYYY-MM: all guests born in that month and year, regardless of day.
 *             Example: 1999-05 → all guests born in May 1999.
 *
 *           - YYYY-MM-DD: all guests born on that exact date.
 *             Example: 1999-05-15 → all guests born on May 15, 1999.
 *
 *           - MM-DD: all guests born on that month and day, regardless of year.
 *             Example: 05-15 → all guests born on May 15.
 *
 *         examples:
 *           year:
 *             summary: Birth year
 *             value: "1999"
 *           month:
 *             summary: Birth month, any year
 *             value: "05"
 *           monthYear:
 *             summary: Specific month and year
 *             value: "1999-05"
 *           exactDate:
 *             summary: Exact birth date
 *             value: "1999-05-15"
 *           monthDay:
 *             summary: Month and day, any year
 *             value: "05-15"
 *
 *       - in: query
 *         name: day
 *         schema:
 *           type: string
 *         description: |
 *           Filter guests by the day of the visit across all months of a specific year.
 *
 *           Format: YYYY-DD
 *
 *           Example: 2026-05 returns all guests who visited on the 5th day
 *           of any month in 2026.
 *
 *           For example, it matches:
 *           - 2026-01-05
 *           - 2026-02-05
 *           - 2026-03-05
 *           - 2026-12-05
 *
 *           It does not match:
 *           - 2025-05-05
 *           - 2026-01-04
 *           - 2026-01-06
 *
 *         example: "2026-05"


  *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *         description: |
 *           Start date for filtering guests by visited date.
 *
 *           The date can be provided as:
 *
 *           - YYYY: from the beginning of that year.
 *             Example: 2022 → dates from 2022 onward.
 *
 *           - YYYY-MM: from the beginning of that month.
 *             Example: 2022-11 → dates from November 2022 onward.
 *
 *           - YYYY-MM-DD: from that exact date.
 *             Example: 2022-11-15 → dates from November 15, 2022 onward.
 *
 *           When used together with "to", guests are returned within the
 *           specified date range.
 *
 *         examples:
 *           year:
 *             summary: From a year
 *             value: "2022"
 *           month:
 *             summary: From a month
 *             value: "2022-11"
 *           date:
 *             summary: From an exact date
 *             value: "2022-11-15"
 *
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *         description: |
 *           End date for filtering guests by visited date.
 *
 *           The date can be provided as:
 *
 *           - YYYY: up to the end of that year.
 *             Example: 2025 → dates up to the end of 2025.
 *
 *           - YYYY-MM: up to the end of that month.
 *             Example: 2025-08 → dates up to the end of August 2025.
 *
 *           - YYYY-MM-DD: up to that exact date.
 *             Example: 2025-08-15 → dates up to August 15, 2025.
 *
 *           When used together with "from", guests are returned within the
 *           specified date range.
 *
 *         examples:
 *           year:
 *             summary: To a year
 *             value: "2025"
 *           month:
 *             summary: To a month
 *             value: "2025-08"
 *           date:
 *             summary: To an exact date
 *             value: "2025-08-15"
 *     responses:
 *       200:
 *         description: Guests retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedGuests'
 *       400:
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get('/', validate(guestQuerySchema, 'query'), guestController.getAll.bind(guestController));

/**
 * @openapi
 * /guests/stats:
 *   get:
 *     tags:
 *       - Guests
 *     summary: Get guests statistics
 *     description: Returns statistics about guests.
 *     responses:
 *       200:
 *         description: Guest statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get('/stats', statsGuestController.getStats.bind(statsGuestController));

/**
 * @openapi
 * /guests/{id}:
 *   get:
 *     tags: [Guests]
 *     summary: Get a single guest by guestId
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: aT84plm2UiN
 *     responses:
 *       200:
 *         description: Guest retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 *       404:
 *         description: Guest not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get('/:id', guestController.getById.bind(guestController));

/**
 * @openapi
 * /guests:
 *   post:
 *     tags: [Guests]
 *     summary: Create a solo guest
 *     description: Creates a single guest document with up to 5 photos.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/CreateSoloGuestDto'
 *               - type: object
 *                 properties:
 *                   photos:
 *                     type: array
 *                     maxItems: 5
 *                     items:
 *                       type: string
 *                       format: binary
 *                     description: Up to 5 guest photos.
 *           encoding:
 *             photos:
 *               style: form
 *               explode: true
 *     responses:
 *       201:
 *         description: Guest created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.post(
  '/',
  uploadGuestPhotos.array('photos', 5),
  validate(createSoloGuestSchema),
  guestController.create.bind(guestController)
);

/**
 * @openapi
 * /guests/{id}:
 *   put:
 *     tags: [Guests]
 *     summary: Update a single guest by guestId
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSoloGuestDto'
 *     responses:
 *       200:
 *         description: Guest updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Guest not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.put(
  '/:id',
  uploadGuestPhotos.array('photos', 5),
  (req, _res, next) => {
    console.log('BODY:', req.body);
    console.log('PHOTO IDS:', req.body.photoIds);
    console.log('FILES:', req.files);

    next();
  },
  validate(updateGuestSchema),
  guestController.update.bind(guestController)
);

/**
 * @openapi
 * /guests/{id}:
 *   delete:
 *     tags: [Guests]
 *     summary: Delete a single guest by guestId
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Guest deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 *       404:
 *         description: Guest not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.delete('/:id', guestController.delete.bind(guestController));

export default router;
