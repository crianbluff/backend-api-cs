import { Router } from 'express';

import { hostedController } from '../controllers/hosted.controller';

import { validate } from '../middlewares/validate.middleware';

import { createHostedSchema, hostedQuerySchema, updateHostedSchema } from '../utils/validation';

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
 *     description: Returns all hosted guests with pagination and filters.
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
 *           enum: [africa, america, europe, asia, oceania]
 *       - in: query
 *         name: region
 *         schema:
 *           type: string
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *           example: COL
 *       - in: query
 *         name: countryCodeWeMet
 *         schema:
 *           type: string
 *           example: PAN
 *       - in: query
 *         name: gender
 *         schema:
 *           type: string
 *           enum: [male, female, trans]
 *       - in: query
 *         name: groupTypeCompanionship
 *         schema:
 *           type: string
 *           enum: [solo, couple, friends, family]
 *       - in: query
 *         name: gay
 *         schema:
 *           type: string
 *           enum: ["true", "false"]
 *       - in: query
 *         name: isFirstTime
 *         schema:
 *           type: string
 *           enum: ["true", "false"]
 *       - in: query
 *         name: ambassador
 *         schema:
 *           type: string
 *           enum: ["true", "false"]
 *       - in: query
 *         name: didTheyReq
 *         schema:
 *           type: string
 *           enum: ["true", "false"]
 *       - in: query
 *         name: rating
 *         schema:
 *           type: string
 *           enum: ["1", "2", "3", "4", "5"]
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           example: "2026-01-01"
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           example: "2026-12-31"
 *     responses:
 *       200:
 *         description: Hosted guests retrieved successfully
 */

router.get('/', validate(hostedQuerySchema, 'query'), hostedController.getAll.bind(hostedController));

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
 *             $ref: '#/components/schemas/CreateHostedDto'
 *     responses:
 *       201:
 *         description: Hosted guest created successfully
 */

router.post('/', validate(createHostedSchema), hostedController.create.bind(hostedController));

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
 *             $ref: '#/components/schemas/UpdateHostedDto'
 *     responses:
 *       200:
 *         description: Hosted guest updated successfully
 *       404:
 *         description: Hosted guest not found
 */

router.put('/:id', validate(updateHostedSchema), hostedController.update.bind(hostedController));

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
 *       404:
 *         description: Hosted guest not found
 */

router.delete('/:id', hostedController.delete.bind(hostedController));

export default router;
