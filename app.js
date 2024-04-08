// app.js
// Service Application

import bodyParser from 'body-parser';
import express from 'express';
import log4js from 'log4js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import cors from 'cors';

/**
 * 初始化 Express 应用
 */
const app = express();

/**
 * 设置服务器端口，优先使用环境变量定义的 SERVER_HOST，若未定义则默认使用 3010
 */
const port = process.env.SERVER_HOST || 3010;

/**
 * 获取当前文件所在的目录路径
 */
const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * 初始化 log4js 日志记录器
 */
const logger = log4js.getLogger();

/**
 * 设置日志记录级别为 'info'
 */
logger.level = 'info';
logger.info('Starting service...');

// 使用log4js中间件记录HTTP请求日志
app.use(log4js.connectLogger(
    logger, 
    {
        level: 'auto', // 自动调整日志级别
        format: ':remote-addr ":method :url" :status ":user-agent"' // 定义日志格式
    }
));

// 使用bodyParser中间件解析JSON格式的请求体
app.use(bodyParser.json());

// 使用bodyParser中间件解析URL编码的请求体
app.use(bodyParser.urlencoded({ extended: false }));

// 设置跨域访问控制，允许所有来源
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "*");
    next();
});

app.use(cors({
    origin: true,
    credentials: true
}));

// 使用express.static中间件提供静态文件服务
app.use(express.static(join(__dirname, "public")));

// 使用session中间件管理会话
let session_secret = Math.random().toString(36).substring(2);
app.use(session({
    secret: session_secret, // 会话密钥
    resave: false, // 不强制保存已初始化的会话
    saveUninitialized: true, // 自动初始化会话
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 } // cookie有效期为一周
}));

/**
 * 导出logger对象或函数，用于日志记录。
 * 该logger可能具有多个级别（如：info, warn, error等），
 * 并且可能支持将日志输出到不同的目的地（如：控制台、文件、服务器等）。
 * 
 * @export {Object|Function} logger - 日志记录器对象或函数。
 */
export { logger };

// 导入MQTT客户端
import { client } from './mqtt.js';

/** Router Begin **/

/**
 * Code Define
 * 
 * 200: OK
 * 400: Bad Request
 * 502: Bad Gateway
 */

/** User Router **/
import { user_router } from './router/user.js';
app.use('/api/user', user_router);

/** Setting Router **/
import { setting_router } from './router/setting.js';
app.use('/api/setting', setting_router);

/** Region Router **/
import { region_router } from './router/region.js';
app.use('/api/region', region_router);

/** User Region Router **/
import { user_region_router } from './router/user_region.js';
app.use('/api/user_region', user_region_router);

/** Road Router **/
import { road_router } from './router/road.js';
app.use('/api/road', road_router);

/** Box Router **/
import { box_router } from './router/box.js';
app.use('/api/box', box_router);

/** Box State Router **/
import { box_state_router } from './router/box_state.js';
app.use('/api/box_state', box_state_router);

/** Box Log Router **/
import { box_log_router } from './router/box_log.js';
app.use('/api/box_log', box_log_router);

/** Box Alert Router **/
import { box_alert_router } from './router/box_alert.js';
app.use('/api/box_alert', box_alert_router);

/** Leakage Log Router **/
import { leakage_log_router } from './router/leakage_log.js';
app.use('/api/leakage_log', leakage_log_router);

/** Leakage Alert Router **/
import { leakage_alert_router } from './router/leakage_alert.js';
app.use('/api/leakage_alert', leakage_alert_router);

/** Robots.txt **/
app.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.send("User-agent: *\nDisallow: /");
});

/** Router End **/

// Express API Start
app.listen(port, () => {
    logger.info(`The Service is listening on port ${port}.`);
});
