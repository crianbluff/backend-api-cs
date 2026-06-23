import { Router } from 'express';
import { guestController } from '../controllers/guest.controller';
import { validate } from '../middlewares/validate.middleware';
import { createGuestSchema, updateGuestSchema, guestQuerySchema } from '../utils/validation';

const router = Router();

/**
 * @openapi
 * /guests:
 *   get:
 *     tags: [Guests]
 *     summary: Get all guests (list view, sorted by most recently added)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1, minimum: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, minimum: 1, maximum: 100 }
 *       - in: query
 *         name: continent
 *         schema: { type: string, enum: [Africa, America, Europe, Asia, Oceania] }
 *       - in: query
 *         name: region
 *         schema:
 *           type: string
 *           enum: [North America, Central America, South America, Caribbean, Middle East Asia, Southeast Asia, Eastern Asia, South Asia, Central Asia, West Europe, Scandinavia, Southern Europe, Northern Europe, Eastern Europe, Oceania, Africa]
 *       - in: query
 *         name: isFirstTime
 *         schema: { type: string, enum: [true, false] }
 *       - in: query
 *         name: from
 *         schema: { type: string }
 *         description: "Start of visitedDate range. Format: month-year e.g. november-2022"
 *         example: november-2022
 *       - in: query
 *         name: to
 *         schema: { type: string }
 *         description: "End of visitedDate range. Format: month-year e.g. august-2025"
 *         example: august-2025
 *     responses:
 *       200:
 *         description: Guests retrieved successfully
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PaginatedGuests' }
 *       400:
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiError' }
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiError' }
 */
router.get('/', validate(guestQuerySchema, 'query'), guestController.getAll.bind(guestController));

/**
 * @openapi
 * /guests/{id}:
 *   get:
 *     tags: [Guests]
 *     summary: Get a guest by ID (full detail)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         example: aT84plm2UiN
 *     responses:
 *       200:
 *         description: Guest retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Guest' }
 *       404:
 *         description: Guest not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiError' }
 */
router.get('/:id', guestController.getById.bind(guestController));

/**
 * @openapi
 * /guests:
 *   post:
 *     tags: [Guests]
 *     summary: Create a new guest (solo or couple)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - $ref: '#/components/schemas/CreateSoloGuestDto'
 *               - $ref: '#/components/schemas/CreateCoupleGuestDto'
 *           examples:
 *             solo:
 *               summary: Solo guest
 *               value:
 *                 nights: 4
 *                 stayed: true
 *                 rating: 4
 *                 hometownCode: CHN
 *                 livingInCode: CHN
 *                 prefixCode: "+86"
 *                 continent: Asia
 *                 region: Eastern Asia
 *                 fullName: "苠全 Randy"
 *                 hometown: "Zhangjiajie, Hunan"
 *                 livingIn: "Zhangjiajie, Hunan"
 *                 birthDate: "2000"
 *                 hangOut: true
 *                 visitedDate: "January 2026"
 *                 urlProfileCs: "minquan-zhao"
 *                 occupation: ["human resources"]
 *                 gender: male
 *                 whatsapp: "18174467658"
 *                 instagram: "justyourboyrandy"
 *                 wasACouple: false
 *     responses:
 *       201:
 *         description: Guest created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Guest' }
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiError' }
 */
router.post('/', validate(createGuestSchema), guestController.create.bind(guestController));

/**
 * @openapi
 * /guests/{id}:
 *   put:
 *     tags: [Guests]
 *     summary: Update a guest
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - $ref: '#/components/schemas/CreateSoloGuestDto'
 *               - $ref: '#/components/schemas/CreateCoupleGuestDto'
 *     responses:
 *       200:
 *         description: Guest updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Guest' }
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiError' }
 *       404:
 *         description: Guest not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiError' }
 */
router.put('/:id', validate(updateGuestSchema), guestController.update.bind(guestController));

/**
 * @openapi
 * /guests/{id}:
 *   delete:
 *     tags: [Guests]
 *     summary: Delete a guest
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Guest deleted successfully
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiSuccess' }
 *       404:
 *         description: Guest not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiError' }
 */
router.delete('/:id', guestController.delete.bind(guestController));

export default router;
