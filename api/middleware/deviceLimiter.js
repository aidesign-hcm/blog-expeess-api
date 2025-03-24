const deviceLimits = new Map();

const deviceLimiter = (req, res, next) => {
    const { deviceId, success } = req.body; // Expecting success flag in request

    if (!deviceId)
        return res.status(403).json({ success: false, message: "Yêu cầu ID thiết bị" });

    const now = Date.now();
    const windowTime = 60 * 60 * 1000; // 1 hour
    const maxRequests = 10;

    if (success) {
        // Reset the attempts if the request is successful
        deviceLimits.set(deviceId, []);
        return next();
    }

    if (!deviceLimits.has(deviceId)) {
        deviceLimits.set(deviceId, []);
    }

    // Remove old attempts (older than 1 hour)
    const attempts = deviceLimits.get(deviceId).filter((t) => now - t < windowTime);

    if (attempts.length >= maxRequests) {
        return res.status(403).json({
            success: false,
            message: "Bạn không được nhập sai thông tin quá 10 lần trên 1 thiết bị trong 1 giờ, xin vui lòng quay lại sau.",
        });
    }

    // Store current attempt
    attempts.push(now);
    deviceLimits.set(deviceId, attempts);

    next();
};

module.exports = deviceLimiter;
