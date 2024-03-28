import mqtt from "mqtt";
import { Box, BoxLog, BoxState, LeakageLog, LeakageAlert, Setting, BoxAlert } from './model.js';
import { logger } from "./app.js";
import crc16 from 'node-crc16';

/** MQTT2MySQL Begin **/

// MQTT连接建立
const mqtt_host = process.env.MQTT_HOST || "mqtt://sh.nya.run";
const mqtt_port = process.env.MQTT_PORT || 38883;
const connectUrl = `${mqtt_host}:${mqtt_port}`
const clientId = "mysql_adapter_" + Math.random().toString(16).substring(2, 8);
const client = mqtt.connect(connectUrl, {
    clientId
});

// MQTT连接建立成功
client.on("connect", () => {
    logger.info("MQTT connected");
});

// MQTT订阅主题
const topic = ["device_report", "/a13jYFS3MfN/+/user/update"];
const qos = 2
client.subscribe(topic, { qos }, (err) => {
    if (err) {
        logger.error(err);
        return;
    }
    logger.info("Subscribed to topic " + topic);
})

/** ============================================== **/
/** ================以下漏电保护部分================= **/
/** ============================================== **/

// 漏电保护设备电压上限
let leakage_limit_vol = 0;

// 漏电保护设备电流上线
let leakage_limit_cur = 0;

// 漏电保护设备电阻上限
let leakage_limit_res = 60;

/**
 * Subscribe
 * 异步插入漏电保护设备日志到数据库
 * @param {Object} data - 要插入的日志数据对象
 * @param {number} data.id - 泄漏事件的唯一标识符
 * @param {string} data.msg_id - 消息的唯一标识符
 * @param {Object} data.param - 包含泄漏事件的参数对象
 * @param {number} data.param.time_utc - 泄漏事件发生的时间（UTC）
 * @param {number} data.param.V - 泄漏事件时的电压
 * @param {number} data.param.I - 泄漏事件时的电流
 * @param {number} data.param.R - 泄漏事件时的电阻
 * @returns {void} - 不返回任何内容
 */
async function leakage_insert_log(data) {
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
        // 电流大于限值
        if (data.param.I > leakage_limit_cur) {
            leakage_insert_alert(data, 1);
        }
        // 电压大于限值
        if (data.param.V > leakage_limit_vol) {
            leakage_insert_alert(data, 2);
        }
        // 电阻大于限值
        if (data.param.R > leakage_limit_res) {
            leakage_insert_alert(data, 4);
        }
    } catch (err) {
        // 如果插入过程中出现错误，将错误记录到日志中
        logger.error(err);
    }
}

/**
 * 记录漏电保护警报
 * 
 * @param {Object} data 包含警报数据的对象，应包含id、param和time_utc字段
 * @param {number} type 警报的类型，决定从data中提取哪个参数进行插入
 * @returns {undefined} 函数没有返回值
 */
async function leakage_insert_alert(data, type) {
    let alert_content = 0;
    // 根据type选择合适的alert_content
    if (type == 1) {
        alert_content = data.param.I;
    } else if (type == 2) {
        alert_content = data.param.V;
    } else if (type == 3 || type == 4) {
        alert_content = data.param.R;
    } else {
        logger.error("Unknown alert type: " + type); // 处理未知警报类型
        return;
    }
    try {
        // 尝试创建一个新的警报记录
        await LeakageAlert.create({
            leakage_id: data.id,
            alert_type: type,
            alert_content: alert_content,
            time_utc: data.param.time_utc
        })
    } catch (err) {
        logger.error(err); // 捕获并记录创建过程中可能出现的错误
    }
}

/**
 * Subscribe
 * 设置漏电保护设备参数
 * @param {string} id 漏电保护设备ID
 * @param {number} measure_ground_res_time 测量接地电阻的时间
 * @param {number} mqtt_upload_time MQTT消息上传时间
 * @param {number} ground_res_correction 接地电阻修正值
 * @returns {boolean} 成功发布消息返回true，否则返回false
 */
