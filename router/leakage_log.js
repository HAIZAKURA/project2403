// router/leakage_log.js
// Leakage Log Router

import express from 'express';
import { logger } from '../app.js';
import { LeakageLog, Box, Road } from '../model.js';
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

/** Leakage Log Router Begin **/

/**
 * 处理GET请求，用于查询指定区域ID的相关数据。
 * 
 * @param {object} req 请求对象，包含session信息、查询参数。
 * @query {number} region_id 区域ID
 * @param {object} res 响应对象，用于返回查询结果。
 * @returns {object} 返回包含查询结果或错误信息的JSON对象。
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
            // 如果提供了查询限制，则设置查询限制
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
            // 执行数据库查询
            let leakage_log = await LeakageLog.findAll(options);
            // 格式化查询结果
            let results = leakage_log.map(r => {
                return {
                    leakage_id: r.leakage_id,
                    box_id: r.Box.box_id,
                    light_id: r.Box.light_id,
                    region_id: r.Box.region_id,
                    road_id: r.Box.road_id,
                    road_name: r.Road.road_name,
                    V: r.V,
                    I: r.I,
                    R: r.R,
                    time_utc: r.time_utc
                }
            })
            // 根据查询结果，返回相应的响应
            if (leakage_log) {
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
 * 根据给定的leakage_id和其他查询参数，获取相应的日志记录。
 * 
 * @param {Object} req - 请求对象，包含路径参数、查询参数和会话信息。
 * @param {Object} res - 响应对象，用于返回处理结果。
 * @returns {Object} 返回一个包含日志数据或错误代码的JSON对象。
 */
router.get('/:leakage_id', authenticateToken, async (req, res) => {
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

        // 设置查询的leakage_id
        options.where.leakage_id = req.params.leakage_id;

        // 执行日志查询
        let leakage_log = await LeakageLog.findAll(options);

        // 根据查询结果返回相应响应
        if (leakage_log) {
            res.json({
                code: 200,
                data: leakage_log // 修改此处，正确返回查询结果
            });
        } else {
            res.json({
                code: 400
            });
        }
    } catch (error) {
        logger.error(error);
        // 捕获异常并返回错误代码
        res.json({
            code: 400
        });
    }
})

/** Leakage Log Router End **/

export { router as leakage_log_router };