// router/setting.js
// Setting Router

import express from 'express';
import { logger } from '../app.js';
import { Setting } from '../model.js';
import { authenticateToken } from "../tool/auth.js";

const router = express.Router();

/**
 * Code Define
 * 
 * 200: OK
 * 400: Bad Request
 * 401: Unauthorized
 */

/** Setting Router Begin **/

/**
 * 更新设置信息
 * @param {Object} req - 请求对象，包含设置的ID和更新的设置值
 * @param {Object} res - 响应对象，用于返回操作结果
 * @returns {Object} 返回一个包含操作状态码的JSON对象
 */
router.put('/:setting_id', authenticateToken, async (req, res) => {
    try {
        // 检查用户是否登录且具有管理员权限
        if (req.user.role == 1) {
            // 更新设置值
            let setting = await Setting.update({
                setting_value: req.body.setting_value
            }, {
                where: {
                    setting_id: req.params.setting_id,
                    setting_name: req.body.setting_name
                }
            });
            // 根据更新结果返回相应状态码
            if (setting) {
                res.json({
                    code: 200
                });
            } else {
                res.json({
                    code: 400
                });
            }
        } else {
            // 如果用户未登录或不是管理员，返回401状态码
            res.json({
                code: 401
            });
        }
    } catch (err) {
        // 捕获异常，并返回400状态码
        logger.error('Error:', err);
        res.json({
            code: 400
        });
    }
});

/** Setting Router End **/

export { router as setting_router };
