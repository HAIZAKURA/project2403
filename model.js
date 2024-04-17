// model.js
// Model Init

import log4js from 'log4js';
import { Sequelize, DataTypes } from "sequelize";

// Logger
const logger = log4js.getLogger(); // 获取一个全局日志记录器实例
logger.level = 'info'; // 设置日志记录级别为 info

// MySQL Init
const mysql_host = process.env.MYSQL_HOST || "localhost"; // 从环境变量获取 MySQL 主机名，若不存在则默认为 localhost
const mysql_user = process.env.MYSQL_USER || "root"; // 从环境变量获取 MySQL 用户名，若不存在则默认为 root
const mysql_pass = process.env.MYSQL_PASS || "root"; // 从环境变量获取 MySQL 密码，若不存在则默认为 root
const mysql_db = process.env.MYSQL_DB || "mqtt_mysql_adapter"; // 从环境变量获取 MySQL 数据库名，若不存在则默认为 mqtt_mysql_adapter
const sequelize = new Sequelize(mysql_db, mysql_user, mysql_pass, {
    host: mysql_host, // MySQL 主机名
    dialect: 'mysql', // 使用的数据库类型为 MySQL
    logging: msg => logger.info(msg) // 配置日志记录，将 Sequelize 的日志信息转发给 logger.info 处理
});

// MySQL Sync
(async () => {
    try {
        // 同步所有数据库模型
        await sequelize.sync({ alter: true });
        logger.info("All models were synchronized successfully.");
    } catch (error) {
        logger.error("Unable to synchronize models:", error);
    }
})();


// Users Model
const Users = sequelize.define("Users", {
    // 用户ID
    uid: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    // 用户名
    username: {
        type: DataTypes.STRING(32),
        allowNull: false,
        primaryKey: true,
    },
    // 用户密码
    password: {
        type: DataTypes.STRING(32),
        allowNull: false,
    },
    // 用户角色 1:超级管理员 0:区域管理员 
    role: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    // 激活状态 0:未激活 1:已激活
    active: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
    }}, {
        tableName: "users",
        timestamps: false,
        indexes: [{
            unique: true,
            fields: ["uid", "username"]
        }]
});

// Setting Model
const Setting = sequelize.define("Setting", {
    // 设置ID
    setting_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    // 设置名称
    setting_name: {
        type: DataTypes.STRING(64),
        allowNull: false,
    },
    // 设置值
    setting_value: {
        type: DataTypes.FLOAT,
        allowNull: false,
    }}, {
        tableName: "setting",
        timestamps: false
});

// Region Model
const Region = sequelize.define("Region", {
    // 区域ID
    region_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    // 区域名称
    region_name: {
        type: DataTypes.STRING(32),
        allowNull: false,
        primaryKey: true,
    }}, {
        tableName: "region",
        timestamps: false,
        indexes: [{
            unique: true,
            fields: ["region_id", "region_name"]
        }]
});

// UsersRegion Model
const UsersRegion = sequelize.define("UsersRegion", {
    // 用户ID
    uid: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Users,
            key: "uid"
        }
    },
    // 区域ID
    region_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Region,
            key: "region_id"
        }
    }}, {
        tableName: "users_region",
        timestamps: false,
        indexes: [{
            unique: true,
            fields: ["uid", "region_id"]
        }]
});

/**
 * 定义Region模型和Users模型之间的多对多关系
 */
Users.belongsToMany(Region, {
    through: UsersRegion,
    as: "users_region",
    foreignKey: "uid",
    onDelete: "CASCADE"
});

/**
 * 定义Region模型和Users模型之间的多对多关系
 */
Region.belongsToMany(Users, {
    through: UsersRegion,
    as: "users_region",
    foreignKey: "region_id",
    onDelete: "CASCADE"
});

// Road Model
const Road = sequelize.define("Road", {
    // 道路ID
    road_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    // 道路名称
    road_name: {
        type: DataTypes.STRING(32),
        allowNull: false,
        primaryKey: true,
    },
    // 区域ID
    region_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Region,
            key: "region_id"
        }
    }}, {
        tableName: "road",
        timestamps: false,
        indexes: [{
            unique: true,
            fields: ["road_id", "road_name", "region_id"]
        }]
});

/**
 * 定义Region模型和Road模型之间的多对一关系
 */
