import { Router } from 'express';
import { groupController } from '../controllers/group.controller';
import { validate } from '../middlewares/validate.middleware';
import { updateGroupGuestSchema } from '../utils/validation';
import { createGroupGuestSchema } from '../utils/validation';

const router = Router();

/**
 * @openapi
 * /guests/group/{groupId}:
 *   get:
 *     tags: [Groups]
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
router.get('/:groupId', groupController.getByGroupId.bind(groupController));

/**
 * @openapi
 * /groups:
 *   post:
 *     tags: [Groups]
 *     summary: Create a guest group
 *     description: Creates a group with multiple members. Each member is stored as an individual guest document sharing the same groupId.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateGroupGuestDto'
 *     responses:
 *       201:
 *         description: Group created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 */
router.post('/', validate(createGroupGuestSchema), groupController.createGroup.bind(groupController));

/**
 * @openapi
 * /groups/{groupId}:
 *   put:
 *     tags: [Groups]
 *     summary: Update a complete group
 *     description: Updates shared fields and all group members.
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateGroupGuestDto'
 *     responses:
 *       200:
 *         description: Group updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 *       404:
 *         description: Group not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.put('/:groupId', validate(updateGroupGuestSchema), groupController.updateGroup.bind(groupController));

/**
 * @openapi
 * /groups/{groupId}:
 *   delete:
 *     tags: [Groups]
 *     summary: Delete all members of a group by groupId
 */
router.delete('/:groupId', groupController.deleteGroup.bind(groupController));

export default router;
