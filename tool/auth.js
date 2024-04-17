import jwt from 'jsonwebtoken';

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // "Bearer TOKEN"

    if (token == null) {
        // 无token，未授权
        return res.json({
            code: 401,
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        // token无效或过期
        if (err) {
            return res.json({
                code: 401,
            });
        }
        req.user = user;
        next(); // token验证成功，继续
    });
};

export { authenticateToken };
