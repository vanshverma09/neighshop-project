import { Router } from 'express';
import { getSellerPublicProfile } from '../controllers/userController';

const router = Router();

router.get('/seller/:id', getSellerPublicProfile);

export default router;
