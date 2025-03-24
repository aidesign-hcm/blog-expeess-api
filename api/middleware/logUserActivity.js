const axios = require("axios");
const requestIp = require("request-ip");
const UserLog = require("../models/UserLog");

const logUserLogin = async (user, req, sessionToken) => {
  try {
    const ip = requestIp.getClientIp(req) || "Unknown";
    const agent = req.headers["user-agent"] || "Unknown";

    let location = "Unknown";
    if (ip !== "Unknown" && ip !== "::1") {
      try {
        const geoResponse = await axios.get(`https://ipinfo.io/${ip}/json`);
        location = `${geoResponse.data.city}, ${geoResponse.data.country}`;
      } catch (error) {
        console.error("Error fetching location:", error.message);
      }
    }

    // Save login log with sessionToken
    const userLog = new UserLog({
      user: user._id,
      ip,
      device: agent,
      location,
      sessionToken,
      loginTime: new Date(),
    });

    await userLog.save();
    // Keep only the last 10 logs
    const userLogs = await UserLog.find({ user: user._id })
      .sort({ loginTime: -1 })
      .skip(30)
      .exec();

    if (userLogs.length > 0) {
      await UserLog.deleteMany({ _id: { $in: userLogs.map(log => log._id) } });
    }
  } catch (err) {
    console.error("Error logging user login:", err.message);
  }
};


const logUserLogout = async (user, req, sessionToken) => {
    try {
      const ip = requestIp.getClientIp(req) || "Unknown";
      const agent = req.headers["user-agent"] || "Unknown";
  
      let location = "Unknown";
      if (ip !== "Unknown" && ip !== "::1") {
        try {
          const geoResponse = await axios.get(`https://ipinfo.io/${ip}/json`);
          location = `${geoResponse.data.city}, ${geoResponse.data.country}`;
        } catch (error) {
          console.error("Error fetching location:", error.message);
        }
      }
      // Find the log by sessionToken and update the logout time
      const userLog = await UserLog.findOne({ sessionToken, user: user._id }).sort({ loginTime: -1 });

  
      if (userLog) {
        userLog.logoutTime = new Date();
        await userLog.save();
      } else {
        // If no log entry found for the sessionToken, create a new log (as a fallback)
        await UserLog.create({
          user: user._id,
          ip,
          device: agent,
          location,
          sessionToken,
          loginTime: new Date(),
          logoutTime: new Date(),
        });
        const userLogs = await UserLog.find({ user: user._id })
        .sort({ loginTime: -1 })
        .skip(30)
        .exec();
        if (userLogs.length > 0) {
          await UserLog.deleteMany({ _id: { $in: userLogs.map(log => log._id) } });
        }
      }
    } catch (err) {
      console.error("Error logging user logout:", err.message);
    }
  };
  
  module.exports = { logUserLogin, logUserLogout };