Region.hasMany(Road, {
    foreignKey: "region_id",
    as: "roads",
    onDelete: "CASCADE"
});

/**
 * 定义Region模型和Road模型之间的一对一关系
 */
Road.belongsTo(Region, {
    foreignKey: "region_id",
    as: "region",
    onDelete: "CASCADE"
});

// Box Model
const Box = sequelize.define("Box", {
    // 盒子ID
    box_id: {
        type: DataTypes.STRING(16),
        allowNull: false,
        primaryKey: true
    },
    // 漏电保护ID
    leakage_id: {
        type: DataTypes.STRING(16),
        allowNull: false
    },
    // 灯柱ID
    light_id: {
        type: DataTypes.STRING(32),
        allowNull: false
    },
    // 纬度
    latitude: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0
    },
    // 经度
    longitude: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0
    },
    // 区域ID
    region_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Region,
            key: "region_id"
        }
    },
    // 道路ID
    road_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Road,
            key: "road_id"
        }
    },
    // 时间策略开始 小时
    t_hour: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    // 时间策略开始 分钟
    t_minute: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    // 时间策略 阶段1 时长
    t_s1: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    // 时间策略 阶段1 亮度
    t_s1_b: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    // 时间策略 阶段2 时长
    t_s2: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    // 时间策略 阶段2 亮度
    t_s2_b: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    // 时间策略 阶段3 时长
    t_s3: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    // 时间策略 阶段3 亮度
    t_s3_b: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    // 时间策略 阶段4 时长
    t_s4: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    // 时间策略 阶段4 亮度
    t_s4_b: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    }, {
        tableName: "box",
        timestamps: false,
        indexes: [{
            fields: ["box_id", "leakage_id", "region_id", "road_id"]
        }]
});

/**
 * 定义Box与Road之间的关系，一个Box属于一个Road。
 * 当Road被删除时，关联的Box也将被删除（CASCADE规则）。
 */
Box.belongsTo(Road, {
    foreignKey: "road_id",
    onDelete: "CASCADE"
});

/**
 * 定义Box与Region之间的关系，一个Box属于一个Region。
 * 当Region被删除时，关联的Box也将被删除（CASCADE规则）。
 */
Box.belongsTo(Region, {
    foreignKey: "region_id",
    onDelete: "CASCADE"
});

/**
 * 定义Region与Box之间的多对一关系，一个Region可以有多个Box。
 * 当Region被删除时，关联的Box也将被删除（CASCADE规则）。
 */
Region.hasMany(Box, {
    foreignKey: "region_id",
    onDelete: "CASCADE"
});

/**
 * 定义Road与Box之间的多对一关系，一个Road可以有多个Box。
 * 当Road被删除时，关联的Box也将被删除（CASCADE规则）。
 */
Road.hasMany(Box, {
    foreignKey: "road_id",
    onDelete: "CASCADE"
});

// BoxState Model
const BoxState = sequelize.define("BoxState", {
    // 盒子ID
    box_id: {
        type: DataTypes.STRING(16),
        allowNull: false,
        primaryKey: true,
        references: {
            model: Box,
            key: "box_id"
        }
    },
    // 盒子状态
    state: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    // 盒子亮度
    brightness: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    }
    }, {
        tableName: "box_state",
        timestamps: false,
        indexes: [{
            unique: true,
            fields: ["box_id"]
        }]
});

/**
 * 定义Box模型与BoxState模型之间的一对一关系
 */
Box.hasOne(BoxState, {
    foreignKey: "box_id",
    onDelete: "CASCADE"
});

/**
 * 定义Box模型与BoxState模型之间的一对一关系
 */
BoxState.belongsTo(Box, {
    foreignKey: "box_id",
    onDelete: "CASCADE"
});

// BoxLog Model
const BoxLog = sequelize.define("BoxLog", {
    // 盒子ID
    box_id: {
        type: DataTypes.STRING(16),
        allowNull: false,
        references: {
            model: Box,
            key: "box_id"
        }
    },
    // 电压
    VOL: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    // 电流
    CUR: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    // 电量
    POW: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    // 时间
    time_utc: {
        type: DataTypes.BIGINT,
        allowNull: false
    }
    }, {
        tableName: "box_log",
        timestamps: false,
        indexes: [{
            unique: true,
            fields: ["box_id", "time_utc"]
        }]
});

