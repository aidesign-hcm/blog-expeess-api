const config = require("../config/index");
var moment = require("moment");
const Setting = require("../models/setting");
const fs = require('fs');

const mailer = require("../middleware/mailer");

const SendmailOrder = async (order,  username) => {
  const setting = await Setting.findOne();
  const html = onOrderInfo(order, setting,  username);
  const html1 = orderInfo(order, setting);
  await Promise.all([
    mailer.sendEmail(
      setting.email,
      `Bạn nhận được đơn hàng mới từ ${setting.address}`,
      html1
    ),
    mailer.sendEmail(
      order.receiveAdd.email ? order.receiveAdd.email : setting.email,
      `"Xác nhận đơn đặt hàng số "${order.orderid}`,
      html
    ),
  ]);
};

const orderDone = async (order) => {
  const setting = await Setting.findOne();
  const html = sendOrderDone(order, setting);
  await Promise.all([
    mailer.sendEmail(
      order.receiveAdd.email,
      `Xác nhận đơn hàng: #${order.orderid} của quý khách. (Giữ email cẩn thận nhé!)`,
      html
    ),
  ]);
};

const formatPerPrice = (product) => {
  let price = 0;
  if (product.term) {
    if (product.term.salePrice) {
      price = product.term.salePrice.toLocaleString("vi-VN", {
        style: "currency",
        currency: "VND",
      });
    } else {
      price = product.term.price.toLocaleString("vi-VN", {
        style: "currency",
        currency: "VND",
      });
    }
  } else {
    if (product.salePrice) {
      price = product.salePrice.toLocaleString("vi-VN", {
        style: "currency",
        currency: "VND",
      });
    } else {
      price = product.price.toLocaleString("vi-VN", {
        style: "currency",
        currency: "VND",
      });
    }
  }
  return price;
};

const formatPrice = (product) => {
  let price = 0;
  if (product.term) {
    if (product.term.salePrice) {
      price = (product.quantity * product.term.salePrice).toLocaleString(
        "vi-VN",
        {
          style: "currency",
          currency: "VND",
        }
      );
    } else {
      price = (product.quantity * product.term.price).toLocaleString("vi-VN", {
        style: "currency",
        currency: "VND",
      });
    }
  } else {
    if (product.salePrice) {
      price = (product.quantity * product.salePrice).toLocaleString("vi-VN", {
        style: "currency",
        currency: "VND",
      });
    } else {
      price = (product.quantity * product.price).toLocaleString("vi-VN", {
        style: "currency",
        currency: "VND",
      });
    }
  }
  return price;
};

