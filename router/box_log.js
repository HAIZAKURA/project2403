// router/box_log.js
// Box Log Router

import express from 'express';
import { logger } from '../app.js';
import { BoxLog, Box, Road } from '../model.js';
import { Op } from 'sequelize';
import { authenticateToken } from "../tool/auth.js";

const router = express.Router();

/**
 * Code Define
 * 
 * 200: OK
 * 400: Bad Request
 * 401: Unauthorized
 */

/** Box Log Router Begin **/

/**
 * 处理GET请求，根据提供的区域ID和可选的限制条件，查询相关的盒子日志信息。
 * 
 * @param {object} req - 请求对象，包含session信息、查询参数。
 * @param {object} res - 响应对象，用于返回查询结果或错误信息。
 */
router.get('', authenticateToken, async (req, res) => {
    try {
        // 检查是否提供了有效的区域ID
        if (req.query.region_id && parseInt(req.query.region_id) != 0) {
            // 定义查询选项
            let options = {
                include: [{
                    model: Box,
                    required: true,
                    attributes: ['box_id', 'light_id', 'region_id', 'road_id'],
                    include: [{
                        model: Road,
                        required: true,
                        attributes: ['road_name'],
                        where: {
                            region_id: parseInt(req.query.region_id)
                        },
                    }]
                }],
                order: [['time_utc', 'DESC']]
            }
            // 如果提供了限制条件，则设置查询限制
            if (req.query.limit) {
                options.limit = parseInt(req.query.limit);
            }
            // 处理查询参数中的起止时间
            if (req.query.start && req.query.end) {
                options.where = {
                    time_utc: {
                        [Op.gte]: parseInt(req.query.start),
                        [Op.lte]: parseInt(req.query.end)
                    }
                }
            }
            // 执行查询
            let box_log = await BoxLog.findAll(options);
            // 处理查询结果，格式化为需要的输出格式
            let results = box_log.map(r => {
                return {
                    box_id: r.box_id,
                    light_id: r.Box.light_id,
                    region_id: r.Box.region_id,
                    road_id: r.Box.road_id,
                    road_name: r.Road.road_name,
                    VOL: r.VOL,
                    CUR: r.CUR,
                    POW: r.POW,
                    time_utc: r.time_utc
                };
            });
            // 根据查询结果，返回相应的响应
            if (results) {
                res.json({
                    code: 200,
                    data: results
                });
            } else {
                res.json({
                    code: 400
                });
            }
        } else {
            // 区域ID无效，返回错误信息
            res.json({
                code: 400
            });
        }
    } catch (error) {
        // 捕获并记录错误，返回错误信息
        logger.error(error);
        res.json({
            code: 400
        });
    }
})
/**
 * 根据提供的box_id和查询条件，获取相应的盒子日志信息。
 * 
 * @param {Object} req - 请求对象，包含session信息、查询参数和路径参数。
 * @param {Object} res - 响应对象，用于返回处理结果。
 * @returns {Object} 返回一个包含日志数据或错误代码的JSON对象。
 */
router.get('/:box_id', authenticateToken, async (req, res) => {
    try {
        let options = {
            where: {},
            order: [
                ['time_utc', 'DESC']
            ]
        };
        // 处理查询参数中的limit
        if (req.query.limit) {
            options.limit = parseInt(req.query.limit);
        }
        // 处理查询参数中的起止时间
        if (req.query.start && req.query.end) {
            options.where = {
                time_utc: {
                    [Op.gte]: parseInt(req.query.start),
                    [Op.lte]: parseInt(req.query.end)
                }
            }
        }
        // 设置查询的box_id
        options.where.box_id = req.params.box_id;
        // 查询符合条件的日志记录
        let box_log = await BoxLog.findAll(options);
        // 处理查询结果
        if (box_log) {
            res.json({
                code: 200,
                data: box_log
            });
        } else {
            res.json({
                code: 400
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