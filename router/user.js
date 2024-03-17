// router/user.js
// User Router

import express from 'express';
import { logger } from '../app.js';
import { Users } from '../model.js';
import { md5 } from 'js-md5';

const router = express.Router();

/**
 * Code Define
 * 
 * 200: OK
 * 400: Bad Request
 * 401: Unauthorized
 */

/** Rate Router Begin **/

/**
 * @api {post} /login Login
 * @apiName Login
 * @apiGroup User
 * @apiDescription Login
 * 
 * @apiParam {String} username Username
 * @apiParam {String} password Password
 * 
 * @apiSuccess {Number} code Code
 * @apiSuccess {Object} data Data
 */
router.post('/login', async (req, res) => {
    try {
        let user = await Users.findOne({
            where: {
                username: req.body.username,
                password: md5(req.body.username + req.body.password)
            }
        });
        if (user == null) {
            res.json({
                code: 401
            });
        } else {
            req.session.user = user;
            req.session.isLogin = true;
            res.json({
                code: 200,
                data: user
            });
        };
    } catch (error) {
        logger.error('Error:', error);
        res.json({
            code: 400
        });
    };
});

/**
 * @api {get} /logout Logout
 * @apiName Logout
 * @apiGroup User
 * @apiDescription Logout
 * 
 * @apiSuccess {Number} code Code
 */
router.get('/logout', async (req, res) => {
    try {
        req.session.destroy();
        res.json({
            code: 200
        });
    } catch (error) {
        logger.error('Error:', error);
        res.json({
            code: 400
        });
    }
})

/**
 * @api {post} / Create User by Admin
 * @apiName Create User by Admin
 * @apiGroup User
 * @apiDescription Create User by Admin
 * 
 * @apiParam {String} username Username
 * @apiParam {String} password Password
 * @apiParam {Number} [role] Role
 * 
 * @apiSuccess {Number} code Code
 * @apiSuccess {Object} data Data
 */
router.post('', async (req, res) => {
    try {
        if (req.session.isLogin && req.session.user.role == 1) {
            let user = await Users.create({
                username: req.body.username,
                password: md5(req.body.username + req.body.password),
                role: req.body.role || 0
            });
            res.json({
                code: 200,
                data: user
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
})

/**
 * @api {put} / Update Password by Self
 * @apiName Update Password by Self
 * @apiGroup User
 * @apiDescription Update Password by Self
 * 
 * @apiParam {String} password Password
 * @apiParam {String} new_password New Password
 * 
 * @apiSuccess {Number} code Code
 * @apiSuccess {Object} data Data
 */
router.put('', async (req, res) => {
    try {
        if (req.session.isLogin) {
            let user = await Users.update({
                password: md5(req.session.user.username + req.body.new_password)
            }, {
                where: {
                    id: req.session.user.uid,
                    password: md5(req.session.user.username + req.body.password)
                }
            });
            res.json({
                code: 200,
                data: user
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
})

/**
 * @api {delete} / Delete User by Admin
 * @apiName Delete User by Admin
 * @apiGroup User
 * @apiDescription Delete User by Admin
 * 
 * @apiParam {Number} uid User ID
 * 
 * @apiSuccess {Number} code Code
 * @apiSuccess {Object} data Data
 */
router.delete('/:uid', async (req, res) => {
    try {
        if (req.session.isLogin && req.session.user.role == 1) {
            let user = await Users.destroy({
                where: {
                    id: req.params.uid
                }
            });
            res.json({
                code: 200,
                data: user
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
})

/** Rate Router End **/

export { router as user_router };
