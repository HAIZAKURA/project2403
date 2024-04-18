// router/user_region.js
// User Region Router

import express from 'express';
import { logger } from '../app.js';
import { UsersRegion, Users, Region } from '../model.js';
import { authenticateToken } from "../tool/auth.js";

const router = express.Router();

/**
 * Code Define
 * 
 * 200: OK
 * 400: Bad Request
 * 401: Unauthorized
 */

/**
 * 处理GET请求，返回用户区域信息。
 * 
 * @param {object} req - 请求对象，包含会话信息和用户角色。
 * @param {object} res - 响应对象，用于返回处理结果。
 * @returns {object} 返回JSON格式的响应，包含代码和数据。
 */
router.get('', authenticateToken, async (req, res) => {
    try {
        // 检查用户是否登录且角色为1（管理员）
        if (req.user.role == 1) {
            // 查询所有用户区域信息
            let user_region = await UsersRegion.findAll();
            // 返回成功代码和用户区域数据
            res.json({
                code: 200,
                data: user_region
            });
        } else {
            // 用户未登录或不是管理员角色，返回授权失败代码
            res.json({
                code: 401
            });
        }
    } catch (error) {
        // 捕获异常，记录错误日志，并返回失败代码
        logger.error('Error:', error);
        res.json({
            code: 400
        });
    }
});

/**
 * 处理用户区域信息的提交请求
 * 
 * @param {Object} req 请求对象，包含用户信息和提交的数据
 * @param {Object} res 响应对象，用于返回处理结果
 * @returns {Object} 返回一个包含操作状态码的JSON对象
 */
router.post('', authenticateToken, async (req, res) => {
    try {
        // 检查用户是否登录且角色为1（具有特定权限）
        if (req.user.role == 1) {
            // 尝试为用户创建区域信息
            let user_region = await UsersRegion.create({
                uid: req.body.uid,
                region_id: req.body.region_id
            });
            // 根据创建结果返回不同的状态码
            if (user_region) {
                res.json({
                    code: 200
                });
            } else {
                res.json({
                    code: 400
                });
            }
        } else {
            // 如果用户未登录或权限不足，则返回401状态码
            res.json({
                code: 401
            });
        }
    } catch (error) {
        // 捕获异常，并记录错误信息
        logger.error('Error:', error);
        // 返回通用错误状态码
        res.json({
            code: 400
        });
    }
});

/**
 * 使用DELETE请求删除用户与区域的关联。
 * 
 * @param {Object} req - 请求对象，包含session信息和请求体中的用户ID和区域ID。
 * @param {Object} res - 响应对象，用于返回操作结果。
 * @returns {Object} 返回一个包含操作状态码的JSON对象。200表示删除成功，400表示删除失败，401表示未登录或权限不足。
 */
router.delete('', authenticateToken, async (req, res) => {
    try {
        // 检查用户是否登录且角色为1（具有删除权限）
        if (req.user.role == 1) {
            // 尝试根据提供的用户ID和区域ID删除用户区域关联
            let user_region = await UsersRegion.destroy({
                where: {
                    uid: req.body.uid,
                    region_id: req.body.region_id
                }
            });
            // 如果删除成功，返回状态码200
            if (user_region) {
                res.json({
                    code: 200
                });
            } else {
                // 删除失败，返回状态码400
                res.json({
                    code: 400
                });
            }
        } else {
            // 未登录或权限不足，返回状态码401
            res.json({
                code: 401
            });
        }
    } catch (error) {
        // 捕获并记录错误，返回状态码400
        logger.error('Error:', error);
        res.json({
            code: 400
        });
    }
});

export { router as user_region_router };
