// router/box.js
// Box Router

import express from 'express';
import { logger } from '../app.js';
import { Box } from '../model.js';

const router = express.Router();

/**
 * Code Define
 * 
 * 200: OK
 * 400: Bad Request
 * 401: Unauthorized
 */

/** Box Router Begin **/

/**
 * 处理GET请求，根据提供的查询参数（如果有的话）来查询所有Box的信息。
 * 
 * @param {object} req - 请求对象，包含查询参数和会话信息。
 * @param {object} res - 响应对象，用于返回查询结果或错误信息。
 */
router.get('', async (req, res) => {
    try {
        // 检查用户是否已登录
        if (req.session.isLogin) {
            let where_clause = {}; // 用于构建查询条件的对象

            // 根据查询参数添加到where_clause对象中
            if (req.query.region_id) {
                where_clause.region_id = req.query.region_id;
            }
            if (req.query.road_id) {
                where_clause.road_id = req.query.road_id;
            }

            // 查询满足条件的所有Box信息
            let box = await Box.findAll({
                where: where_clause,
                attributes: ['box_id', 'leakage_id', 'light_id', 'latitude', 'longitude', 'region_id', 'road_id']
            });

            // 根据查询结果返回相应信息
            if (box) {
                res.json({
                    code: 200,
                    data: box
                });
            } else {
                res.json({
                    code: 400
                });
            }
        } else {
            // 如果用户未登录，返回相应错误信息
            res.json({
                code: 401
            });
        }
    } catch (error) {
        // 捕获并记录错误信息，然后返回错误代码
        logger.error('Error:', error);
        res.json({
            code: 400
        });
    }
});

/**
 * 根据 box_id 从数据库获取 box 信息的路由处理函数。
 * 
 * @param {Object} req - 请求对象，包含 route 参数和 session 信息。
 * @param {Object} res - 响应对象，用于返回查询结果或错误信息。
 */
router.get('/:box_id', async (req, res) => {
    try {
        // 检查用户是否已登录
        if (req.session.isLogin) {
            // 通过 box_id 查询 Box 表，获取对应 box 信息
            let box = await Box.findByPk(req.params.box_id);
            // 返回查询结果
            res.json({
                code: 200,
                data: box
            });
        } else {
            // 用户未登录，返回 401 错误码
            res.json({
                code: 401
            });
        }
    } catch (error) {
        // 捕获并记录错误信息
        logger.error('Error:', error);
        // 返回通用错误信息
        res.json({
            code: 400
        });
    }
});

/**
 * 处理POST请求，用于创建一个新的Box实例。
 * 如果用户已登录，将根据请求体中的信息创建Box对象。
 * 
 * @param {Object} req 请求对象，包含用户信息及POST请求的数据。
 * @param {Object} res 响应对象，用于返回处理结果。
 */
router.post('', async (req, res) => {
    try {
        // 检查用户是否已登录
        if (req.session.isLogin) {
            // 创建新的Box实例
            let box = await Box.create({
                box_id: req.body.box_id,
                leakage_id: req.body.leakage_id,
                light_id: req.body.light_id,
                latitude: req.body.latitude,
                longitude: req.body.longitude,
                region_id: req.body.region_id,
                road_id: req.body.road_id
            });
            // 根据创建结果返回相应的状态码
            if (box) {
                res.json({
                    code: 200
                });
            } else {
                res.json({
                    code: 400
                });
            }
        } else {
            // 如果用户未登录，返回状态码401
            res.json({
                code: 401
            });
        }
    } catch (error) {
        // 捕获异常，并记录错误信息
        logger.error('Error:', error);
        // 返回状态码400表示请求失败
        res.json({
            code: 400
        });
    }
});

/**
 * 使用PUT请求更新指定ID的盒子信息
 * @param {Object} req - 请求对象，包含盒子的更新信息和认证会话
 * @param {Object} res - 响应对象，用于返回操作结果
 */
router.put('/:box_id', async (req, res) => {
    try {
        // 检查用户是否已登录
        if (req.session.isLogin) {
            // 尝试更新盒子信息
            let box = await Box.update({
                light_id: req.body.light_id, // 灯光ID
                latitude: req.body.latitude, // 纬度
                longitude: req.body.longitude, // 经度
                region_id: req.body.region_id, // 区域ID
                road_id: req.body.road_id // 路段ID
            }, {
                where: {
                    box_id: req.params.box_id // 盒子ID
                }
            });
            // 成功更新则返回200，否则返回400
            if (box) {
                res.json({
                    code: 200
                });
            } else {
                res.json({
                    code: 400
                });
            }
        } else {
            // 未登录返回401
            res.json({
                code: 401
            });
        }
    } catch (error) {
        // 捕获异常并记录错误日志
        logger.error('Error:', error);
        // 异常情况下返回400
        res.json({
            code: 400
        });
    }
});

/**
 * 删除指定的盒子信息
 * @param {Object} req - 请求对象，包含盒子ID和会话信息
 * @param {Object} res - 响应对象，用于返回操作结果
 * @returns {Object} 返回一个包含操作状态码的JSON对象
 */
router.delete('/:box_id', async (req, res) => {
    try {
        // 检查用户是否已登录
        if (req.session.isLogin) {
            // 根据提供的box_id删除盒子信息
            let box = await Box.destroy({
                where: {
                    box_id: req.params.box_id
                }
            });
            // 如果删除成功，返回成功状态码
            if (box) {
                res.json({
                    code: 200
                });
            } else {
                // 如果删除失败（例如不存在该盒子），返回失败状态码
                res.json({
                    code: 400
                });
            }
        } else {
            // 如果用户未登录，返回未授权状态码
            res.json({
                code: 401
            });
        }
    } catch (error) {
        // 捕获并记录操作中的错误，返回失败状态码
        logger.error('Error:', error);
        res.json({
            code: 400
        });
    }
});

/** Box Router End **/

export { router as box_router };
