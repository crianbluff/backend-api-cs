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
 *     summary: Get all guests (solos flat, groups aggregated — groups count as 1)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1, minimum: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, minimum: 1, maximum: 100 }
 *       - in: query
 *         name: continent
 *         schema: { type: string, enum: [africa, america, europe, asia, oceania] }
 *       - in: query
 *         name: region
 *         schema:
 *           type: string
 *           enum:
 *             [
 *               north_america,
 *               central_america,
 *               south_america,
 *               caribbean,
 *               middle_east_asia,
 *               southeast_asia,
 *               eastern_asia,
 *               south_asia,
 *               central_asia,
 *               western_europe,
 *               scandinavia,
 *               southern_europe,
 *               northern_europe,
 *               eastern_europe,
 *               oceania,
 *               africa
 *             ]
 *       - in: query
 *         name: groupType
 *         schema: { type: string, enum: [solo, couple, friends, family] }
 *       - in: query
 *         name: isFirstTime
 *         schema: { type: string, enum: [true, false] }
 *       - in: query
 *         name: from
 *         schema: { type: string }
 *         example: 2022-11
 *       - in: query
 *         name: to
 *         schema: { type: string }
 *         example: 2025-08
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
 */
router.get('/', validate(guestQuerySchema, 'query'), guestController.getAll.bind(guestController));

/**
 * @openapi
 * /guests/group/{groupId}:
 *   get:
 *     tags: [Guests]
 *     summary: Get all members of a group by groupId
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Group members retrieved
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiSuccess' }
 *       404:
 *         description: Group not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiError' }
 */
router.get('/group/:groupId', guestController.getByGroupId.bind(guestController));

/**
 * @openapi
 * /guests/{id}:
 *   get:
 *     tags: [Guests]
 *     summary: Get a single guest by guestId (full document)
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
 *             schema: { $ref: '#/components/schemas/ApiSuccess' }
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
 *     summary: Create a solo guest or a group
 *     description: >
 *       Include `members` array for group creation. The backend generates a shared `groupId`
 *       and creates one document per member. Omit `members` for a solo guest.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - $ref: '#/components/schemas/CreateSoloGuestDto'
 *               - $ref: '#/components/schemas/CreateGroupGuestDto'
 *           examples:
 *             solo:
 *               summary: Solo guest
 *               value:
 *                 nights: 2
 *                 stayed: true
 *                 hangOut: true
 *                 visitedDate: "2025-11"
 *                 hometownCode: MAR
 *                 prefixCode: "+212"
 *                 continent: africa
 *                 region: africa
 *                 fullName: Simo Amri
 *                 gender: male
 *                 rating: 3
 *             group:
 *               summary: Couple
 *               value:
 *                 groupType: couple
 *                 nights: 2
 *                 stayed: true
 *                 hangOut: true
 *                 visitedDate: "2024-02"
 *                 gift: ["card", "bracelets"]
 *                 members:
 *                   - hometownCode: ARG
 *                     continent: america
 *                     region: south_america
 *                     fullName: Aylen Rivarola
 *                     gender: female
 *                     rating: 4
 *                   - hometownCode: ARG
 *                     continent: america
 *                     region: south_america
 *                     fullName: Manu Sabanés
 *                     gender: male
 *                     rating: 4
 *     responses:
 *       201:
 *         description: Guest(s) created successfully
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiSuccess' }
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
 *     summary: Update a single guest by guestId
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateSoloGuestDto' }
 *     responses:
 *       200:
 *         description: Guest updated successfully
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiSuccess' }
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
 *     summary: Delete a single guest by guestId
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

/**
 * @openapi
 * /guests/group/{groupId}:
 *   delete:
 *     tags: [Guests]
 *     summary: Delete all members of a group by groupId
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Group deleted successfully
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiSuccess' }
 *       404:
 *         description: Group not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiError' }
 */
router.delete('/group/:groupId', guestController.deleteGroup.bind(guestController));

export default router;
