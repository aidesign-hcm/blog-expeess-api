const mongoose = require("mongoose");
const User = require("../models/user");
// const Payment = require("../models/payment");
var moment = require("moment");
const defineAbilityFor = require("../permissions/abilities");
const { ForbiddenError } = require("@casl/ability");
const bcrypt = require("bcryptjs");
const { customAlphabet } = require("nanoid");
const UserLog = require("../models/UserLog");

exports.userSignup = async (req, res) => {
 
  try {
    const { password, username, phonenumber } = req.body;
    const email = req.body.email?.toLowerCase(); // Ensure email is defined before calling `toLowerCase()`

    if (!email || !password || !username) {
      return res.status(403).json({
        success: false,
        message: "Vui lòng điền đầy đủ thông tin.",
      });
    }

    // Validate password
    const isValidPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
    if (!isValidPassword) {
      return res.status(403).json({
        success: false,
        message: "Mật khẩu phải chứa ít nhất: 1 chữ in hoa, 1 chữ thường, 1 số và có độ dài tối thiểu 8 ký tự.",
      });
    }

    // Check if phone number exists
    if (phonenumber) {
      const existingUserPhone = await User.findOne({ phonenumber });
      if (existingUserPhone) {
        return res.status(403).json({
          success: false,
          message: "Số điện thoại đã được sử dụng.",
          userErr: true,
          mailErr: false,
        });
      }
    }

    // Check if email exists
    const existingUserEmail = await User.findOne({ email });
    if (existingUserEmail) {
      return res.status(403).json({
        success: false,
        message: "Địa chỉ email này đã được sử dụng.",
        userErr: false,
        mailErr: true,
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate user code
    const nanoid = customAlphabet("1234567890abcdef", 8);
    const user = new User({
      username,
      email,
      password: hashedPassword,
      code: nanoid(),
      ...(phonenumber && { phonenumber }), // Only include `phonenumber` if it's provided
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: "Đã tạo tài khoản mới thành công.",
      user,
    });
  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi, vui lòng thử lại sau.",
      error: err.message,
    });
  }
};


exports.get_all_user = async (req, res) => {
  const ability = defineAbilityFor(req.user);
  const { page, perPage } = req.body;
  // let type = "desc";
  // const field = sort.field;
  // if (sort.type !== "none") {
  //   type = sort.type;
  // }
  try {
    let onTotal = User.countDocuments();
    let onUsers = User.find()
      .select("_id username phonenumber email rule gender private createdAt")
      .sort({ createdAt: "desc" })
      .skip(perPage * page - perPage) // Trong page đầu tiên sẽ bỏ qua giá trị là 0
      .limit(perPage);
    let [total, users] = await Promise.all([onTotal, onUsers]);
    ForbiddenError.from(ability).throwUnlessCan("read", users);
    res.json({
      success: true,
      users,
      total,
    });
  } catch (err) {
    res.json({
      success: false,
      message: "something wrong",
    });
  }
};

exports.search_user = async (req, res) => {
  let email = { $regex: new RegExp("^" + req.body.email.toLowerCase()) };
  try {
    let users = await User.find({ email })
      .sort({ createdAt: "desc" })
      .limit(20);
    res.json({
      success: true,
      users,
    });
  } catch (err) {
    res.status(500).json({
      message: "Please check correctness and try again",
      error: err,
      success: false,
    });
  }
};

exports.get_single_user = async (req, res) => {
  const ability = defineAbilityFor(req.user);
  let _id = req.params.id;
  try {
    var user = await User.findById({ _id })
      .sort({ createdAt: "desc" })
      .select(
        "username email rule Wallet private address phonenumber private rank bio gender categories"
      )
      .exec();
    ForbiddenError.from(ability).throwUnlessCan("read", user);
    console.log(user)
    res.status(200).json({ status: true, user, success: true });
  } catch (err) {
    res.status(500).send(err);
  }
};

exports.delete_user = async (req, res) => {
  const ability = defineAbilityFor(req.user);
  let _id = req.params.id;
  try {
    var user = await User.findById({ _id }).exec();
    ForbiddenError.from(ability).throwUnlessCan("delete", user);
    await user.remove();
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).send(err);
  }
};

