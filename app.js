// app.js
// Service Application

import bodyParser from 'body-parser';
import express from 'express';
import log4js from 'log4js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import mqtt from "mqtt";

/**
 * 初始化 Express 应用
 * @returns {express.Application} 返回一个配置好的 Express 应用实例
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
 * @returns {Logger} 返回一个配置好的日志记录器实例
 */
const logger = log4js.getLogger();

/**
 * 设置日志记录级别为 'info'
 */
logger.level = 'info';

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

// 设置跨域访问控制，允许所有来源的GET和POST请求
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "*");
    next();
});

// 使用express.static中间件提供静态文件服务
app.use(express.static(join(__dirname, "public")));

// 使用session中间件管理会话
app.use(session({
    secret: "5df3f0e886180b812cee3a92915b26d8", // 会话密钥
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

/** Robots.txt **/
app.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.send("User-agent: *\nDisallow: /");
    return;
});

/** Router End **/

// Express API Start
app.listen(port, () => {
    logger.info('Service Starting...');
    logger.info(`The Service is listening on port ${port}.`);
});

/** MQTT2MySQL Begin **/

// MQTT连接建立
const clientId = "mysql_adapter_" + Math.random().toString(16).substring(2, 8);
const client = mqtt.connect("mqtt://sh.nya.run", {
    clientId
});

// MQTT订阅主题
const topic = ["device_report", "cloud/#"];
const qos = 2
client.subscribe(topic, { qos }, (err) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log("Subscribed to topic " + topic);
})

async function insert_into_box_log(data) {
    
}

// 异步将数据插入到泄漏日志中
import { LeakageLog } from './model.js';
async function insert_into_leakage_log(data) {
    try {
        // 使用LeakageLog模型创建一个新的日志条目并插入到数据库中
        await LeakageLog.create({
            leakage_id: data.id,
            msg_id: data.msg_id,
            time_utc: data.param.time_utc,
            V: data.param.V,
            I: data.param.I,
            R: data.param.R
        });
    } catch (err) {
        // 如果插入过程中出现错误，将错误记录到日志中
        logger.error(err);
    }
}

async function insert_into_box_alert(data) {
    
}

async function insert_into_leakage_alert(data) {
    
}

// MQTT消息处理
client.on("message", (topic, message) => {
    if (topic == "device_report") {
        let payload = JSON.parse(message.toString()).leakage;
        insert_into_leakage_log(payload);
    }
});

/** MQTT2MySQL End **/
