// router/box_state.js
// Box State Router

import express from 'express';
import { logger } from '../app.js';
import { BoxState } from '../model.js';

const router = express.Router();

/**
 * Code Define
 * 
 * 200: OK
 * 400: Bad Request
 * 401: Unauthorized
 */

/** Box State Router Begin **/

/**
 * 处理GET请求，根据用户登录状态查询并返回BoxState信息
 * 
 * @param {object} req 请求对象，包含session信息和请求参数
 * @param {object} res 响应对象，用于返回处理结果
 * @returns {object} 返回JSON格式的响应数据，包含状态码和数据
 */
router.get('', async (req, res) => {
    try {
        // 检查用户是否已登录
        if (req.session.isLogin) {
            // 查询BoxState信息，按box_id升序排列
            let box_state = await BoxState.findAll({
                order: [
                    ['box_id', 'ASC']
                ]
            });
            // 判断查询结果，返回相应状态码和数据
            if (box_state) {
                res.json({
                    code: 200,
                    data: box_state
                });
            } else {
                res.json({
                    code: 400
                });
            }
        } else {
            // 用户未登录，返回未授权状态码
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

/**
 * 根据 box_id 获取盒子状态信息
 * 
 * @param {Object} req 请求对象，包含 box_id 参数
 * @param {Object} res 响应对象，用于返回状态码和数据
 * @returns {Object} 返回包含状态码和数据的json对象。成功时，状态码为200，数据为box状态；未登录时，状态码为401；找不到box状态时，状态码为400；操作异常时，状态码为400。
 */
router.get('/:box_id', async (req, res) => {
    try {
        // 检查用户是否已登录
        if (req.session.isLogin) {
            // 通过 box_id 查找盒子状态
            let box_state = await BoxState.findByPk(req.params.box_id);
            if (box_state) {
                // 找到盒子状态，返回状态码和数据
                res.json({
                    code: 200,
                    data: box_state
                });
            } else {
                // 未找到盒子状态，返回状态码400
                res.json({
                    code: 400
                });
            }
        } else {
            // 用户未登录，返回状态码401
            res.json({
                code: 401
            });
        }
    } catch (error) {
        // 捕获异常，并返回状态码400
        logger.error('Error:', error);
        res.json({
            code: 400
        });
    }
});

/** Box State Router End **/

export { router as box_state_router };