import mqtt from "mqtt";
import { LeakageLog } from './model.js';
import { logger } from "./app.js";

/** MQTT2MySQL Begin **/

// MQTT连接建立
const mqtt_host = process.env.MQTT_HOST || "mqtt://sh.nya.run";
const mqtt_port = process.env.MQTT_PORT || 38883;
const connectUrl = `${mqtt_host}:${mqtt_port}`
const clientId = "mysql_adapter_" + Math.random().toString(16).substring(2, 8);
const client = mqtt.connect(connectUrl, {
    clientId
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

async function insert_into_box_log(data) {
    
}

// 异步将数据插入到漏电保护设备日志中
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

export { client };
