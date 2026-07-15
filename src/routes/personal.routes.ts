import { Router } from 'express';
import { personalController } from '../controllers/personal.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Personal
 *   description: Personal guest management endpoints
 */

/**
 * @swagger
 * /personal:
 *   get:
 *     tags:
 *       - Personal
 *     summary: Get all personal guests
 *     description: Returns a paginated list of personal guests. References are excluded from this endpoint.
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
 *         description: Personal guests retrieved successfully
 */
router.get('/', personalController.getAll.bind(personalController));

/**
 * @swagger
 * /personal/{id}:
 *   get:
 *     tags:
 *       - Personal
 *     summary: Get personal guest by id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: aT84plm2UiN
 *     responses:
 *       200:
 *         description: Personal guest retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 *       404:
 *         description: Personal guest not found
 */
router.get('/:id', personalController.getById.bind(personalController));

/**
 * @swagger
 * /personal:
 *   post:
 *     tags:
 *       - Personal
 *     summary: Create personal guest
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSoloGuestDto'
 *     responses:
 *       201:
 *         description: Personal guest created successfully
 */
router.post('/', personalController.create.bind(personalController));

/**
 * @swagger
 * /personal/{id}:
 *   put:
 *     tags:
 *       - Personal
 *     summary: Update personal guest
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
 *         description: Personal guest updated successfully
 */
router.put('/:id', personalController.update.bind(personalController));

/**
 * @swagger
 * /personal/{id}:
 *   delete:
 *     tags:
 *       - Personal
 *     summary: Delete personal guest
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Personal guest deleted successfully
 */
router.delete('/:id', personalController.delete.bind(personalController));

export default router;
