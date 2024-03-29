// router/user.js
// User Router

import express from 'express';
import { logger } from '../app.js';
import { Region, Users } from '../model.js';
import { md5 } from 'js-md5';

const router = express.Router();

/**
 * Code Define
 * 
 * 200: OK
 * 400: Bad Request
 * 401: Unauthorized
 */

/** User Router Begin **/

/**
 * 处理用户登录请求
 * @param {object} req - 请求对象，包含用户登录信息
 * @param {object} res - 响应对象，用于返回登录结果
 */
router.post('/login', async (req, res) => {
    try {
        // 在用户表中查找指定用户名和经过MD5加密的密码的用户
        let user = await Users.findOne({
            attributes: ['uid', 'username', 'role'],
            where: {
                username: req.body.username,
                password: md5(req.body.username + req.body.password)
            }
        });
        // 如果未找到用户，则返回登录失败
        if (user == null) {
            res.json({
                code: 401
            });
        } else {
            // 如果找到用户，设置会话变量并返回登录成功信息
            req.session.user = user;
            req.session.isLogin = true;
            res.json({
                code: 200,
                data: user
            });
        };
    } catch (error) {
        // 捕获并记录错误，返回失败信息
        logger.error('Error:', error);
        res.json({
            code: 400
        });
    };
});

/**
 * 处理用户登出请求
 * @param {object} req - 请求对象
 * @param {object} res - 响应对象，用于返回登出结果
 */
router.get('/logout', async (req, res) => {
    try {
        // 销毁用户会话
        req.session.destroy();
        res.json({
            code: 200
        });
    } catch (error) {
        // 捕获并记录错误，返回失败信息
        logger.error('Error:', error);
        res.json({
            code: 400
        });
    }
});

/**
 * 获取所有用户信息的路由处理函数
 * 
 * @param {Object} req 请求对象，包含session信息和用户请求数据
 * @param {Object} res 响应对象，用于返回处理结果
 * @returns {Void} 不返回具体值，通过res发送json响应
 */
router.get('', async (req, res) => {
    try {
        // 检查用户是否登录且角色为1（管理员）
        if (req.session.isLogin && req.session.user.role == 1) {
            // 查询所有用户的信息，仅包含id, username, role
            let users = await Users.findAll({
                attributes: ['id', 'username', 'role']
            });
            // 返回成功响应，携带用户信息
            res.json({
                code: 200,
                data: users
            });
        } else {
            // 如果用户未登录或不是管理员角色，返回未授权响应
            res.json({
                code: 401
            });
        }
    } catch (error) {
        // 捕获并记录错误，返回通用错误响应
        logger.error('Error:', error);
        res.json({
            code: 400
        });
    }
});

/**
 * 根据用户ID获取用户信息
 * 
 * @param {Object} req 请求对象，包含用户ID和会话信息
 * @param {Object} res 响应对象，用于返回用户信息或错误信息
 * @returns {Object} 返回一个包含用户信息或错误代码的JSON对象
 */
router.get('/:uid', async (req, res) => {
    try {
        // 检查用户是否已登录
        if (req.session.isLogin) {
            // 通过用户ID查找用户信息，包括用户角色和所属区域信息
            let user = await Users.findByPk(req.params.uid, {
                attributes: ['uid', 'username', 'role'], // 选择需要返回的用户属性
                include: {
                    model: Region,
                    as: 'users_region',
                    attributes: ['region_id', 'region_name'] // 包含区域ID和区域名称
                }
            });
            // 返回成功响应，包含用户信息
            res.json({
                code: 200,
                data: user
            });
        } else {
            // 如果用户未登录，返回授权错误响应
            res.json({
                code: 401
            });
        }
    } catch (error) {
        // 捕获并记录错误
        logger.error('Error:', error);
        // 返回通用错误响应
        res.json({
            code: 400
        });
    }
});

/**
 * 处理用户注册请求
 * @param {Object} req 请求对象，包含用户提交的注册信息
 * @param {Object} res 响应对象，用于返回注册结果
 */
router.post('', async (req, res) => {
    try {
        // 检查用户是否已登录且具有管理员权限
        if (req.session.isLogin && req.session.user.role == 1) {
            // 尝试创建新用户
            let user = await Users.create({
                username: req.body.username, // 用户名
                password: md5(req.body.username + req.body.password), // 加密后的密码
                role: req.body.role || 0 // 用户角色，默认为0
            });
            // 根据用户创建结果返回相应的响应码
            if (user) {
                res.json({
                    code: 200
                });
            } else {
                res.json({
                    code: 400
                });
            }
        } else {
            // 如果用户未登录或不是管理员，则返回401状态码
            res.json({
                code: 401
            });
        }
    } catch (error) {
        // 捕获并记录错误，返回400状态码
        logger.error('Error:', error);
        res.json({
            code: 400
        });
    }
});


/**
 * 使用PUT请求更新用户密码。
 * 路由路径参数: 
 *   - uid: 用户的唯一标识符
 * 请求体参数:
 *   - new_password: 新密码
 * 响应体参数:
 *   - code: 响应代码，200表示成功，400表示失败，401表示未登录
 */
router.put('/:uid', async (req, res) => {
    try {
        // 检查用户是否已登录并且尝试更新密码的用户与当前登录用户一致
        if (req.session.isLogin && req.session.user.uid == req.params.uid) {
            // 更新密码逻辑
            let user = await Users.update({
                password: md5(req.session.user.username + req.body.new_password)
            }, {
                where: {
                    id: req.session.user.uid,
                    password: md5(req.session.user.username + req.body.password)
                }
            });
            // 根据更新结果返回相应的响应代码
            if (user) {
                res.json({
                    code: 200
                });
            } else {
                res.json({
                    code: 400
                });
            }
        } else {
            // 如果用户未登录，返回401未授权响应
            res.json({
                code: 401
            });
        }
    } catch (error) {
        // 捕获异常，并返回失败响应代码
        logger.error('Error:', error);
        res.json({
            code: 400
        });
    }
});


/**
 * 使用DELETE请求删除指定用户
 * 路径参数:
 *   :uid - 需要删除的用户的ID
 * 请求头:
 *   无特殊请求头
 * 返回值:
 *   当用户成功删除时，返回一个包含状态码200的JSON对象；
 *   当用户未登录或权限不足时，返回一个包含状态码401的JSON对象；
 *   当删除操作遇到错误时，返回一个包含状态码400的JSON对象。
 */
router.delete('/:uid', async (req, res) => {
    try {
        // 检查用户是否已登录且具有管理员权限
        if (req.session.isLogin && req.session.user.role == 1) {
            // 根据提供的UID删除用户
            let user = await Users.destroy({
                where: {
                    uid: req.params.uid
                }
            });
            if (user) {
                // 删除成功
                res.json({
                    code: 200
                });
            } else {
                // 删除失败
                res.json({
                    code: 400
                });
            }
        } else {
            // 用户未登录或权限不足，返回401状态码
            res.json({
                code: 401
            });
        }
    } catch (error) {
        // 捕获并记录删除操作中的错误
        logger.error('Error:', error);
        // 删除操作失败，返回400状态码
        res.json({
            code: 400
        });
    }
});

/** User Router End **/

export { router as user_router };