async function set_leakage(id, measure_ground_res_time, mqtt_upload_time, ground_res_correction) {
    // 检查ID是否为非空字符串
    if (typeof id !== 'string' || id.trim() === '') {
        logger.error("Light On: Invalid ID provided.", id);
        return false;
    }
    let data = {
        "leakage": {
            "msg_id": 0,
            "msg_code": 0,
        }
    };
    // 根据条件添加测量接地电阻时间和MQTT上传时间到data对象
    if (typeof measure_ground_res_time == 'number' || measure_ground_res_time >= 0) {
        data.leakage.measure_ground_res_time = measure_ground_res_time;
    }
    if (typeof mqtt_upload_time == 'number' || mqtt_upload_time >= 0) {
        data.leakage.mqtt_upload_time = mqtt_upload_time;
    }
    if (typeof ground_res_correction == 'number') {
        data.leakage.ground_res_correction = ground_res_correction;
    }
    try {
        let topic = "cloud/" + id;
        // 尝试将数据发布到指定的MQTT主题
        await client.publishAsync(topic, data, { qos: 2 });
        return true; // 消息发布成功
    } catch(err) {
        logger.error(err); // 记录发布的异常错误
        return false; // 发布失败
    }
}

/**
 * Publish
 * 测量漏电保护设备接地电阻
 * @param {string} id 漏电保护设备ID
 * @returns {boolean} 如果消息发布成功返回true，否则返回false。
 */
async function measure_res(id) {
    // 检查ID是否为非空字符串
    if (typeof id !== 'string' || id.trim() === '') {
        logger.error("Light On: Invalid ID provided.", id);
        return false;
    }
    try {
        let topic = "cloud/" + id;
        let data = {
            "leakage": {
                "get_ground_res": 1
            }
        };
        // 尝试将数据发布到指定的MQTT主题
        await client.publishAsync(topic, data, { qos: 2 });
        return true; // 消息发布成功
    } catch(err) {
        logger.error(err); // 记录发布的异常错误
        return false; // 发布失败
    }
}

/** ============================================== **/
/** ==================以下云盒部分================== **/
/** ============================================== **/


// 辅助函数：将数字转换为两位的十六进制字符串
function padToTwoDigits(value) {
    return value.toString(16).padStart(2, '0').toUpperCase();
}

// 辅助函数：将数字转换为四位的十六进制字符串
function padToFourDigits(value) {
    return value.toString(16).padStart(4, '0').toUpperCase();
}

/**
 * Publish
 * 打开指定ID的灯
 * @param {string} id 设备ID
 * @param {number} brightness 亮度，0-100
 * @returns {boolean} - 如果消息成功发布，则返回true；否则返回false。
 */
async function light_on(id, brightness) {
    // 检查ID是否有效
    if (typeof id !== 'string' || id.trim() === '') {
        logger.error("Light On: Invalid ID provided.", id);
        return false;
    }
    // 检查亮度是否有效
    if (typeof brightness !== 'number' || brightness < 0 || brightness > 100) {
        brightness = 100;
    }
    try {
        // 构造MQTT消息的主题
        let topic = "/a13jYFS3MfN/" + id.toUpperCase() + "/user/get";
        // 构造亮度字符串
        let brightnessStr = padToTwoDigits(brightness);
        // 构造控制灯的命令字符串
        let cmdStr = "AA00" + id.toUpperCase() + "A104010101" + brightnessStr;
        // 计算命令字符串的校验和
        let sum = crc16.checkSum(cmdStr);
        // 将命令字符串和校验和转换为Buffer格式，以供发送
        let cmd = Buffer.from(cmdStr + sum, "hex");
        // 尝试发布消息到MQTT主题
        await client.publishAsync(topic, cmd, { qos: 2 });
        return true; // 消息发布成功
    } catch (err) {
        logger.error(err); // 捕获异常并记录错误
        return false; // 异常发生，消息发布失败
    }
}

/**
 * Publish
 * 关闭指定ID的灯
 * @param {string} id 设备ID
 * @returns {boolean} 如果消息成功发布，则返回true；否则返回false。
 */
