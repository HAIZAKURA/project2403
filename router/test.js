import express from 'express';
import { Box, BoxAlert, LeakageAlert, Region, Road, Users } from '../model.js';

const router = express.Router();

router.get('/a', async (req, res) => {
    try {

        let regions = await Region.findAll({
            include: [{
                model: Users,
                required: true,
                where: {
                    uid: 2
                }
            }]
        });

        let regionIds = regions.map(r => r.region_id);

        let boxes = await Box.findAll({
            where: { region_id: regionIds },
            include: [{
                model: Road,
                required: true,
                include: [{
                    model: Region,
                    required: true
                }]
            }]
        });

        let boxIds = boxes.map(b => b.box_id);

        let alerts = await BoxAlert.findAll({
            where: { box_id: boxIds },
            order: [['time_utc', 'DESC']],
            limit: 2,
            include: [{
                model: Box,
                required: true,
                attributes: ['box_id', 'light_id'],
                include: [{
                    model: Road,
                    required: true,
                    attributes: ['road_id', 'road_name'],
                    include: [{
                        model: Region,
                        required: true
                    }]
                }]
            }]
        });

        let results = alerts.map(alert => {
            return {
                box_id: alert.Box.box_id,
                light_id: alert.Box.light_id,
                alert_device: alert.alert_device,
                alert_type: alert.alert_type,
                alert_content: alert.alert_content,
                time_utc: alert.time_utc,
                region_id:alert.Box.Road.Region.region_id,
                region_name: alert.Box.Road.Region.region_name,
                road_id: alert.Box.Road.road_id,
                road_name: alert.Box.Road.road_name
            }
        })

        res.json({
            code: 200,
            data: results
        });
    } catch (error) {
        res.json({
            code: 500,
            message: error.message
        })
    }
})

router.get('/b', async (req, res) => {
    try {

        let regions = await Region.findAll({
            include: [{
                model: Users,
                required: true,
                where: {
                    uid: 2
                }
            }]
        });

        let regionIds = regions.map(r => r.region_id);

        let boxes = await Box.findAll({
            where: { region_id: regionIds },
            include: [{
                model: Road,
                required: true,
                include: [{
                    model: Region,
                    required: true
                }]
            }]
        });

        let leakageIds = boxes.map(b => b.leakage_id);

        let alerts = await LeakageAlert.findAll({
            where: { leakage_id: leakageIds },
            order: [['time_utc', 'DESC']],
            limit: 2,
            include: [{
                model: Box,
                required: true,
                attributes: ['leakage_id', 'light_id'],
                include: [{
                    model: Road,
                    required: true,
                    attributes: ['road_id', 'road_name'],
                    include: [{
                        model: Region,
                        required: true
                    }]
                }]
            }]
        });

        let results = alerts.map(alert => {
            return {
                leakage_id: alert.Box.leakage_id,
                light_id: alert.Box.light_id,
                alert_type: alert.alert_type,
                alert_content: alert.alert_content,
                time_utc: alert.time_utc,
                region_id:alert.Box.Road.Region.region_id,
                region_name: alert.Box.Road.Region.region_name,
                road_id: alert.Box.Road.road_id,
                road_name: alert.Box.Road.road_name
            }
        })

        res.json({
            code: 200,
            data: alerts
        });
    } catch (error) {
        res.json({
            code: 500,
            message: error.message
        })
    }
})

export { router as test_router };