exports.admin_change_password = async (req, res, next) => {
  const ability = defineAbilityFor(req.user);
  const _id = req.body._id;
  const newPassword = req.body.password;
  let regPass = newPassword.match(
    /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/
    // regex cho mật khẩu
  );
  try {
    let foundUser = await User.findById({ _id });
    if (!regPass) {
      return res.status(403).json({
        success: false,
        message: "Password should be stronger",
      });
    }
    ForbiddenError.from(ability).throwUnlessCan("update", foundUser);

    bcrypt.hash(newPassword, 10, async (err, hash) => {
      if (err) {
        return res.status(500).json({
          error: err,
          message: "Something wrong",
        });
      } else {
        foundUser.password = hash;
        await foundUser.save();
        // const html = PassChanged;
        // // Send email
        // mailer.sendEmail(
        //   "aithietke@gmail.com",
        //   foundUser.email,
        //   "Password have been change by Administartor!",
        //   html
        // );
        res.status(200).json({
          success: true,
          message: "Password has been change",
        });
      }
    });
  } catch (err) {
    res.json(500).status({
      error: err,
      success: false,
      message: "Server Error",
    });
  }
};

exports.add_deposit = async (req, res) => {
  const ability = defineAbilityFor(req.user);
  const nanoid = customAlphabet("1234567890abcdef", 6);
  let { amount, buyer } = req.body;
  try {
    let method = await Payment.findOne({});
    let deposit = new Deposit({
      code: nanoid(),
      amount: amount,
      buyer,
      method: method._id,
      paymentAmount: amount,
      status: "Completed",
    });
    ForbiddenError.from(ability).throwUnlessCan("create", deposit);
    await deposit.save();
    builUserBalance(buyer);
    res.status(200).json({
      success: true,
      deposit,
    });
  } catch (err) {
    res.status(500).json({
      message: err,
      success: false,
    });
  }
};

exports.get_deposit_by_date = async (req, res, next) => {
  let rule = req.user.rule;
  let ability = defineAbilityFor(req.user);
  let perPage = 20; // số lượng sản phẩm xuất hiện trên 1 page
  let page = parseInt(req.query.page) || 1;
  let { start, end } = req.body;
  let startFormat = moment.utc(String(start)).toDate();
  let endFormat = moment.utc(String(end)).add(24, "hours").toDate();
  try {
    if (rule == "admin") {
      let getTotal = Deposit.countDocuments({
        updatedAt: {
          $gte: startFormat,
          $lte: endFormat,
        },
      });
      let getDeposits = Deposit.find({
        updatedAt: {
          $gte: startFormat,
          $lte: endFormat,
        },
      })
        .populate("method", "methodname")
        .populate("buyer", "email")
        .sort({ updatedAt: "desc" })
        .skip(perPage * page - perPage) // Trong page đầu tiên sẽ bỏ qua giá trị là 0
        .limit(perPage);

      let getResult = Deposit.aggregate([
        {
          $match: {
            $and: [
              { updatedAt: { $gte: startFormat } },
              { updatedAt: { $lte: endFormat } },
            ],
          },
        },
        {
          $group: {
            _id: "$status",
            total: { $sum: { $multiply: ["$amount"] } },
          },
        },
      ]);
      let [total, deposits, result] = await Promise.all([
        getTotal,
        getDeposits,
        getResult,
      ]);
      ForbiddenError.from(ability).throwUnlessCan("read", deposits);
      let completed = result.find(({ _id }) => _id === "Completed") || {
        total: 0,
      };
      let onHold = result.find(({ _id }) => _id === "On hold") || { total: 0 };
      let refunded = result.find(({ _id }) => _id === "Refunded") || {
        total: 0,
      };
      let canceled = result.find(({ _id }) => _id === "Canceled") || {
        total: 0,
      };
      let confirmed = result.find(({ _id }) => _id === "Confirmed") || {
        total: 0,
      };
      let status = {
        completed,
        onHold,
        canceled,
        refunded,
        confirmed,
      };
      res.status(200).json({
        total,
        deposits,
        success: true,
        status,
      });
    } else {
      res.status(500).json({
        success: false,
        mesage: "You can't accept this action",
      });
    }
  } catch (err) {
    res.status(500).json({
      error: err,
    });
  }
};

