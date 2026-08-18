import { Router } from 'express';
import { statsGuestController } from '../controllers/stats-guest.controller';

const router = Router();

/**
 * @swagger
 * /stats-guests:
 *   get:
 *     tags:
 *       - Stats Guests
 *     summary: Get guests statistics
 *     description: Returns global statistics about guests including continents, countries, genders, groups, gifts, ratings and visits.
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 *       500:
 *         description: Internal server error
 */
router.get('/', statsGuestController.getStats.bind(statsGuestController));

export default router;
