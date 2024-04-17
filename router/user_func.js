// router/user_func.js
// User Func Router

import express from 'express';
import { logger } from '../app.js';
import { Users } from '../model.js';
import { md5 } from 'js-md5';
import jwt from 'jsonwebtoken';
import { authenticateToken } from '../tool/auth.js';

const router = express.Router();

/**
 * Code Define
 * 
 * 200: OK
 * 400: Bad Request
 * 401: Unauthorized
 */

/** User Func Router Begin **/

/**
 * 处理用户登录请求
 * @param {object} req - 请求对象，包含用户登录信息，如用户名和密码
 * @param {object} res - 响应对象，用于返回登录结果，包括状态码、用户信息和令牌
 */
router.post('/login', async (req, res) => {
    try {
        // 在数据库中查询用户，要求用户名和经过MD5加密的密码匹配
        let user = await Users.findOne({
            attributes: ['uid', 'username', 'role'],
            where: {
                username: req.body.username,
                password: md5(req.body.username + req.body.password)
            }
        });
        
        // 如果未找到匹配的用户，则返回登录失败
        if (user == null) {
            res.json({
                code: 401
            });
        } else {
            // 为登录成功的用户生成JWT令牌，并返回用户信息和令牌
            let token = jwt.sign({
                uid: user.uid,
                username: user.username,
                role: user.role
            }, process.env.JWT_SECRET, { expiresIn: '1h' });
            res.json({
                code: 200,
                data: user,
                token: token
            });
        };
    } catch (error) {
        // 捕获处理过程中可能出现的任何错误，并返回失败信息
        logger.error('Error:', error);
        res.json({
            code: 400
        });
    };
});

/**
 * 处理客户端的刷新令牌请求
 * @param {Object} req - 请求对象，包含客户端发送的请求信息
 * @param {Object} res - 响应对象，用于向客户端发送响应
 */
router.get('/refresh', authenticateToken, async (req, res) => {
    try {
        // 生成新的JWT令牌
        let token = jwt.sign({
            uid: req.user.uid,
            username: req.user.username,
            role: req.user.role
        }, process.env.JWT_SECRET, { expiresIn: '1h' })
        // 返回新的用户信息和令牌
        res.json({
            code: 200,
            data: req.user,
            token: token
        });
    } catch (error) {
        // 记录错误信息
        logger.error('Error:', error);
        // 返回错误响应
        res.json({
            code: 400
        });
    }
})

/** User Func Router End **/

export { router as user_func_router };