exports.get_withdraw_by_date = async (req, res, next) => {
  let rule = req.user.rule;
  let ability = defineAbilityFor(req.user);
  let perPage = 20; // số lượng sản phẩm xuất hiện trên 1 page
  let page = parseInt(req.query.page) || 1;
  let { start, end } = req.body;
  let startFormat = moment.utc(String(start)).toDate();
  let endFormat = moment.utc(String(end)).add(24, "hours").toDate();
  try {
    if (rule == "admin") {
      let getTotal = Withdraw.countDocuments({
        updatedAt: {
          $gte: startFormat,
          $lte: endFormat,
        },
      });
      let getResult = Withdraw.aggregate([
        {
          $match: {
            $and: [
              { updatedAt: { $gte: startFormat } },
              { updatedAt: { $lte: endFormat } },
            ],
          },
        },
        {
          $group: {
            _id: "$status",
            total: { $sum: { $multiply: ["$amount"] } },
          },
        },
      ]);
      let getWithdraws = Withdraw.find({
        updatedAt: {
          $gte: startFormat,
          $lte: endFormat,
        },
      })
        .populate("method", "methodname")
        .populate("buyer", "email")
        .sort({ updatedAt: "desc" })
        .skip(perPage * page - perPage) // Trong page đầu tiên sẽ bỏ qua giá trị là 0
        .limit(perPage);
      let [total, withdraws, result] = await Promise.all([
        getTotal,
        getWithdraws,
        getResult,
      ]);
      ForbiddenError.from(ability).throwUnlessCan("read", withdraws);
      let completed = result.find(({ _id }) => _id === "Completed") || {
        total: 0,
      };
      let onHold = result.find(({ _id }) => _id === "On hold") || { total: 0 };
      let confirmed = result.find(({ _id }) => _id === "Confirmed") || {
        total: 0,
      };
      let canceled = result.find(({ _id }) => _id === "Canceled") || {
        total: 0,
      };
      let refunded = result.find(({ _id }) => _id === "Refunded") || {
        total: 0,
      };
      let status = {
        completed,
        onHold,
        confirmed,
        canceled,
        refunded,
      };
      res.status(200).json({
        total,
        withdraws,
        success: true,
        status,
      });
    } else {
      res.status(500).json({
        success: false,
        mesage: "You can't accept this action",
      });
    }
  } catch (err) {
    res.status(500).json({
      error: err,
    });
  }
};

