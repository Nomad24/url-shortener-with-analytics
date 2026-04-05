import { Router } from 'express';
import { z } from 'zod';
import { LinkController } from '../controllers/linkController.js';
import { authGuard } from '../middleware/authGuard.js';
import { validate } from '../middleware/validate.js';

const router = Router();
const linkController = new LinkController();

const createSchema = z.object({
  url: z.string().url(),
  title: z.string().optional(),
});

const updateSchema = z.object({
  title: z.string().optional(),
  isActive: z.boolean().optional(),
  expiresAt: z.string().datetime().optional(),
});

router.post('/guest', validate(createSchema), linkController.createGuest);
router.post('/', authGuard, validate(createSchema), linkController.createAuth);
router.get('/', authGuard, linkController.getAll);
router.get('/:id', authGuard, linkController.getById);
router.patch('/:id', authGuard, validate(updateSchema), linkController.update);
router.delete('/:id', authGuard, linkController.delete);

export default router;
