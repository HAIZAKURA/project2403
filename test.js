// import mqtt from "mqtt";

/** MQTT2MySQL Begin **/

// MQTT连接建立
// const mqtt_host = process.env.MQTT_HOST || "mqtt://sh.nya.run";
// const mqtt_port = process.env.MQTT_PORT || 38883;
// const connectUrl = `${mqtt_host}:${mqtt_port}`
// const clientId = "mysql_adapter_" + Math.random().toString(16).substring(2, 8);
// const client = mqtt.connect(connectUrl, {
//     clientId
// });

// let cmd = Buffer.from([0xAA, 0x00, 0x1A, 0x07, 0x00, 0x00, 0x11, 0xBB, 0xA1, 0x04, 0x01, 0x01, 0x00, 0x00, 0xB1, 0x7E]);

// console.log(cmd);

// client.publish("/a13jYFS3MfN/1A07000011BB/user/get", cmd, { qos: 2 }, (err) => {
//     if (err) {
//         console.log(err);
//     }
// })

// client.subscribe("/a13jYFS3MfN/1A07000011BB/user/get", { qos: 2 }, (err) => {
//     if (err) {
//         console.error(err);
//         return;
//     }
// })

// client.on("message", (topic, message) => {
//     console.log(message.toString("hex").toUpperCase());
// });

// let str = "AA001A07000011BBA10401010000B17E";
// let buffer = Buffer.from(str, "hex");
// console.log(buffer);

// import crc16 from 'node-crc16';
// let str = "AA001A07000011BBA10401010164";
// let sum = crc16.checkSum(str);
// let cmd = Buffer.from(str + sum, "hex");
// console.log(cmd);

// let data = {
//     "leakage": {}
// };
// data.leakage.ground_res_correction = 10;
// console.log(data);

// let a = 82;
// console.log(a.toString(16).padStart(2, '0').toUpperCase())

// let str = "0E28000164000152000000000000";
// let data = [];
// data.push(str.substring(0, 2));
// data.push(str.substring(2, 4));
// data.push(str.substring(4, 8));
// console.log(data[0]);

// let str = "/a13jYFS3MfN/1A07000011BB/user/get"
// let a = str.split("/");
// console.log(a[2]);

// let data = new Array();
// data.push("a");
// console.log(data);

// async function test() {
//     setTimeout(() => {
//         console.log("aaa");
//     }, 3000);
// }

// test();
// for (let i =1; i < 10; i++) {
//     console.log(i);
// }

import { Op, Sequelize } from 'sequelize';

let options = {
    where: {},
    order: [
        ['time_utc', 'DESC']
    ]
};

options.limit = 5;

options.where = {
    time_utc: {
        [Op.gte]: 5,
        [Op.lte]: 10
    }
}

options.where.box_id = 1;

console.log(options);

