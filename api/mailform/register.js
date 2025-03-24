const mailer = require("../middleware/mailer");
const config = require("../config/index");
const Setting = require("../models/setting");

const SendmailUserSignUp = async (user) => {
  const setting = await Setting.findOne();
  const html = accountCreated(user.username, setting);
  const html1 = newUserMail(user, setting);
  await Promise.all([
    mailer.sendEmail(setting.email, `Thành viên mới tạo trên ${config.NAME_WEBSITE}`, html1),
    mailer.sendEmail(
      user.email ? user.email : setting.email,
      "Xác nhận đăng ký của bạn",
      html
    ),
  ]);
};

const appForgotPass = async (user, code) => {
 const setting = await Setting.findOne();
  const html = sendEmailAppForgotPass(user.username, code, setting);
  await Promise.all([
    mailer.sendEmail(
      user.email ? user.email : setting.email,
      "Đặt lại mật khẩu",
      html
    ),
  ]);
};

const PassChanged = async (user) => {
  const setting = await Setting.findOne();
  const html = sendEmailPassChanged(user.username, setting);
  await Promise.all([
    mailer.sendEmail(
      user.email ? user.email : setting.email,
      "Thay đổi mật khẩu thành công",
      html
    ),
  ]);
};

const revenueCreated = async (user) => {
  const setting = await Setting.findOne();
  const html = sendEmailRevenueCreated(user.username, setting);
  await Promise.all([
    mailer.sendEmail(
      user.email ? user.email : setting.email,
      "Huê hồng đã được chấp thuận",
      html
    ),
  ]);
};

const accountCreated = (username, setting) => `
<div style="max-width: 600px; font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
  <p style="font-size: 18px;">Xin chào: <strong>${username}</strong>,</p>

  <p style="font-size: 16px;">Cảm ơn bạn đã tin tưởng và đăng ký tài khoản tại <strong>${setting.address}</strong>.</p>

  <p style="font-size: 16px;">
    Tài khoản của bạn đã được tạo thành công, và bạn có thể bắt đầu khám phá ngay:
  </p>
  <ul style="font-size: 16px; margin-left: 20px;">
    <li>Xem và sử dụng các tính năng độc quyền.</li>
    <li>Quản lý thông tin cá nhân và các đơn hàng (nếu có).</li>
    <li>[Bất kỳ ưu đãi hoặc đặc quyền nào khác bạn muốn giới thiệu]</li>
  </ul>

  <p style="font-size: 16px;">
    Nếu bạn cần hỗ trợ hoặc có bất kỳ câu hỏi nào, đừng ngần ngại liên hệ với chúng tôi qua thông tin bên dưới.
  </p>

  <div class="footer-mail" style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 14px;">
    <p>${setting.contact}</p>
  </div>
</div>
`;


const newUserMail = (user, setting) => `
    <p>Email: ${user.email}</p>
    <p>Số điện thoại: ${user.phonenumber}</p>
    <p>Tên thành viên: ${user.username}</p>
    <p>Tạo lúc: ${user.createdAt}</p>
${setting.contact}
`;

// const forgotPass = (username, token) => `
// <div style="max-width: 600px;">
// <p>Dear: <strong>${username}</strong></p>

// <p>You have requested to reset your password, to continue Please copy this code and paste at confirm step.</p>

// <a style="max-width:200px; padding:15px;display: block;
// margin-left: auto;
// margin-right: auto; border: 1px solid #111; font-size: 18px; color:#111; font-weight: 600; text-align: center" href="${process.env.MAINconfig.MAIN_WEBSITE}reset/${token}" target="_blank">
// Click Here
// </a>

// <p>If you have any questions about trading with <strong>SHOPCOINUSA</strong>, do not hesitate to contact our Support team via <a href="#">Live Chat</a> or <a href="mailto:paymentshopcoinusa@gmail.com">email.</a></p>

// <p>Kind Regards,</p>

// <p>Shopcoin Support Team</p>

// </div>

// `;

const sendEmailAppForgotPass = (username, code, setting) =>
  `
<div>
<p>Xin chào: <strong>${username}</strong></p>

<p>Bạn đã yêu cầu đặt lại mật khẩu của mình, để tiếp tục Vui lòng sao chép mã này và dán ở bước xác nhận.</p>

<div style="font-size: 22px; color:#111; font-weight: 600">${code}</div>

<p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với nhóm Hỗ trợ của chúng tôi.</p>

${setting.contact}

</div>`;

const sendEmailPassChanged = (username, setting) =>
  `
<div style="max-width: 600px;">
<p>Xin chào: <strong>${username}</strong></p>

<p>Xin chúc mừng! Mật khẩu mới của bạn đã được thay đổi thành công.</p>

<p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với nhóm Hỗ trợ của chúng tôi.</p>

${setting.contact}

</div>`;

const sendEmailRevenueCreated = (username, setting) => 
  `<div style="max-width: 600px;">
<p>Xin chào ${username},<p>

Xin chúc mừng, có một huê hồng của bạn vừa được phê duyệt và huê hồng này sẽ được tính là huê hồng có thể rút ra. Bạn có thể xem chi tiết thống kê của bạn tại
${config.MAIN_WEBSITE}profile/revenue
${setting.contact}
</div>
`;

module.exports = {
  appForgotPass,
  PassChanged,
  SendmailUserSignUp,
  revenueCreated,
};