const onOrderInfo = (order, setting, username) => {
  let top = `<table
align="center"
border="0"
cellspacing="0"
cellpadding="0"
width="720"
bgcolor="#ffffff"
>
<tbody>
  <tr>
    <td style="padding:0 16px;line-height:30px">
      <p style="margin:16px 0 10px">
      Xin chào quý khách hàng: ${username}
      </p>
      <p style="margin:10px 0">
        ${setting.address} rất vui thông báo đơn hàng <b>#${
    order.orderid
  }</b> của quý khách đã được tiếp nhận và đang trong quá trình xử lý.
      </p>
      <p style="margin:10px 0">
      ${setting.address} sẽ gửi email thông báo đến quý khách khi đơn hàng được đóng gói và chuyển sang đơn vị vận chuyển.
      </p>
    </td>
  </tr>
  <tr>
    <td>
      <div style="border:2px solid #2f5acf;padding:8px 16px;border-radius:16px;margin-top:16px">
        <p style="margin:10px 0 20px;font-weight:bold;font-size:20px">
          THÔNG TIN ĐƠN HÀNG
          <a
          href="${config.MAIN_WEBSITE}dashboard/orders/${order._id}"
            style="color:#2f5acf;text-decoration:none"
            target="_blank"
          >
            #${order.orderid}
          </a>
          <span style="font-weight:normal">${moment(order.createdAt).format(
            "YYYY-MM-DD"
          )}</span>
        </p>
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tbody>
            <tr>
              <td valign="top">
                <p style="margin:10px 0;font-weight:bold">
                  <b>Địa chỉ giao hàng</b>
                </p>
                <p style="margin:10px 0">Tên khách hàng: ${
                  order.receiveAdd.username
                }</p>
                <p style="margin:10px 0">Số điện thoại: ${
                  order.receiveAdd.phonenumber
                }</p>
                <p style="margin:10px 0">
                  Địa chỉ: ${order.receiveAdd.street}, ${
    order.receiveAdd.village
  }, ${order.receiveAdd.district}, ${order.receiveAdd.city}
                </p>
              </td>
            </tr>
            <tr>
              <td colspan="2">
                <p style="margin:10px 0">
                  <b>Phương thức thanh toán:</b> ${order.paymentGateway}
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </td>
  </tr>
  <tr>
    <td>
      <div style="border:2px solid #2f5acf;padding:8px 16px;border-radius:16px;margin-top:16px">
        <p style="margin:10px 0 20px;font-weight:bold;font-size:20px">
          CHI TIẾT ĐƠN HÀNG
        </p>
        <table
          class="m_-6129297155174307195table"
          cellpadding="0"
          cellspacing="0"
          border="0"
          width="100%"
          style="font-size:14px"
        >
          <thead>
            <tr>
              <th width="40%" style="text-align:left">
                Tên sản phẩm
              </th>
              <th width="20%">Số Lượng</th>
              <th width="20%">Giá bán</th>
              <th width="20%">Thành Tiền</th>
            </tr>
          </thead>
          <tbody>`;
  let orderSingle = "";
  for (const product of order.products) {
    // Build product details dynamically
  let productDetails = `<p style="margin:5px 0 0">${product.title}</p>`;
  
  if (product.term) {
    productDetails += `<span style="font-size:12px;display:block">Chọn: ${product.term.name}</span>`;
  }
  
  if (product.dateMatch && product.isMatch) {
    productDetails += `<span style="font-size:12px;display:block">Thời Gian: ${moment(product.dateMatch)
      .tz("Asia/Ho_Chi_Minh")
      .format("HH:mm DD/MM/YYYY")}</span>`;
  }
  
  if (product.stadium && product.isMatch) {
    productDetails += `<span style="font-size:12px;display:block">SVD: ${product.stadium}</span>`;
  }

  // Add the row for the current product
  orderSingle += `<tr>
    <td style="text-align:left; padding: 10px 20px; background-color: #d9d9d9; border: 1px solid white;">
      ${productDetails}
    </td>
    <td style="text-align:center; padding: 10px 20px; background-color: #d9d9d9; border: 1px solid white;">
      ${product.quantity}
    </td>
    <td style="text-align:center; padding: 10px 20px; background-color: #d9d9d9; border: 1px solid white;">
      <b>${formatPerPrice(product)}</b>
      <del style="font-size:12px"></del>
    </td>
      <td style="text-align:right; padding: 10px 20px;
        background-color: #d9d9d9;
        border: 1px solid white;">${formatPrice(product)}</td>
  </tr>`;
  }
  let end = `</tbody>
  <tfoot>
    <tr>
      <td colspan="3">Mã giảm giá</td>
      <td style="text-align:right">${order.couponName}</td>
    </tr>
    <tr>
      <td colspan="3">Tổng giá trị sản phẩm</td>
      <td style="text-align:right">${(
        order.totalPrice +
        order.discount -
        order.shippingPrice
      ).toLocaleString("vi-VN", {
        style: "currency",
        currency: "VND",
      })}</td>
    </tr>
    <tr>
      <td colspan="3">Số tiền giảm giá</td>
      <td style="text-align:right">${order.discount.toLocaleString("vi-VN", {
        style: "currency",
        currency: "VND",
      })}</td>
    </tr>
    <tr>
      <td colspan="3">Phí vận chuyển</td>
      <td style="text-align:right">${order.shippingPrice.toLocaleString(
        "vi-VN",
        {
          style: "currency",
          currency: "VND",
        }
      )}</td>
    </tr>
    <tr>
      <td colspan="3">
        <b>Tổng thanh toán</b>
      </td>
      <td style="text-align:right">
        <b>${order.totalPrice.toLocaleString("vi-VN", {
          style: "currency",
          currency: "VND",
        })}</b>
      </td>
    </tr>
    <tr>
      <td colspan="3">
        <b>Hình thức thanh toán</b>
      </td>
      <td style="text-align:right">
        <b>${order.paymentGateway}</b>
      </td>
    </tr>
  </tfoot>
</table>

</div>
<div>
${setting.contact}
</div>
</td>
</tr>
</tbody>
</table>`;
  return top + orderSingle + end;
};

