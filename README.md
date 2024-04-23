# project2403



### Create Admin User

username: admin

password: admin

```sql
INSERT INTO `users` (`username`, `password`, `role`) VALUES
('admin', 'f6fdffe48c908deb0f4c3bd36c032e72', 1);
```

### Environment Variable

```
MYSQL_HOST="localhost"
MYSQL_USER="root"
MYSQL_PASS="root"
MYSQL_DB="mqtt_mysql_adapter"

MQTT_HOST="mqtt://127.0.0.1"
MQTT_PORT=1883

JWT_SECRET="HAIZAKURA"
```