async function light_off(id) {
    // 检查ID是否有效
    if (typeof id !== 'string' || id.trim() === '') {
        logger.error("Light Off: Invalid ID provided.", id);
        return false;
    }
    // 构造MQTT消息的主题
    let topic = "/a13jYFS3MfN/" + id.toUpperCase() + "/user/get";
    // 构造控制灯的命令字符串
    let cmdStr = "AA00" + id.toUpperCase() + "A10401010000";
    // 计算命令字符串的校验和
    let sum = crc16.checkSum(cmdStr);
    // 将命令字符串和校验和转换为Buffer格式，以供发送
    let cmd = Buffer.from(cmdStr + sum, "hex");
    try {
        // 尝试发布消息到MQTT主题
        await client.publishAsync(topic, cmd, { qos: 2 });
        return true; // 消息发布成功
    } catch (err) {
        logger.error(err); // 捕获异常并记录错误
        return false; // 异常发生，消息发布失败
    }
}

/**
 * Publish
 * 设置时间策略
 * @param {string} id 设备ID
 * @param {object} data 包含设置时间所需的数据对象
 * @returns {boolean} 成功发布消息到MQTT主题返回true，否则返回false
 */
async function light_set_time(id, data) {
    // 检查ID是否有效
    if (typeof id !== 'string' || id.trim() === '') {
        logger.error("Light Set Time: Invalid ID provided.", id);
        return false;
    }
    // 检查时间设置数据是否有效
    if (typeof data !== 'object' || data === null) {
        logger.error("Light Set Time: Invalid data provided.", data);
        return false;
    }
    // 构建MQTT消息的主题
    let topic = "/a13jYFS3MfN/" + id.toUpperCase() + "/user/get";
    // 将小时、分钟和设置的数据转换为16进制字符串，并确保它们是两位数
    let hour = padToTwoDigits(data.hour);
    let minute = padToTwoDigits(data.minute);
    let s1_t = padToFourDigits(data.s1.t);
    let s1_b = padToTwoDigits(data.s1.b);
    let s2_t = padToFourDigits(data.s2.t);
    let s2_b = padToTwoDigits(data.s2.b);
    let s3_t = padToFourDigits(data.s3.t);
    let s3_b = padToTwoDigits(data.s3.b);
    let s4_t = padToFourDigits(data.s4.t);
    let s4_b = padToTwoDigits(data.s4.b);
    // 构造控制灯的命令字符串
    let cmdStr = "AA00" + id.toUpperCase() + + "A2100101" + hour + minute + s1_t + s1_b + s2_t + s2_b + s3_t + s3_b + s4_t + s4_b;
    // 计算命令字符串的校验和
    let sum = crc16.checkSum(cmdStr);
    // 将命令字符串和校验和转换为Buffer，以便发送
    let cmd = Buffer.from(cmdStr + sum, "hex");
    try {
        // 尝试通过MQTT发布消息
        await client.publishAsync(topic, cmd, { qos: 2 });
        return true; // 消息发布成功
    } catch (err) {
        logger.error(err); // 记录异常和错误
        return false; // 消息发布失败
    }
}

/**
 * Publish
 * 查询时间策略
 * @param {string} id 设备ID
 * @returns {boolean} 如果消息发布成功返回true，否则返回false
 */
async function light_query_time(id) {
    // 检查ID是否有效
    if (typeof id !== 'string' || id.trim() === '') {
        logger.error("Light Query Time: Invalid ID provided.", id);
        return false;
    }
    // 构造MQTT消息的主题
    let topic = "/a13jYFS3MfN/" + id.toUpperCase() + "/user/get";
    // 构造控制灯的命令字符串
    let cmdStr = "AA00" + id.toUpperCase() + "A300";
    // 计算命令字符串的校验和
    let sum = crc16.checkSum(cmdStr);
    // 将命令字符串和校验和转换为Buffer，以便发送
    let cmd = Buffer.from(cmdStr + sum, "hex");
    try {
        // 尝试通过MQTT发布消息
        await client.publishAsync(topic, cmd, { qos: 2 });
        return true; // 消息发布成功
    } catch (err) {
        logger.error(err); // 记录异常和错误
        return false; // 消息发布失败
    }
}

