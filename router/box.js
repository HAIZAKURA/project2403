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

router.get('', async (req, res) => {
    try {
        if (req.session.isLogin) {
            let where_clause = {};
            if (req.query.region_id) {
                where_clause.region_id = req.query.region_id;
            }
            if (req.query.road_id) {
                where_clause.road_id = req.query.road_id;
            }
            let box = await Box.findAll({
                where: where_clause,
                attributes: ['box_id', 'leakage_id', 'light_id', 'latitude', 'longitude', 'region_id', 'road_id']
            });
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
            res.json({
                code: 401
            });
        }
    } catch (error) {
        logger.error('Error:', error);
        res.json({
            code: 400
        });
    }
});

router.get('/:box_id', async (req, res) => {
    try {
        if (req.session.isLogin) {
            let box = await Box.findByPk(req.params.box_id);
            res.json({
                code: 200,
                data: box
            });
        } else {
            res.json({
                code: 401
            });
        }
    } catch (error) {
        logger.error('Error:', error);
        res.json({
            code: 400
        });
    }
});

/** Box Router End **/

export { router as box_router };