const orderInfo = (order, setting) => {
  let top = `<table
  align="center"
  border="0"
  cellspacing="0"
  cellpadding="0"
  width="720"
  bgcolor="#ffffff"
  >
  <tbody>
    <tr>
      <td style="padding:0 16px;line-height:30px">
        <p style="margin:16px 0 10px">
        Mã đơn hàng mới: ${order.orderid}
        </p>
        <p style="margin:10px 0 0">
          Bạn có thể nhấn vào link dưới đây để theo dõi và cập nhật
          trạng thái đơn hàng
        </p>
        <p style="margin:10px 0 0;text-align:center">
          <a
            href="${config.ADMIN_WEBSITE}secret/order/${order._id}"
            style="background-color:#f9f86c;color:black;text-decoration:none;border-radius:16px;display:inline-block;padding:8px 32px;margin-bottom:16px"
            target="_blank"
          >
            <b>#${order.orderid}</b>
          </a>
        </p>
      </td>
    </tr>
    <tr>
      <td>
        <div style="border:2px solid #2f5acf;padding:8px 16px;border-radius:16px;margin-top:16px">
          <p style="margin:10px 0 20px;font-weight:bold;font-size:20px">
            THÔNG TIN ĐƠN HÀNG
            <a
            href="${config.MAIN_WEBSITE}dashboard/orders/${order._id}"
              style="color:#2f5acf;text-decoration:none"
              target="_blank"
            >
              #${order.orderid}
            </a>
            <span style="font-weight:normal">${moment(order.createdAt).format(
              "YYYY-MM-DD"
            )}</span>
          </p>
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tbody>
              <tr>
                <td valign="top">
                  <p style="margin:10px 0;font-weight:bold">
                    <b>Địa chỉ giao hàng</b>
                  </p>
                  <p style="margin:10px 0">Tên khách hàng: ${
                    order.receiveAdd.username
                  }</p>
                  <p style="margin:10px 0">Số điện thoại: ${
                    order.receiveAdd.phonenumber
                  }</p>
                  <p style="margin:10px 0">
                    Địa chỉ: ${order.receiveAdd.street}, ${
    order.receiveAdd.village
  }, ${order.receiveAdd.district}, ${order.receiveAdd.city}
                  </p>
                </td>
              </tr>
              <tr>
                <td colspan="2">
                  <p style="margin:10px 0">
                    <b>Phương thức thanh toán:</b> ${order.paymentGateway}
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </td>
    </tr>
   
    <tr>
      <td>
        <div style="border:2px solid #2f5acf;padding:8px 16px;border-radius:16px;margin-top:16px">
          <p style="margin:10px 0 20px;font-weight:bold;font-size:20px">
            CHI TIẾT ĐƠN HÀNG
          </p>
          <table
            class="m_-6129297155174307195table"
            cellpadding="0"
            cellspacing="0"
            border="0"
            width="100%"
            style="font-size:14px"
          >
            <thead>
              <tr>
              <th width="40%" style="text-align:left">
                Tên sản phẩm
              </th>
              <th width="20%">Số Lượng</th>
              <th width="20%">Giá bán</th>
              <th width="20%">Thành tiền</th>
            </tr>
            </thead>
            <tbody>`;
  let orderSingle = "";
  for (const product of order.products) {
   // Build product details dynamically
  let productDetails = `<p style="margin:5px 0 0">${product.title}</p>`;
  
  if (product.term) {
    productDetails += `<span style="font-size:12px;display:block">Chọn: ${product.term.name}</span>`;
  }
  
  if (product.dateMatch && product.isMatch) {
    productDetails += `<span style="font-size:12px;display:block">Thừoi gian: ${moment(product.dateMatch)
      .tz("Asia/Ho_Chi_Minh")
      .format("HH:mm DD/MM/YYYY")}</span>`;
  }
  
  if (product.stadium && product.isMatch) {
    productDetails += `<span style="font-size:12px;display:block">SVD: ${product.stadium}</span>`;
  }

  // Add the row for the current product
  orderSingle += `<tr>
    <td style="text-align:left; padding: 10px 20px; background-color: #d9d9d9; border: 1px solid white;">
      ${productDetails}
    </td>
    <td style="text-align:center; padding: 10px 20px; background-color: #d9d9d9; border: 1px solid white;">
      ${product.quantity}
    </td>
    <td style="text-align:center; padding: 10px 20px; background-color: #d9d9d9; border: 1px solid white;">
      <b>${formatPerPrice(product)}</b>
      <del style="font-size:12px"></del>
    </td>
    <td style="text-align:right; padding: 10px 20px;
        background-color: #d9d9d9;
        border: 1px solid white;">${formatPrice(product)}</td>
  </tr>`;
  }
  let end = `</tbody>
    <tfoot>
      <tr>
        <td colspan="3">Mã giảm giá</td>
        <td style="text-align:right">${order.couponName}</td>
      </tr>
      <tr>
        <td colspan="3">Tổng giá trị sản phẩm</td>
        <td style="text-align:right">${(
          order.totalPrice +
          order.discount -
          order.shippingPrice
        ).toLocaleString("vi-VN", {
          style: "currency",
          currency: "VND",
        })}</td>
      </tr>
      <tr>
        <td colspan="3">Số tiền giảm giá</td>
        <td style="text-align:right">${order.discount.toLocaleString("vi-VN", {
          style: "currency",
          currency: "VND",
        })}</td>
      </tr>
      <tr>
        <td colspan="3">Phí vận chuyển</td>
        <td style="text-align:right">${order.shippingPrice.toLocaleString(
          "vi-VN",
          {
            style: "currency",
            currency: "VND",
          }
        )}</td>
      </tr>
      <tr>
        <td colspan="3">
          <b>Tổng thanh toán</b>
        </td>
        <td style="text-align:right">
          <b>${order.totalPrice.toLocaleString("vi-VN", {
            style: "currency",
            currency: "VND",
          })}</b>
        </td>
      </tr>
      <tr>
        <td colspan="3">
          <b>Hình thức thanh toán</b>
        </td>
        <td style="text-align:right">
          <b>${order.paymentGateway}</b>
        </td>
      </tr>
    </tfoot>
  </table>
  
  </div>
  <div>
  ${setting.contact}
  </div>
  </td>
  </tr>
  </tbody>
  </table>`;
  return top + orderSingle + end;
};