/**
 * Subscribe
 * 更新时间策略
 * @param {string} id 设备ID
 * @param {Array} data 包含灯光设置数据的数组，每个元素都是一个16进制字符串
 * @returns {Promise<void>} 不返回任何内容
 */
async function light_update_time(id, data) {
    // 将传入的16进制字符串数组转换为对应的整数，用于设置时间策略参数
    let hour = parseInt(data[0], 16);
    let minute = parseInt(data[1], 16);
    let s1_t = parseInt(data[2], 16);
    let s1_b = parseInt(data[3], 16);
    let s2_t = parseInt(data[4], 16);
    let s2_b = parseInt(data[5], 16);
    let s3_t = parseInt(data[6], 16);
    let s3_b = parseInt(data[7], 16);
    let s4_t = parseInt(data[8], 16);
    let s4_b = parseInt(data[9], 16);
    
    try {
        // 使用await关键字暂停执行，直到数据库更新完成。尝试更新指定时间策略
        await Box.update({
                t_hour: hour,
                t_minute: minute,
                s1_t: s1_t,
                s1_b: s1_b,
                s2_t: s2_t,
                s2_b: s2_b,
                s3_t: s3_t,
                s3_b: s3_b,
                s4_t: s4_t,
                s4_b: s4_b
            }, {
                where: {
                    box_id: id
                }
        });
    } catch (err) {
        // 如果在更新过程中出现错误，将错误记录到日志中
        logger.error(err);
    }
}

/**
 * Publish
 * 查询 电压 电流 电量值
 * @param {string} id 设备ID
 * @returns {boolean} 如果消息发布成功则返回true，否则返回false
 */
async function light_query_power(id) {
    // 检查ID是否有效
    if (typeof id !== 'string' || id.trim() === '') {
        logger.error("Light Query Time: Invalid ID provided.", id);
        return false;
    }

    // 构造MQTT消息的主题
    let topic = "/a13jYFS3MfN/" + id.toUpperCase() + "/user/get";

    // 构造控制灯的命令字符串
    let cmdStr = "AA00" + id.toUpperCase() + "A400";

    // 计算命令字符串的校验和
    let sum = crc16.checkSum(cmdStr);

    // 将命令字符串和校验和转换为Buffer，以便发送
    let cmd = Buffer.from(cmdStr + sum, "hex");

    try {
        // 尝试通过MQTT发布消息
        await client.publishAsync(topic, cmd, { qos: 2 });
        return true; // 消息发布成功
    } catch (err) {
        logger.error(err); // 记录异常和错误
        return false; // 消息发布失败
    }
}

/**
 * Subscribe
 * 记录 电压 电流 电量值
 * @param {string} id 设备ID
 * @param {Array} data 包含电压、电流和电量值的数组，每个元素以十六进制字符串形式表示
 * @returns {Promise<void>} 不返回任何内容
 */
async function light_insert_power(id, data) {
    // 将数据从十六进制字符串转换为数值
    let vol = parseInt(data[0], 16);
    let cur = parseInt(data[1], 16);
    let pow = parseInt(data[2], 16) * 0.01;
    // 获取当前时间的UTC时间戳
    let time_utc = Math.floor(Date.now() / 1000);
    try {
        // 尝试在数据库中创建并插入一个新的日志条目
        await BoxLog.create({
            box_id: id,
            VOL: vol,
            CUR: cur,
            POW: pow,
            time_utc: time_utc
        });
    } catch (err) {
        // 如果遇到错误，将错误信息记录到日志中
        logger.error(err);
    }
}

/**
 * Subscribe
 * 更新设备状态
 * @param {string} id 设备ID
 * @param {Array} data 包含状态和亮度的数组，其中第一个元素是状态值，第二个元素是亮度值，都以16进制字符串形式提供
 * @returns {void} 不返回任何内容
 */
async function light_update_state(id, data) {
    // 将数据数组的第一个元素解析为状态整数，第二个元素解析为亮度整数
    let state = parseInt(data[0], 16);
    let brightness = parseInt(data[1], 16);
    try {
        // 尝试通过BoxState模型，更新或插入灯光的状态和亮度信息
        await BoxState.upsert({
            box_id: id,
            state: state,
            brightness: brightness
        });
    } catch (err) {
        // 如果遇到错误，将错误记录到日志中
        logger.error(err);
    }
}

