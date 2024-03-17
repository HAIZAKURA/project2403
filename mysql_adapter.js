import mqtt from "mqtt";
import mysql from 'mysql2/promise';

// MySQL连接建立
const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || "localhost",
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASS || "root",
    database: process.env.MYSQL_DB || "mqtt_mysql_adapter"
});

/**
 * 异步函数，将数据插入到云盒上报表中。
 * @param {Array} data - 要插入的数据数组。数组中的元素应与数据库表中的字段对应。
 * @returns {void} 不返回任何内容。
 */
async function insert_into_box_log(data) {
    
}

/**
 * 异步函数，将数据插入到漏电保护设备上报表中。
 * @param {Array} data - 要插入的数据数组。数组中的元素应与数据库表中的字段对应。
 * @returns {void} 不返回任何内容。
 */
async function insert_into_leakage_log(data) {
    try {
        // 准备插入数据的SQL语句
        const sql = 'INSERT INTO `leakage_log` VALUES (?, ?, ?, ?, ?, ?)';
        // 执行SQL语句，插入数据
        const [res] = await connection.execute(sql, data);
        // 打印插入操作的结果
        console.log(res);
    } catch (err) {
        // 如果出现错误，打印错误信息
        console.error(err);
    }
}

/**
 * 异步函数，将数据插入到云盒告警记录表中。
 * @param {Array} data - 要插入的数据数组。数组中的元素应与数据库表中的字段对应。
 * @returns {void} 不返回任何内容。
 */
async function insert_into_box_alert(data) {
    
}

/**
 * 异步函数，将数据插入到漏电保护设备告警记录表中。
 * @param {Array} data - 要插入的数据数组。数组中的元素应与数据库表中的字段对应。
 * @returns {void} 不返回任何内容。
 */
async function insert_into_leakage_alert(data) {
    
}

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

// MQTT消息处理
client.on("message", (topic, message) => {
    if (topic == "device_report") {
        let payload = JSON.parse(message.toString()).leakage;
        let new_data = [
            payload["id"],
            payload["msg_id"],
            payload["param"]["time_utc"],
            payload["param"]["V"],
            payload["param"]["I"],
            payload["param"]["R"]
        ];
        insert_into_leakage_log(new_data);
    } else if (topic.startsWith("cloud/")) {
        let id = topic.split("/")[1];
        let payload = JSON.parse(message.toString()).leakage;
        if (payload.hasOwnProperty("msg_id")) {
            let new_data = [
                id,
                payload["msg_id"],
                payload["measure_ground_res_time"],
                payload["mqtt_upload_time"],
                payload["ground_res_correction"]
            ];
            console.log(new_data);
        }
    }
});