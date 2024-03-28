// router/user_region.js
// User Region Router

import express from 'express';
import { logger } from '../app.js';
import { UsersRegion } from '../model.js';

const router = express.Router();

/**
 * Code Define
 * 
 * 200: OK
 * 400: Bad Request
 * 401: Unauthorized
 */

router.get('', async (req, res) => {
    try {
        if (req.session.isLogin && req.session.user.role == 1) {
            let user_region = await UsersRegion.findAll();
            if (user_region) {
                res.json({
                    code: 200,
                    data: user_region
                });
            } else {
                res.json({
                    code: 400
                });
            }
        } else {
            res.json({
                code: 401
            });
        }
    } catch (error) {
        logger.error('Error:', error);
        res.json({
            code: 400
        });
    }
});

router.post('', async (req, res) => {
});

router.delete('', async (req, res) => {
});

export { router as user_region_router };