/**
 * Publish
 * 查询设备状态
 * @param {string} id 设备ID
 * @returns {boolean} 如果消息成功发布，则返回true；否则返回false
 */
async function light_query_state(id) {
    // 检查ID是否有效
    if (typeof id !== 'string' || id.trim() === '') {
        logger.error("Light Query Time: Invalid ID provided.", id);
        return false;
    }
    // 构造MQTT消息的主题
    let topic = "/a13jYFS3MfN/" + id.toUpperCase() + "/user/get";
    // 构造控制灯的命令字符串
    let cmdStr = "AA00" + id.toUpperCase() + "A900";
    // 计算命令字符串的校验和
    let sum = crc16.checkSum(cmdStr);
    // 将命令字符串和校验和转换为Buffer，以便发送
    let cmd = Buffer.from(cmdStr + sum, "hex");
    try {
        // 尝试通过MQTT发布消息
        await client.publishAsync(topic, cmd, { qos: 2 });
        return true;
    } catch (err) {
        logger.error(err);
        return false;
    }
}

/**
 * 处理设备故障报警
 * @param {string} id 设备ID
 * @param {Array} data 警报数据数组 [报警设备, 报警内容]
 * 根据设备类型和警报类型从数据库中查找最新记录 并根据找到的记录创建警报
 * 然后构造MQTT消息
 * 该函数没有返回值
 */
async function light_handle_alert(id ,data) {
    setTimeout(() => {
        let alert_device = data[0]; // 设备类型
        let alert_type = data[1]; // 警报类型
        let alert_content = ''; // 警报内容初始化
        // 查找最新的日志记录
        BoxLog.findOne({
            where: {
                box_id: id
            },
            order: [['time_utc', 'DESC']]
        }).then(box_log => {
            if (box_log) {
                // 处理特定设备类型的警报
                if (alert_device == '05' || alert_device == '06') {
                    // 根据警报类型设置警报内容
                    if (alert_type == '02') {
                        // 电压警报
                        alert_content = box_log.VOL;
                    } else if (alert_type == '04') {
                        // 电流警报
                        alert_content = box_log.CUR;
                    }
                }
                // 在数据库中创建新的警报记录
                BoxAlert.create({
                    box_id: id,
                    alert_device: alert_device,
                    alert_type: alert_type,
                    alert_content: alert_content,
                    time_utc: box_log.time_utc
                }).then(() => {
                    // 构造MQTT消息的主题
                    let topic = "/a13jYFS3MfN/" + id.toUpperCase() + "/user/get";
                    // 构造控制灯的命令字符串
                    let cmdStr = "AA00" + id.toUpperCase() + "BA00";
                    // 计算命令字符串的校验和
                    let sum = crc16.checkSum(cmdStr);
                    // 将命令字符串和校验和转换为Buffer，以便发送
                    let cmd = Buffer.from(cmdStr + sum, "hex");
                    try {
                        // 尝试通过MQTT发布消息
                        client.publishAsync(topic, cmd, { qos: 2 });
                    } catch (err) {
                        logger.error(err);   
                    }
                });
            } else {
                // 如果没有找到日志记录，记录错误
                logger.error('No box log found');
            }
        });
    }, 2000); // 延迟3秒执行
}

