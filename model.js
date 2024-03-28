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
    uid: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    username: {
        type: DataTypes.STRING(32),
        allowNull: false,
        primaryKey: true,
    },
    password: {
        type: DataTypes.STRING(32),
        allowNull: false,
    },
    role: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
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
    setting_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    setting_name: {
        type: DataTypes.STRING(32),
        unique: true,
        allowNull: false,
    },
    setting_value: {
        type: DataTypes.FLOAT,
        allowNull: false,
    }}, {
        tableName: "setting",
        timestamps: false
});

// Region Model
const Region = sequelize.define("Region", {
    region_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
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
    uid: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Users,
            key: "uid"
        }
    },
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

// Road Model
const Road = sequelize.define("Road", {
    road_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    road_name: {
        type: DataTypes.STRING(32),
        allowNull: false,
        primaryKey: true,
    },
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

// Box Model
const Box = sequelize.define("Box", {
    box_id: {
        type: DataTypes.STRING(16),
        unique: true,
        allowNull: false
    },
    leakage_id: {
        type: DataTypes.STRING(16),
        unique: true,
        allowNull: false
    },
    light_id: {
        type: DataTypes.STRING(32),
        allowNull: false
    },
    latitude: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0
    },
    longitude: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0
    },
    region_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Region,
            key: "region_id"
        }
    },
    road_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Road,
            key: "road_id"
        }
    },
    t_hour: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    t_minute: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    t_s1: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    t_s1_b: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    t_s2: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    t_s2_b: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    t_s3: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    t_s3_b: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    t_s4: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    t_s4_b: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    }, {
        tableName: "box",
        timestamps: false,
        indexes: [{
            fields: ["region_id", "road_id"]
        }]
});

// BoxState Model
const BoxState = sequelize.define("BoxState", {
    box_id: {
        type: DataTypes.STRING(16),
        allowNull: false,
        references: {
            model: Box,
            key: "box_id"
        }
    },
    state: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
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

// BoxLog Model
const BoxLog = sequelize.define("BoxLog", {
    box_id: {
        type: DataTypes.STRING(16),
        allowNull: false,
        references: {
            model: Box,
            key: "box_id"
        }
    },
    VOL: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    CUR: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    POW: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
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

// LeakageLog Model
const LeakageLog = sequelize.define("LeakageLog", {
    leakage_id: {
        type: DataTypes.STRING(16),
        allowNull: false,
        references: {
            model: Box,
            key: "leakage_id"
        }
    },
    msg_id: {
        type: DataTypes.BIGINT,
        allowNull: false
    },
    time_utc: {
        type: DataTypes.BIGINT,
        allowNull: false
    },
    V: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    I: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
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

// BoxAlert Model
const BoxAlert = sequelize.define("BoxAlert", {
    box_id: {
        type: DataTypes.STRING(16),
        allowNull: false,
        references: {
            model: Box,
            key: "box_id"
        }
    },
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
    alert_type: {
        // bit0
        // bit1
        // bit2
        // bit3
        type: DataTypes.STRING(4),
        allowNull: false
    },
    alert_content: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
    },
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

// LeakageAlert Model
const LeakageAlert = sequelize.define("LeakageAlert", {
    leakage_id: {
        type: DataTypes.STRING(16),
        allowNull: false,
        references: {
            model: Box,
            key: "leakage_id"
        }
    },
    alert_type: {
        // 1 = 电流
        // 2 = 电压
        // 3 = 电阻异常
        // 4 = 电阻
        type: DataTypes.INTEGER,
        allowNull: false
    },
    alert_content: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
        allowNull: false
    },
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