const sendOrderDone = (order, setting) => {
  if (!order || !Array.isArray(order.products)) {
    throw new Error("Invalid order data.");
  }

  const renderProductDetails = (product) => {
    let details = `<p style="line-height: 1.2; font-size: 18px; font-weight: 500; margin-bottom: 0px; display: inline-block;">
      ${product.title || "No Title"}</p>`;

    if (product.term) {
      details += `<span style="font-size:12px;display:block">Chọn: ${product.term.name}</span>`;
    }

    if (product.dateMatch && product.isMatch) {
      details += `<span style="font-size:12px;display:block">
        Thời gian: ${moment(product.dateMatch).tz("Asia/Ho_Chi_Minh").format("HH:mm DD/MM/YYYY")}</span>`;
    }

    if (product.stadium && product.isMatch) {
      details += `<span style="font-size:12px;display:block">SVD: ${product.stadium}</span>`;
    }

    return details;
  };

  const renderProductBlock = (product) => {
    const imageSrc = config.CDN_WEBSITE + product.productImage || "https://via.placeholder.com/120x96";
    const productDetails = renderProductDetails(product);

    return `<div style="margin-top: 30px; min-height: 150px; display: table;">
      <img
        src="${imageSrc}"
        alt=""
        style="width: 120px; height: 96px; margin-right: 20px;"
      />
      <div
        style="
          display: table-cell;
          vertical-align: top;
          width: 360px;
          line-height: 1.7;
          font-size: 14px;
        "
      >
        Người đặt: ${order.receiveAdd?.username || "Unknown"}
        ${productDetails}
        <br />
      </div>
    </div>`;
  };

  let orderSingle = "";
  for (const product of order.products) {
    orderSingle += renderProductBlock(product);
  }

  const emailContent = `
    <div style="width: 600px; margin: 0 auto; background: #fff;">
      <table align="center" border="0" cellpadding="0" style="border-spacing: 0;">
        <tbody>
          <tr>
            <td>
              <div
                style="
                  padding: 30px 50px 0px;
                  background: #fff;
                  font-size: 14px;
                  line-height: 1.7;
                  width: 596px;
                  box-sizing: border-box;
                "
              >
                <p style="margin-top: 0; font-weight: bold; font-size: 18px;">
                  <b style="font-size: 18px;">Xin chào ${order.receiveAdd.username || "Khách hàng"}</b><br />
                </p>

                <p>
                  Đơn hàng của bạn cho <b>#${order.orderid}</b> đã xác nhận. Tuyệt vời! <br /><br />
                  Giờ bạn có thể xem voucher của mình trong email này. Kiểm tra kỹ các thông tin và cách đổi voucher trước khi đi bạn nhé!
                </p>

                <p>
                  <b>Cách sử dụng: </b>Xuất trình voucher của bạn (trên điện thoại hay in sẵn) để sử dụng.
                </p>

                <p style="margin: 20px 0; text-align: center;">
                  <a
                    style="
                      text-decoration: none;
                      background: #fbbf24;
                      color: #fff;
                      height: 40px;
                      line-height: 40px;
                      padding: 0 30px;
                      font-weight: bold;
                      border-radius: 2px;
                      display: inline-block;
                      font-size: 16px;
                    "
                    href="${config.MAIN_WEBSITE}order/${order._id}?orderid=${order.orderid}&createdAt=${order.createdAt.toISOString()}"
                    target="_blank"
                  >
                    Xem voucher
                  </a>
                </p>
                <p style="font-weight: 300; text-align: center; color: #999999;">
                  (Bạn có thể tìm bản sao của voucher trong email này)
                </p>

                <p
                  style="
                    border: 0;
                    margin: 30px 0;
                    padding: 0;
                    background-color: #eee;
                    height: 1px;
                  "
                ></p>
                <p style="margin: 0;">
                  Số đơn hàng: ${order.orderid}
                  <span style="float: right; color: #999; font-size: 14px;">
                    Ngày đặt: ${moment(order.createdAt).format("YYYY-MM-DD")}
                  </span>
                </p>
                ${orderSingle}
              </div>

              <div style="margin-bottom: 32px;">
                <table
                  align="center"
                  border="0"
                  cellpadding="0"
                  cellspacing="0"
                  style="
                    border-collapse: collapse;
                    font-size: 14px;
                    border-radius: 6px;
                  "
                >
                  <tbody>
                    <tr>
                      <td>
                        <div>
                          <a
                            href="${config.MAIN_WEBSITE}dashboard/orders"
                            style="
                              height: 36px;
                              border-radius: 4px;
                              background-color: #ffffff;
                              border: solid 1px #fbbf24;
                              padding: 8px 24px;
                              box-sizing: border-box;
                              display: inline-block;
                              color: #fbbf24;
                              font-weight: 500;
                              font-size: 14px;
                              text-decoration: none;
                            "
                            target="_blank"
                          >
                            Quản lý đơn hàng
                          </a>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div>${setting.contact || "No contact info available."}</div>
    </div>
  `;

  return emailContent;
};

