// router/region.js
// Region Router

import express from 'express';
import { logger } from '../app.js';
import { Region, Road, Users } from '../model.js';
import { authenticateToken } from "../tool/auth.js";

const router = express.Router();

/**
 * Code Define
 * 
 * 200: OK
 * 400: Bad Request
 * 401: Unauthorized
 */

/** Region Router Begin **/

/**
 * 使用GET请求获取所有地区信息及其包含的道路信息
 * @param {Object} req 请求对象，包含请求参数和信息
 * @param {Object} res 响应对象，用于返回响应数据和状态码
 */
router.get('', async (req, res) => {
    try {
        // 尝试从Region模型中查询所有地区信息
        let regions = await Region.findAll();
        // 如果查询结果存在，将结果以JSON格式返回，并设置状态码为200
        res.json({
            code: 200,
            data: regions
        });
    } catch (error) {
        // 捕获在查询过程中发生的任何错误，并记录到日志中
        logger.error('Error:', error);
        // 返回状态码400表示请求处理失败
        res.json({
            code: 400
        });
    }
});

/**
 * 根据区域ID获取区域信息及其包含的道路信息。
 * 
 * @param {Object} req - 请求对象，包含路径参数region_id。
 * @param {Object} res - 响应对象，用于返回区域信息或错误信息。
 * @returns {Object} 返回一个包含区域信息的对象，或者在发生错误时返回一个包含错误代码的对象。
 */
router.get('/:region_id', async (req, res) => {
    try {
        // 通过区域ID异步查询区域信息及其包含的道路信息
        let region = await Region.findByPk(req.params.region_id, {
            include: [{
                model: Users,
                attributes: ['uid', 'username']
            }, {
                model: Road,
                attributes: ['road_id', 'road_name']
            }]
        });
        // 成功查询到后，将区域信息以JSON格式返回
        res.json({
            code: 200,
            data: region
        });
    } catch (error) {
        // 查询出错时，记录错误日志，并返回错误代码
        logger.error('Error:', error);
        res.json({
            code: 400
        });
    }
})

/**
 * 处理POST请求，用于创建新的地区信息。
 * 
 * @param {Object} req 请求对象，包含用户信息和请求体中的地区名称。
 * @param {Object} res 响应对象，用于返回操作结果。
 */
router.post('', authenticateToken, async (req, res) => {
    try {
        // 检查用户是否已登录并且角色为1（具有创建地区的权限）
        if (req.user.role == 1) {
            // 尝试创建新的地区信息
            let region = await Region.create({
                region_name: req.body.region_name
            });
            // 根据创建结果返回相应的响应
            if (region) {
                res.json({
                    code: 200,
                    data: region
                });
            } else {
                res.json({
                    code: 400
                });
            }
        } else {
            // 如果用户未登录或角色无权限，则返回401状态码
            res.json({
                code: 401
            });
        }
    } catch (error) {
        // 捕获并记录错误信息，返回400状态码
        logger.error('Error:', error);
        res.json({
            code: 400
        });
    }
});

/**
 * 更新指定区域信息
 * 
 * @param {Object} req - 请求对象，包含路径参数、请求体和会话信息
 * @param {Object} res - 响应对象，用于返回处理结果
 * @returns {Object} 返回一个包含操作状态码和数据的JSON对象
 */
router.put('/:region_id', authenticateToken, async (req, res) => {
    try {
        // 检查用户是否登录且角色为管理员
        if (req.user.role == 1) {
            // 更新区域信息
            let region = await Region.update({
                region_name: req.body.region_name
            }, {
                where: {
                    region_id: req.params.region_id
                }
            });
            // 更新成功与否的处理
            if (region) {
                res.json({
                    code: 200,
                    data: region
                });
            } else {
                res.json({
                    code: 400
                });
            }
        } else {
            // 未登录或权限不足的处理
            res.json({
                code: 401
            });
        }
    } catch (error) {
        // 捕获异常并记录
        logger.error('Error:', error);
        res.json({
            code: 400
        });
    }
});

/**
 * 删除指定区域的信息
 * 
 * @param {Object} req - 请求对象，包含路径参数、会话信息等
 * @param {Object} res - 响应对象，用于返回操作结果
 * @returns {Object} 返回一个包含操作状态码的JSON对象
 */
router.delete('/:region_id', authenticateToken, async (req, res) => {
    try {
        // 检查用户是否登录且具有管理员权限
        if (req.user.role == 1) {
            // 尝试根据区域ID删除区域信息
            let region = await Region.destroy({
                where: {
                    region_id: req.params.region_id
                }
            });
            // 根据删除结果返回相应状态码
            if (region) {
                res.json({
                    code: 200
                });
            } else {
                res.json({
                    code: 400
                });
            }
        } else {
            // 如果用户未登录或不是管理员，返回未授权状态码
            res.json({
                code: 401
            });
        }
    } catch (error) {
        // 捕获并记录异常，返回操作失败状态码
        logger.error('Error:', error);
        res.json({
            code: 400
        });
    }
});

/** Region Router End **/

export { router as region_router };