exports.get_partner = async (req, res, next) => {
  const ability = defineAbilityFor(req.user);
  try {
    let onGetBalance = User.aggregate([
      {
        $group: {
          _id: null,
          deposit: { $sum: { $multiply: ["$Wallet.deposit"] } },
          interest: { $sum: { $multiply: ["$Wallet.interest"] } },
          widthdrawAll: { $sum: { $multiply: ["$Wallet.withdraw"] } },
          widthdrawInterest: {
            $sum: { $multiply: ["$Wallet.withdrawInterest"] },
          },
        },
      },
    ]);
    let [balance] = await Promise.all([onGetBalance]);
    ForbiddenError.from(ability).throwUnlessCan("read", balance);
    let allPartnerData = {
      partnerDeposit: 0,
      partnerInterest: 0,
      partnerWidthdrawAll: 0,
      partnerWidthdrawInterest: 0,
      partnerRevenue: 0,
    };
    if (balance.length > 0) {
      (allPartnerData.partnerDeposit = balance[0].deposit),
        (allPartnerData.partnerInterest = balance[0].interest),
        (allPartnerData.partnerWidthdrawAll = balance[0].widthdrawAll),
        (allPartnerData.partnerWidthdrawInterest =
          balance[0].widthdrawInterest),
        (allPartnerData.partnerRevenue =
          allPartnerData.partnerDeposit - allPartnerData.partnerWidthdrawAll);
    }
    res.json({
      success: true,
      allPartnerData,
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

exports.get_partner_by_date = async (req, res, next) => {
  let rule = req.user.rule;
  let ability = defineAbilityFor(req.user);
  let { start, end } = req.body;
  let startFormat = moment.utc(String(start)).toDate();
  let endFormat = moment.utc(String(end)).add(24, "hours").toDate();
  try {
    if (rule == "admin") {
      let onWithdrawAll = Withdraw.aggregate([
        {
          $match: {
            $and: [
              { updatedAt: { $gte: startFormat } },
              { updatedAt: { $lte: endFormat } },
              { type: "deposit" },
              { status: "Completed" },
            ],
          },
        },
        {
          $group: {
            _id: "$status",
            total: { $sum: { $multiply: ["$amount"] } },
          },
        },
      ]);
      let onWithdrawInterest = Withdraw.aggregate([
        {
          $match: {
            $and: [
              { updatedAt: { $gte: startFormat } },
              { updatedAt: { $lte: endFormat } },
              { type: "interest" },
              { status: "Completed" },
            ],
          },
        },
        {
          $group: {
            _id: "$status",
            total: { $sum: { $multiply: ["$amount"] } },
          },
        },
      ]);
      let onDeposit = Deposit.aggregate([
        {
          $match: {
            $and: [
              { updatedAt: { $gte: startFormat } },
              { updatedAt: { $lte: endFormat } },
            ],
          },
        },
        {
          $group: {
            _id: "$status",
            total: { $sum: { $multiply: ["$amount"] } },
          },
        },
      ]);
      let onInterest = Interest.aggregate([
        {
          $match: {
            $and: [
              { updatedAt: { $gte: startFormat } },
              { updatedAt: { $lte: endFormat } },
            ],
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $multiply: ["$amount"] } },
          },
        },
      ]);
      let [getWithdrawAll, getWithdrawInterest, getDeposit, getInterest] =
        await Promise.all([
          onWithdrawAll,
          onWithdrawInterest,
          onDeposit,
          onInterest,
        ]);
      ForbiddenError.from(ability).throwUnlessCan("read", getWithdrawAll);
      let WithdrawAll = getWithdrawAll.find(
        ({ _id }) => _id === "Completed"
      ) || { total: 0 };
      let WithdrawInterest = getWithdrawInterest.find(
        ({ _id }) => _id === "Completed"
      ) || { total: 0 };
      let deposit = getDeposit.find(({ _id }) => _id === "Completed") || {
        total: 0,
      };
      let interest = 0;
      if (getInterest.length > 0) {
        interest = getInterest[0].total;
      }
      let data = {
        WithdrawAll,
        WithdrawInterest,
        deposit,
        interest,
      };
      res.status(200).json({
        success: true,
        data,
      });
    } else {
      res.status(500).json({
        success: false,
        mesage: "You can't accept this action",
      });
    }
  } catch (err) {
    res.status(500).json({
      error: err,
    });
  }
};

exports.refesh_user = async (req, res, next) => {
  try {
    let users = await User.find().select("Wallet").exec();
    for (user of users) {
      builUserBalance(user._id);
    }
    res.json({
      success: true,
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

exports.get_revenue = async (req, res, next) => {
  const ability = defineAbilityFor(req.user);
  let perPage = 20; // số lượng sản phẩm xuất hiện trên 1 page
  let page = parseInt(req.query.page) || 1;
  try {
    let onTotal = Revenue.countDocuments({});
    let onRevenue = Revenue.find({})
      .populate("host", "email")
      .populate("partner", "email")
      .populate("interest", "amount")
      .sort({ updatedAt: "desc" })
      .skip(perPage * page - perPage) // Trong page đầu tiên sẽ bỏ qua giá trị là 0
      .limit(perPage);
    let [total, revenue] = await Promise.all([onTotal, onRevenue]);
    ForbiddenError.from(ability).throwUnlessCan("read", revenue);
    res.json({
      success: true,
      total,
      revenue,
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

exports.delete_revenue = async (req, res, next) => {
  const ability = defineAbilityFor(req.user);
  let id = req.params.id;
  try {
    let onrevenue = await Revenue.findById({ _id: id });
    ForbiddenError.from(ability).throwUnlessCan("delete", onrevenue);
    await onrevenue.remove();
    res.json({
      success: true,
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

exports.get_interest = async (req, res, next) => {
  const ability = defineAbilityFor(req.user);
  let perPage = 20; // số lượng sản phẩm xuất hiện trên 1 page
  let page = parseInt(req.query.page) || 1;
  try {
    let onTotal = Interest.countDocuments({});
    let oninterest = Interest.find({})
      .populate("user", "email")
      .sort({ updatedAt: "desc" })
      .skip(perPage * page - perPage) // Trong page đầu tiên sẽ bỏ qua giá trị là 0
      .limit(perPage);
    let [total, interest] = await Promise.all([onTotal, oninterest]);
    ForbiddenError.from(ability).throwUnlessCan("read", interest);
    res.json({
      success: true,
      total,
      interest,
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

exports.delete_interest = async (req, res, next) => {
  const ability = defineAbilityFor(req.user);
  let id = req.params.id;
  try {
    let oninterest = await Interest.findById({ _id: id });
    ForbiddenError.from(ability).throwUnlessCan("delete", oninterest);
    await oninterest.remove();
    res.json({
      success: true,
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

exports.admin_change_email = async (req, res, next) => {
  const ability = defineAbilityFor(req.user);
  let _id = req.params.id;
  let email = req.body.email.toLowerCase();
  try {
    let user = User.findById({ _id });
    let findEmail = User.findOne({ email: email });
    let [foundUser, foundEmail] = await Promise.all([user, findEmail]);
    if (foundEmail) {
      return res.status(403).json({
        success: false,
        message: "Email is already in use",
      });
    }
    ForbiddenError.from(ability).throwUnlessCan("update", foundUser);
    foundUser.email = email;
    await foundUser.save();
    res.status(200).json({
      success: true,
      message: "Email has been change",
    });
  } catch (err) {
    res.json(500).status({
      error: err,
      success: false,
      message: "Server Error",
    });
  }
};

exports.admin_get_user_revenue_history = async (req, res, next) => {
  let host = mongoose.Types.ObjectId(req.params.id);
  let perPage = 20; // số lượng sản phẩm xuất hiện trên 1 page
  let page = parseInt(req.query.page) || 1;
  try {
    let onUser = User.findById({ _id: host }).select("email");
    let onTotal = Revenue.countDocuments({ host: host });
    let onRevenue = Revenue.find({
      host: host,
    })
      .sort({ updatedAt: "desc" })
      .skip(perPage * page - perPage) // Trong page đầu tiên sẽ bỏ qua giá trị là 0
      .limit(perPage)
      .populate("interest", "amount")
      .populate("partner", "email")
      .exec();
    let [total, revenue, user] = await Promise.all([
      onTotal,
      onRevenue,
      onUser,
    ]);
    res.status(200).json({
      revenue,
      success: true,
      total,
      user,
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

exports.admin_get_chart = async (req, res, next) => {
  let rule = req.user.rule;
  let ability = defineAbilityFor(req.user);
  let startFormat = new Date();
  let endFormat = new Date();
  startFormat.setDate(startFormat.getDate() - 7); // set to 'now' minus 7 days.
  startFormat.setHours(0, 0, 0, 0); // set to midnight.
  try {
    if (rule == "admin") {
      let onDepositChart = Deposit.aggregate([
        {
          $match: {
            $and: [
              { updatedAt: { $gte: startFormat } },
              { updatedAt: { $lte: endFormat } },
              { status: "Completed" },
            ],
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } },
            list: { $push: "$$ROOT" },
            total: { $sum: { $multiply: ["$amount"] } },
            count: { $sum: 1 },
          },
        },
      ]);
      let [getDepositChart] = await Promise.all([onDepositChart]);
      ForbiddenError.from(ability).throwUnlessCan("read", getDepositChart);

      res.status(200).json({
        success: true,
        data: getDepositChart,
      });
    } else {
      res.status(500).json({
        success: false,
        mesage: "You can't accept this action",
      });
    }
  } catch (err) {
    res.status(500).json({
      error: err,
    });
  }
};

exports.admin_update_user_private = async (req, res, next) => {
  let _id = req.body.id;
  const ability = defineAbilityFor(req.user);
  try {
    let user = await User.findById({ _id });
    ForbiddenError.from(ability).throwUnlessCan("update", user);
    if (user) {
      user.private = !user.private;
    }
    await user.save();

    res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    res.status(404).json({
      error: err,
    });
  }
};

exports.getAllUserForSelect = async (req, res) => {
  const email = { $regex: new RegExp(`^${req.query.q.toLowerCase()}`) };
  try {
    // console.log(email)
    // const onUsers = User.find({email})
    //   .sort({ createdAt: 'desc' })
    //   .select('email');
    // const [users] = await Promise.all([onUsers]);
    // console.log(users)
    const users = await User.aggregate([
      { $match: { email: email } },
      {
        $group: {
          _id: "$_id",
          email: { $first: "$email" },
          username: { $first: "$username" },
          phonenumber: { $first: "$phonenumber" },
        },
      },
      { $limit: 20 },
    ]);
    res.json({
      success: true,
      users,
    });
  } catch (err) {
    res.json({
      success: false,
      message: "something wrong",
    });
  }
};

exports.getProducts = async (req, res) => {
  // const ability = defineAbilityFor(req.user);
  const { perPage } = req.body || 20;
  const page = parseInt(req.body.page) || 1;
  try {
    const onTotal = Product.countDocuments();
    const onProducts = Product.find()
      .sort({ createdAt: "desc" })
      .skip(perPage * page - perPage) // Trong page đầu tiên sẽ bỏ qua giá trị là 0
      .limit(perPage);
    const [total, products] = await Promise.all([onTotal, onProducts]);
    // ForbiddenError.from(ability).throwUnlessCan("read", products);
    res.status(200).json({
      message: "this is all products",
      total,
      products,
      success: true,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Cant get products",
      error: err,
      success: false,
    });
  }
};
exports.searchProducts = async (req, res) => {
  const title = req.body.title;
  try {
    console.log(title);
    const products = await Product.aggregate([
      { $match: { title: { $regex: title, $options: "i" } } }, // Use $regex for partial matching, "i" makes it case-insensitive
      { $limit: 20 },
    ]);
    console.log(products);
    res.json({
      success: true,
      products,
    });
  } catch (err) {
    res.status(500).json({
      message: "Please check correctness and try again",
      error: err,
      success: false,
    });
  }
};



exports.adminChangeInfo = async (req, res, next) => {
  const ability = defineAbilityFor(req.user);
  const email = req.body.email.toLowerCase();
  const { username, phonenumber, gender, bio, idname, rank, private, _id, rule, categories } =
    req.body;
  try {
    const onUser = User.findById({ _id }).select(
      "username email avatar bio phonenumber gender idname store rule"
    );
    const onEmail = User.findOne({ email });
    const onPhone = User.findOne({ phonenumber });
    const [user, inEmail, inPhone] = await Promise.all([
      onUser,
      onEmail,
      onPhone,
    ]);
    if (inEmail && inEmail.email !== user.email) {
      res.status(501).json({
        success: false,
        message: "Email này đã được dùng cho tài khoản khác",
      });
      return;
    } else if (inPhone && inPhone.phonenumber !== user.phonenumber) {
      res.status(502).json({
        success: false,
        message: "Số điện thoại này đã được dùng cho tài khoản khác",
      });
      return;
    } else {
      ForbiddenError.from(ability).throwUnlessCan("update", user);
      if (user) {
        user.email = email;
        user.username = username;
        user.idname = idname;
        user.phonenumber = phonenumber;
        user.bio = bio;
        user.gender = gender;
        user.rank = rank;
        user.private = private;
        user.rule = rule
      }
      user.categories = [];
      if (typeof categories === "object") {
        for (const u of categories) {
          const catId = {};
          catId._id = u;
          user.categories.push(catId);
        }
      } else {
        user.categories.push({
          _id: categories,
        });
      }
      await user.save();
      res.status(200).json({
        success: true,
        message: "Success",
        user
      });
    }
  } catch (err) {
    res.json(500).status({
      error: err,
      success: false,
      message: "Server Error",
    });
  }
};

exports.getUserLog = async (req, res, next) => {

  const ability = defineAbilityFor(req.user);
  const _id = req.params.id;

  try {
    const user = await User.findById(_id).select('username email')
   
    if (!user) {
      return res.status(404).json({ status: false, message: "User not found" });
    }

    ForbiddenError.from(ability).throwUnlessCan("read", user);

    // Fetch latest 10 user logs
    const userLogs = await UserLog.find({ user: user._id })
      .sort({ loginTime: -1 }) // Sort by newest first
      .limit(10) // Limit to last 10 logs
      .lean(); // Convert Mongoose objects to plain JS
    res.status(200).json({ status: true, userLogs, success: true, user });
  } catch (err) {
    console.error("Error fetching user logs:", err);
    res.status(500).json({ status: false, message: "Internal Server Error", error: err.message });
  }
};
