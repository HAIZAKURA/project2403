/**
 * 计算Modbus协议中的CRC16校验码
 * @param {string} hexStr 以十六进制字符串形式表示的数据
 * @returns {string} 返回计算得到的CRC16校验码，以大写十六进制字符串形式表示
 */
function crc16Modbus(hexStr) {
    // 将输入的十六进制字符串转换为Buffer对象
    let buffer = Buffer.from(hexStr, 'hex');
    // 初始化CRC值为0xFFFF
    let crc = 0xFFFF;
    
    // 遍历Buffer中的每个字节，更新CRC值
    for (let i = 0; i < buffer.length; i++) {
        crc = crc ^ buffer[i]; // 对CRC值与当前字节进行异或操作
        // 对CRC值进行8位循环移位并检查最低位是否为1
        for (let j = 0; j < 8; j++) {
            if (crc & 0x0001) {
                // 若最低位为1，则CRC值右移并异或预定义的 polynomial（0xA001）
                crc = (crc >> 1) ^ 0xA001;
            } else {
                // 若最低位为0，则CRC值直接右移
                crc = crc >> 1;
            }
        }
    }

    // 提取CRC的高8位和低8位，并转换为十六进制字符串
    let crcLow = crc & 0xFF;
    let crcHigh = (crc >> 8) & 0xFF;

    // 将CRC的高、低8位合并为一个16位的校验码，并转换为形如"0000"的大写十六进制字符串
    return crcLow.toString(16).padStart(2, '0').toUpperCase() + crcHigh.toString(16).padStart(2, '0').toUpperCase();
}

export { crc16Modbus };

// console.log(crc16Modbus('AA001A07000011BBA10401010164'));