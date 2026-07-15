import { Router } from 'express';
import { hostedGroupController } from '../controllers/hosted-group.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Hosted Groups
 *   description: Hosted group management endpoints
 */

/**
 * @swagger
 * /hosted/groups/{groupId}:
 *   get:
 *     tags:
 *       - Hosted Groups
 *     summary: Get hosted group by groupId
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *           example: grp_aT84plm2UiN
 *     responses:
 *       200:
 *         description: Hosted group retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 *       404:
 *         description: Hosted group not found
 */
router.get('/:groupId', hostedGroupController.getByGroupId.bind(hostedGroupController));

/**
 * @swagger
 * /hosted/groups:
 *   post:
 *     tags:
 *       - Hosted Groups
 *     summary: Create hosted group
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateGroupGuestDto'
 *     responses:
 *       201:
 *         description: Hosted group created successfully
 */
router.post('/', hostedGroupController.createGroup.bind(hostedGroupController));

/**
 * @swagger
 * /hosted/groups/{groupId}:
 *   put:
 *     tags:
 *       - Hosted Groups
 *     summary: Update hosted group
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *           example: grp_aT84plm2UiN
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateGroupGuestDto'
 *     responses:
 *       200:
 *         description: Hosted group updated successfully
 *       404:
 *         description: Hosted group not found
 */
router.put('/:groupId', hostedGroupController.updateGroup.bind(hostedGroupController));

/**
 * @swagger
 * /hosted/groups/{groupId}:
 *   delete:
 *     tags:
 *       - Hosted Groups
 *     summary: Delete hosted group
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *           example: grp_aT84plm2UiN
 *     responses:
 *       200:
 *         description: Hosted group deleted successfully
 *       404:
 *         description: Hosted group not found
 */
router.delete('/:groupId', hostedGroupController.deleteGroup.bind(hostedGroupController));

export default router;