const vpsOnline = (username, vps) => `
<div style="max-width: 600px;">
<p>Xin chào ${username},<strong><br></strong></p>
<p>VPS của quý khách đã được thiết lập và đi vào hoạt động. Ngay bây giờ, quý khách có thể quản trị VPS của mình tại <a href="${config.ADMIN_WEBSITE}" target="_blank">${config.ADMIN_WEBSITE}</a>.</p>
<h3><strong>Thông tin dịch vụ</strong></h3>
<p><span>Sản phẩm/Dịch vụ:</span>${vps.product.title}</p>
<p><strong>Thông tin truy cập VPS</strong></p>
<ul>
<li><strong>Địa chỉ IP</strong>: ${vps.ipAddress}</li>
<li><strong>Hostname</strong>: ${vps.hostname}</li>
<li><strong>Tên truy cập</strong>: root</li>
<li><strong>Mật khẩu</strong>: ${vps.password}</li>
</ul>
<p></p>
<h3>Lưu ý về mật khẩu</h3>
<p>Nếu VPS của quý khách đặt mật khẩu quá đơn giản, xin vui lòng truy cập vào trang quản trị để đổi lại mật khẩu phức tạp hơn nhằm phòng tránh các rủi ro bị chiếm mật khẩu bởi các phần mềm tự dò mật khẩu tự động (brute force attack).</p>
<h3><strong>Các hướng dẫn cơ bản<br></strong></h3>
<p>Nếu quý khách chưa có kinh nghiệm sử dụng VPS và cần cài đặt webserver hoặc các bảng điều khiển như cPanel, VestaCP,...vui lòng liên hệ với bộ phận kỹ thuật để được hỗ trợ.</p>
<p>Vui lòng cung cấp các thông tin cần thiết cho kỹ thuật viên trong nội dung ticket chẳng hạn như mật khẩu root, domain và mô tả chi tiết vấn đề cần hỗ trợ. Điều này sẽ giúp các quản trị viên của chúng tôi nắm bắt được vấn đề và từ đó&nbsp;rút ngắn thời gian hỗ trợ.</p>
<p>---<br>
<p>Dịch VỤ VPSVNN</p>
<p>Tel - Zalo: 0987836022</p>
<p>Email kỹ thuật: lamvanhieu@live.com (Phản hồi trong 15 PHÚT)</p>
<br>
<br>
</div>
`;

module.exports = {
  onOrderInfo,
  orderInfo,
  orderDone,
  vpsOnline,
  SendmailOrder
};