/**
 * 定义Box与BoxLog之间的多对一关系
 */
Box.hasMany(BoxLog, {
    foreignKey: "box_id",
    onDelete: "CASCADE"
});

/**
 * 定义Box与BoxLog之间的一对一关系
 */
BoxLog.belongsTo(Box, {
    foreignKey: "box_id",
    onDelete: "CASCADE"
});

// LeakageLog Model
const LeakageLog = sequelize.define("LeakageLog", {
    // 漏电保护ID
    leakage_id: {
        type: DataTypes.STRING(16),
        allowNull: false,
        references: {
            model: Box,
            key: "leakage_id"
        }
    },
    // 消息ID
    msg_id: {
        type: DataTypes.BIGINT,
        allowNull: false
    },
    // 时间
    time_utc: {
        type: DataTypes.BIGINT,
        allowNull: false
    },
    // 电压
    V: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    // 电流
    I: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    // 电阻
    R: {
        type: DataTypes.FLOAT,
        allowNull: false
    }
    },{
        tableName: "leakage_log",
        timestamps: false,
        indexes: [{
            fields: ["leakage_id", "time_utc"]
        }]
});

/**
 * 定义Box与LeakageLog之间的多对一关系
 */
Box.hasMany(LeakageLog, {
    foreignKey: "leakage_id",
    onDelete: "CASCADE"
});

/**
 * 定义Box与LeakageLog之间的一对一关系
 */
LeakageLog.belongsTo(Box, {
    foreignKey: "leakage_id",
    onDelete: "CASCADE"
});

// BoxAlert Model
const BoxAlert = sequelize.define("BoxAlert", {
    // 盒子ID
    box_id: {
        type: DataTypes.STRING(16),
        allowNull: false,
        references: {
            model: Box,
            key: "box_id"
        }
    },
    // 报警设备
    alert_device: {
        // 1
        // 2
        // 3
        // 4
        // 5
        // 6
        type: DataTypes.STRING(4),
        allowNull: false
    },
    // 报警类型
    alert_type: {
        // bit0
        // bit1
        // bit2
        // bit3
        type: DataTypes.STRING(4),
        allowNull: false
    },
    // 报警内容
    alert_content: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
    },
    // 时间
    time_utc: {
        type: DataTypes.BIGINT,
        allowNull: false
    }
    }, {
        tableName: "box_alert",
        timestamps: false,
        indexes: [{
            unique: true,
            fields: ["box_id", "alert_type", "time_utc"]
        }]
});

/**
 * 定义Box与BoxAlert之间的多对一关系
 */
Box.hasMany(BoxAlert, {
    foreignKey: "box_id",
    onDelete: "CASCADE"
});

/**
 * 定义Box与BoxAlert之间的一对一关系
 */
BoxAlert.belongsTo(Box, {
    foreignKey: "box_id",
    onDelete: "CASCADE"
});

// LeakageAlert Model
const LeakageAlert = sequelize.define("LeakageAlert", {
    // 漏电保护ID
    leakage_id: {
        type: DataTypes.STRING(16),
        allowNull: false,
        references: {
            model: Box,
            key: "leakage_id"
        }
    },
    // 报警类型
    alert_type: {
        // 1 = 电流
        // 2 = 电压
        // 3 = 电阻异常
        // 4 = 电阻
        type: DataTypes.INTEGER,
        allowNull: false
    },
    // 报警内容
    alert_content: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
        allowNull: false
    },
    // 时间
    time_utc: {
        type: DataTypes.BIGINT,
        allowNull: false
    }
    }, {
        tableName: "leakage_alert",
        timestamps: false,
        indexes: [{
            unique: true,
            fields: ["leakage_id", "alert_type", "time_utc"]
        }]
});

/**
 * 定义Box与LeakageLog之间的多对一关系
 */
Box.hasMany(LeakageAlert, {
    foreignKey: "leakage_id",
    onDelete: "CASCADE"
});

/**
 * 定义Box与LeakageLog之间的一对一关系
 */
LeakageAlert.belongsTo(Box, {
    foreignKey: "leakage_id",
    onDelete: "CASCADE"
});

export {
    Users,
    Setting,
    Region,
    UsersRegion,
    Road,
    Box,
    BoxLog,
    BoxState,
    LeakageLog,
    BoxAlert,
    LeakageAlert
};
