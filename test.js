// let json = {
//     // "msg_id":0,
//     "msg_code": 0,
//     "measure_ground_res_time": 0,
//     "mqtt_upload_time": 0,
//     "ground_res_correction": 0,
// }

// if (json.hasOwnProperty("msg_id")) {
//     console.log("1")
// } else {
//     console.log("2")
// }

import { md5 } from 'js-md5';

let a = "111"
let b = "222"
let c = a + b
console.log(c)
console.log(md5(c))
console.log(md5(a+b));

