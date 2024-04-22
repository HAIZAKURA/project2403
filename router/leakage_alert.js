// router/leakage_alert.js
// Leakage Alert Router

import express from 'express';
import { logger } from '../app.js';
import { LeakageAlert, Box, Road } from '../model.js';
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

/** Leakage Alert Router Begin **/

/**
 * 处理GET请求，根据提供的区域ID、时间范围和查询限制，查询指定区域内的路灯泄漏报警信息。
 * 
 * @param {object} req 请求对象，包含session信息、查询参数。
 * @query {number} region_id 区域ID
 * @param {object} res 响应对象，用于返回查询结果或错误信息。
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
            let leakage_alert = await LeakageAlert.findAll(options);
            // 格式化查询结果
            let results = leakage_alert.map(r => {
                return {
                    leakage_id: r.leakage_id,
                    light_id: r.Box.light_id,
                    region_id: r.Box.region_id,
                    road_id: r.Box.road_id,
                    road_name: r.Box.Road.road_name,
                    alert_type: r.alert_type,
                    alert_content: r.alert_content,
                    time_utc: r.time_utc,
                }
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
});

/**
 * 处理GET请求，根据提供的leakage_id以及可选的查询参数来查询泄漏警报信息。
 * 
 * @param {object} req - 请求对象，包含URL参数、查询参数和会话信息。
 * @param {object} res - 响应对象，用于返回处理结果。
 * 
 * 返回值：无，通过res.json发送JSON格式的响应。
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

        let leakage_alert = await LeakageAlert.findAll(options);

        if (leakage_alert) {
            // 查询成功
            res.json({
                code: 200,
                data: leakage_alert
            });
        } else {
            // 查询失败
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
});

/** Leakage Alert Router End **/

export { router as leakage_alert_router };
