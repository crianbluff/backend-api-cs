import { Router } from 'express';
import { guestController } from '../controllers/guest.controller';
import { validate } from '../middlewares/validate.middleware';
import { updateGuestSchema, guestQuerySchema, createSoloGuestSchema } from '../utils/validation';
import { statsGuestController } from '../controllers/stats-guest.controller';

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
 *       - in: query
 *         name: gender
 *         schema:
 *           type: string
 *           enum: [male, female, trans]
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
 *               oceania
 *               melanesia
 *               micronesia
 *               polinesia
 *               central_asia
 *               east_asia
 *               south_asia
 *               southeast_asia
 *               west_asia
 *               northern_africa
 *               western_africa
 *               central_africa
 *               eastern_africa
 *               southern_africa
 *               south_america
 *               north_america
 *               central_america
 *               caribbean
 *               northern_europe
 *               central_europe
 *               western_europe
 *               eastern_europe
 *               southern_europe
 *               scandinavia
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
 *         name: ambassador
 *         schema:
 *           type: string
 *           enum: [true, false]
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *         example: 2022-11
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *         example: 2025-08
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
 *     description: Creates a single guest document.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSoloGuestDto'
 *           example:
 *             nights: 2
 *             stayed: true
 *             visitedDate: "2025-11"
 *             hometownCode: MAR
 *             prefixCode: "+212"
 *             continent: africa
 *             region: africa
 *             fullName: Simo Amri
 *             gender: male
 *             rating: 3
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
router.post('/', validate(createSoloGuestSchema), guestController.create.bind(guestController));

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
router.put('/:id', validate(updateGuestSchema), guestController.update.bind(guestController));

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
