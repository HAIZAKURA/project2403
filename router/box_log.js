// router/box_log.js
// Box Log Router

import express from 'express';
import { logger } from '../app.js';
import { BoxLog } from '../model.js';

const router = express.Router();

/**
 * Code Define
 * 
 * 200: OK
 * 400: Bad Request
 * 401: Unauthorized
 */

/** Box Log Router Begin **/

router.get('/:box_id', async (req, res) => {
    try {
        if (req.session.isLogin) {

        } else {
            res.json({
                code: 401
            });
        }
    } catch (error) {
        // 捕获异常，记录错误并返回失败状态码
        logger.error('Error:', error);
        res.json({
            code: 400
        });
    }
});

/** Box Log Router End **/

export { router as box_log_router };