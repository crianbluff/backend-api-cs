import { Router } from 'express';
import { hostedController } from '../controllers/hosted.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Hosted
 *   description: Hosted guest management endpoints
 */

/**
 * @swagger
 * /hosted:
 *   get:
 *     tags:
 *       - Hosted
 *     summary: Get all hosted guests
 *     description: Returns a paginated list of hosted guests. References are excluded from this endpoint.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: string
 *           example: "1"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: string
 *           example: "10"
 *       - in: query
 *         name: continent
 *         schema:
 *           type: string
 *       - in: query
 *         name: region
 *         schema:
 *           type: string
 *       - in: query
 *         name: gender
 *         schema:
 *           type: string
 *       - in: query
 *         name: groupType
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Hosted guests retrieved successfully
 */
router.get('/', hostedController.getAll.bind(hostedController));

/**
 * @swagger
 * /hosted/{id}:
 *   get:
 *     tags:
 *       - Hosted
 *     summary: Get hosted guest by id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: aT84plm2UiN
 *     responses:
 *       200:
 *         description: Hosted guest retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 *       404:
 *         description: Hosted guest not found
 */
router.get('/:id', hostedController.getById.bind(hostedController));

/**
 * @swagger
 * /hosted:
 *   post:
 *     tags:
 *       - Hosted
 *     summary: Create hosted guest
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSoloGuestDto'
 *     responses:
 *       201:
 *         description: Hosted guest created successfully
 */
router.post('/', hostedController.create.bind(hostedController));

/**
 * @swagger
 * /hosted/{id}:
 *   put:
 *     tags:
 *       - Hosted
 *     summary: Update hosted guest
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
 *         description: Hosted guest updated successfully
 */
router.put('/:id', hostedController.update.bind(hostedController));

/**
 * @swagger
 * /hosted/{id}:
 *   delete:
 *     tags:
 *       - Hosted
 *     summary: Delete hosted guest
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Hosted guest deleted successfully
 */
router.delete('/:id', hostedController.delete.bind(hostedController));

export default router;
