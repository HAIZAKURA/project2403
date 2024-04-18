// router/road.js
// Road Router

import express from 'express';
import { logger } from '../app.js';
import { Region, Road } from '../model.js';
import { authenticateToken } from "../tool/auth.js";

const router = express.Router();

/**
 * Code Define
 * 
 * 200: OK
 * 400: Bad Request
 * 401: Unauthorized
 */

/** Road Router Begin **/

/**
 * 处理GET请求，获取所有道路信息
 * @param {Object} req 请求对象，包含请求参数和信息
 * @query {String} region_id 区域ID
 * @param {Object} res 响应对象，用于发送响应给客户端
 */
router.get('', async (req, res) => {
    try {
        // 根据区域ID获取该区域的所有道路信息
        let where_clause = {};
        if (req.query.region_id) {
            where_clause.region_id = req.query.region_id;
        };
        // 异步查询所有道路信息
        let roads = await Road.findAll({
            where: where_clause
        });
        // 将查询结果以JSON格式返回给客户端
        res.json({
            code: 200,
            data: roads
        });
    } catch (error) {
        // 捕获异常，记录错误日志
        logger.error('Error:', error);
        // 发送错误响应给客户端
        res.json({
            code: 400
        });
    }
});

/**
 * 处理POST请求，用于创建新的道路信息。
 * 
 * @param {Object} req 请求对象，包含用户认证信息、请求体中的道路名称和区域ID。
 * @param {Object} res 响应对象，用于返回处理结果。
 * @returns {Object} 根据不同的情况返回不同的代码。成功创建道路返回200，创建失败或无权限返回400，未登录或角色不是管理员返回401。
 */
router.post('', authenticateToken, async (req, res) => {
    try {
        // 检查用户是否已登录且角色为管理员
        if (req.user.role == 1) {
            // 尝试创建新的道路记录
            let road = await Road.create({
                road_name: req.body.road_name,
                region_id: req.body.region_id
            });
            // 判断道路是否成功创建
            if (road) {
                res.json({
                    code: 200
                });
            } else {
                res.json({
                    code: 400
                });
            }
        } else {
            // 用户未登录或不是管理员，返回401
            res.json({
                code: 401
            });
        }
    } catch (error) {
        // 捕获异常，并记录错误日志
        logger.error('Error:', error);
        res.json({
            code: 400
        });
    }
});

/**
 * 使用PUT请求更新指定ID的道路信息。
 * 
 * @param {Object} req - 请求对象，包含道路ID、更新后的道路名称和区域ID，以及会话信息。
 * @param {Object} res - 响应对象，用于返回操作结果代码。
 * @returns {Object} 返回一个包含操作状态代码的JSON对象。200表示更新成功，400表示更新失败，401表示未登录或用户角色无权限。
 */
router.put('/:road_id', authenticateToken, async (req, res) => {
    try {
        // 检查用户是否已登录且具有管理员权限
        if (req.user.role == 1) {
            // 尝试更新道路信息
            let road = await Road.update({
                road_name: req.body.road_name,
                region_id: req.body.region_id
            }, {
                where: {
                    road_id: req.params.road_id
                }
            });
            // 根据更新结果返回相应代码
            if (road) {
                res.json({
                    code: 200
                });
            } else {
                res.json({
                    code: 400
                });
            }
        } else {
            // 如果用户未登录或无权限，则返回401代码
            res.json({
                code: 401
            });
        }
    } catch (error) {
        // 捕获并记录错误，返回失败代码
        logger.error('Error:', error);
        res.json({
            code: 400
        });
    }
});

/**
 * 删除指定的道路信息
 * 
 * @param {Object} req - 请求对象，包含道路ID和会话信息
 * @param {Object} res - 响应对象，用于返回操作结果
 * @returns {Object} 返回一个包含操作状态码的JSON对象
 */
router.delete('/:road_id', authenticateToken, async (req, res) => {
    try {
        // 检查用户是否登录且具有管理员权限
        if (req.user.role == 1) {
            // 尝试根据道路ID删除道路信息
            let road = await Road.destroy({
                where: {
                    road_id: req.params.road_id
                }
            });
            // 删除成功与否的判断与响应
            if (road) {
                res.json({
                    code: 200
                });
            } else {
                res.json({
                    code: 400
                });
            }
        } else {
            // 未登录或无权限的响应
            res.json({
                code: 401
            });
        }
    } catch (error) {
        // 捕获并记录错误信息，返回失败响应
        logger.error('Error:', error);
        res.json({
            code: 400
        });
    }
});

/** Road Router End **/

export { router as road_router };
