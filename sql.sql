CREATE TABLE users (
    -- 用户ID
    uid INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    -- 用户名
    username VARCHAR(32) NOT NULL PRIMARY KEY,
    -- 密码
    password VARCHAR(32) NOT NULL,
    -- 用户角色 1:超级管理员 0:区域管理员
    role INT NOT NULL DEFAULT 0,
    INDEX idx_users (uid, username)
);

CREATE TABLE setting (
    -- 设置ID
    setting_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    -- 设置名
    setting_name VARCHAR(32) NOT NULL PRIMARY KEY,
    -- 设置值
    setting_value VARCHAR(32) NOT NULL
);

-- 区域
CREATE TABLE region (
    -- 区域ID
    region_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    -- 区域名
    region_name VARCHAR(32) NOT NULL PRIMARY KEY,
    INDEX idx_region (region_id, region_name)
);

-- 用户 区域 关系
CREATE TABLE users_region (
    -- 用户ID
    uid INT NOT NULL,
    -- 区域ID
    region_id INT NOT NULL,
    INDEX idx_region_user (uid, region_id),
    FOREIGN KEY (uid) REFERENCES users (uid),
    FOREIGN KEY (region_id) REFERENCES region (region_id)
);

-- 路段
CREATE TABLE road (
    -- 路段ID
    road_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    -- 路段名
    road_name VARCHAR(32) NOT NULL PRIMARY KEY,
    -- 区域ID
    region_id INT NOT NULL,
    INDEX idx_road (road_id, road_name, region_id),
    FOREIGN KEY (region_id) REFERENCES region (region_id)
);

-- 云盒
CREATE TABLE box (
    -- 云盒ID
    box_id VARCHAR(16) UNIQUE NOT NULL,
    -- 漏电保护设备ID
    leakage_id VARCHAR(16) UNIQUE NOT NULL,
    -- 路灯编号
    light_id VARCHAR(32) NOT NULL,
    -- 纬度
    latitude DOUBLE NOT NULL DEFAULT 0,
    -- 经度
    longitude DOUBLE NOT NULL DEFAULT 0,
    -- 区域ID
    region_id INT NOT NULL,
    -- 路段ID
    road_id INT NOT NULL,
    INDEX idx_box (region_id, road_id)
);

-- 云盒上报
CREATE TABLE box_log (
    -- 云盒ID
    box_id VARCHAR(16) NOT NULL,
    -- 电压
    VOL FLOAT NOT NULL,
    -- 电流
    CURR FLOAT NOT NULL,
    -- 电量
    POW FLOAT NOT NULL,
    -- UTC时间戳
    time_utc BIGINT NOT NULL,
    INDEX idx_box_log (box_id, time_utc),
    FOREIGN KEY (box_id) REFERENCES box (box_id)
);

-- 漏电保护设备上报
CREATE TABLE leakage_log (
    -- 漏电保护设备ID
    leakage_id VARCHAR(16) NOT NULL,
    -- 消息ID
    msg_id BIGINT NOT NULL,
    -- UTC时间戳
    time_utc BIGINT NOT NULL,
    -- 漏电压
    V FLOAT NOT NULL,
    -- 漏电流
    I FLOAT NOT NULL,
    -- 接地电阻
    R FLOAT NOT NULL,
    INDEX idx_leakage_log (leakage_id, time_utc),
    FOREIGN KEY (leakage_id) REFERENCES box (leakage_id)
);

-- 云盒告警记录
CREATE TABLE box_alert (
    -- 云盒ID
    box_id VARCHAR(16) NOT NULL,
    -- 告警类型
    alert_type INT NOT NULL,
    -- 告警内容
    alert_content VARCHAR(128) NOT NULL,
    -- 告警时间
    time_utc BIGINT NOT NULL,
    INDEX idx_box_alert (box_id, alert_type, time_utc),
    FOREIGN KEY (box_id) REFERENCES box (box_id)
);

-- 漏电保护设备告警记录
CREATE TABLE leakage_alert (
    -- 漏电保护设备ID
    leakage_id VARCHAR(16) NOT NULL,
    -- 告警类型
    alert_type INT NOT NULL,
    -- 告警内容
    alert_content VARCHAR(128) NOT NULL,
    -- 告警时间
    time_utc BIGINT NOT NULL,
    INDEX idx_leakage_alert (leakage_id, time_utc),
    FOREIGN KEY (leakage_id) REFERENCES box (leakage_id)
);