// MQTT消息处理
client.on("message", (topic, message) => {
    if (topic == "device_report") {
        let payload = JSON.parse(message.toString()).leakage;
        leakage_insert_log(payload);
    } else if (topic.startsWith("/a13jYFS3MfN/")) {
        let id = topic.split("/")[2];
        let op = topic.split("/")[4];
        if (op == "update") {
            let msg = message.toString("hex").toUpperCase();
            let cmd_op = msg.substring(16, 18);
            // console.log(msg);
            // console.log(cmd_op);
            let data = new Array();
            switch (cmd_op)
            {
                case "01": // 定时心跳
                    data.push(msg.substring(26, 28)); // 灯状态
                    data.push(msg.substring(28, 30)); // 灯亮度
                    light_update_state(id, data);                
                    break;
                case "B1": // 开关灯
                    data.push(msg.substring(26, 28)); // 灯状态
                    data.push(msg.substring(28, 30)); // 灯亮度
                    light_update_state(id, data);
                    break;
                case "B2": // 设置时间策略成功
                    data.push(msg.substring(24, 26)); // 开始小时
                    data.push(msg.substring(26, 28)); // 开始分钟
                    data.push(msg.substring(28, 32)); // 第一阶段分钟
                    data.push(msg.substring(32, 34)); // 第一阶段亮度
                    data.push(msg.substring(34, 38)); // 第二阶段分钟
                    data.push(msg.substring(38, 40)); // 第二阶段亮度
                    data.push(msg.substring(40, 44)); // 第三阶段分钟
                    data.push(msg.substring(44, 46)); // 第三阶段亮度
                    data.push(msg.substring(46, 50)); // 第四阶段分钟
                    data.push(msg.substring(50, 52)); // 第四阶段亮度
                    light_update_time(id, data);
                    break;
                case "B3": // 返回时间策略
                    data.push(msg.substring(24, 26)); // 开始小时
                    data.push(msg.substring(26, 28)); // 开始分钟
                    data.push(msg.substring(28, 32)); // 第一阶段分钟
                    data.push(msg.substring(32, 34)); // 第一阶段亮度
                    data.push(msg.substring(34, 38)); // 第二阶段分钟
                    data.push(msg.substring(38, 40)); // 第二阶段亮度
                    data.push(msg.substring(40, 44)); // 第三阶段分钟
                    data.push(msg.substring(44, 46)); // 第三阶段亮度
                    data.push(msg.substring(46, 50)); // 第四阶段分钟
                    data.push(msg.substring(50, 52)); // 第四阶段亮度
                    light_update_time(id, data);
                    break;
                case "B4": // 返回 电压 电流 用电量
                    data.push(msg.substring(24, 32)); // 电压
                    data.push(msg.substring(32, 40)); // 电流
                    data.push(msg.substring(40, 48)); // 用电量
                    light_insert_power(id, data);
                    break;
                case "B9": // 查询灯状态
                    data.push(msg.substring(26, 28)); // 灯状态
                    data.push(msg.substring(28, 30)); // 灯亮度
                    light_update_state(id, data); 
                    break;
                case "AA": // 设备故障报警
                    data.push(msg.substring(26, 28)); // 故障设备
                    data.push(msg.substring(28, 30)); // 故障内容
                    light_handle_alert(id, data);
                    break;
                case "BA": // 报警成功
                    break;
            }
            data = [];
        }
    }
});

/** MQTT2MySQL End **/

// 加载设置
(async () => {
    try {
        let [setting, created] = await Setting.findOrCreate({
            where: {
                setting_name: 'leakage_vol'
            },
            defaults: {
                setting_value: 0
            }
        });
        if (created) {
            logger.info("[leakage_vol] Initialized the setting value.")
        } else {
            leakage_limit_vol = setting.setting_value;
        }
    } catch (error) {
        logger.error("Unable to initialize the setting value:", error);
    }
})();

// 加载设置
(async () => {
    try {
        let [setting, created] = await Setting.findOrCreate({
            where: {
                setting_name: 'leakage_cur'
            },
            defaults: {
                setting_value: 0
            }
        });
        if (created) {
            logger.info("[leakage_cur] Initialized the setting value.")
        } else {
            leakage_limit_cur = setting.setting_value;
        }
    } catch (error) {
        logger.error("Unable to initialize the setting value:", error);
    }
})();

// 加载设置
(async () => {
    try {
        let [setting, created] = await Setting.findOrCreate({
            where: {
                setting_name: 'leakage_res'
            },
            defaults: {
                setting_value: 60
            }
        });
        if (created) {
            logger.info("[leakage_res] Initialized the setting value.")
        } else {
            leakage_limit_res = setting.setting_value;
        }
    } catch (error) {
        logger.error("Unable to initialize the setting value:", error);
    }
})();

export { client };
