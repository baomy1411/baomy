# Bảo My Shop — triển khai Render (Node.js + PostgreSQL)

## Đã bổ sung trong bản này
- Backend Express, PostgreSQL: lưu đơn hàng tập trung; kiểm tra dữ liệu ở máy chủ; lấy giá từ database; khóa tồn kho trong transaction để tránh đặt vượt số lượng; mã đơn hàng; trạng thái đơn.
- Trang quản trị tại `/admin`: đăng nhập, thống kê, xem đơn hàng, đổi trạng thái, sửa giá/tồn kho/ẩn sản phẩm.
- API sức khỏe `/api/health`, giới hạn tần suất đăng nhập và gửi đơn, Helmet, token quản trị hết hạn sau 8 giờ.
- Checkout gửi đơn lên máy chủ thay vì chỉ lưu `localStorage`. Giỏ hàng chỉ bị xóa sau khi server xác nhận đã lưu đơn.
- Render Blueprint `render.yaml`, PostgreSQL và hướng dẫn này.

## Triển khai
1. Giải nén dự án và đưa toàn bộ nội dung thư mục `baomyshop` lên một GitHub repository mới (không đưa thư mục `.git` cũ, `node_modules`, mật khẩu hay file `.env`).
2. Trên Render chọn **New → Blueprint**, kết nối repository và xác nhận `render.yaml`. Blueprint tạo Node web service và PostgreSQL. Database `basic-256mb` là gói trả phí; kiểm tra giá hiện hành trước khi xác nhận. Nếu muốn dùng database riêng, cập nhật `DATABASE_URL` trong Environment.
3. Khi Render hỏi giá trị `ADMIN_PASSWORD`, đặt một mật khẩu quản trị mạnh, riêng biệt, tối thiểu 16 ký tự. `ADMIN_TOKEN_SECRET` được sinh tự động bởi Blueprint; kiểm tra biến này tồn tại.
4. Đợi deploy hoàn tất. Kiểm tra `https://TEN-MIEN.onrender.com/api/health` trả về `{"ok":true,"database":true}`.
5. Mở `https://TEN-MIEN.onrender.com/admin`, đăng nhập bằng `ADMIN_PASSWORD`, kiểm tra tồn kho ban đầu và chỉnh đúng số lượng thực tế trước khi mở bán.
6. Đặt một đơn thử nghiệm COD; kiểm tra đơn xuất hiện trong trang quản trị và tồn kho giảm. Sau đó hủy đơn thử để xác nhận tồn kho được cộng lại. Xóa/đánh dấu đơn thử trước khi bán thật.

## API chính
- `GET /api/health` — tình trạng database.
- `GET /api/products` — sản phẩm và tồn kho hiện tại.
- `POST /api/orders` — tạo đơn, body gồm `name`, `phone`, `address`, `method` (`cod`/`bank`), `coupon`, `items: [{id,size,qty}]`.
- `POST /api/admin/login` — nhận token quản trị.
- `/api/admin/summary`, `/api/admin/orders`, `/api/admin/products` — cần Bearer token.

## Những cấu hình chủ shop cần tự hoàn tất
- **Thông tin ngân hàng/QR:** kiểm tra lại `BANK` trong `js/products.js` (tên ngân hàng, số tài khoản, chủ tài khoản, ảnh QR). Không công khai trước khi chắc chắn đúng.
- **Tồn kho:** khi database mới tạo, các sản phẩm được khởi tạo tồn kho 20 sản phẩm mỗi mã để dễ kiểm thử. Đây chỉ là giá trị mặc định kỹ thuật; phải vào `/admin` nhập tồn kho thực tế trước khi bán.
- **Chính sách kinh doanh:** cập nhật chính sách giao hàng, đổi trả, bảo mật, điều khoản mua hàng, địa chỉ/số liên hệ thật và thông tin xuất hóa đơn nếu áp dụng. Không dùng thông tin mẫu.
- **Thanh toán chuyển khoản:** hiện QR chỉ hỗ trợ khách chuyển tiền thủ công. Chưa có webhook ngân hàng, đối soát giao dịch hoặc tự xác nhận đã thanh toán. Chủ shop cần kiểm tra tài khoản ngân hàng trước khi chuyển trạng thái đơn.
- **Thông báo đơn hàng:** đơn được lưu trong database và hiển thị trong `/admin`; email/Zalo/SMS thông báo chưa được tích hợp. Có thể cấu hình dịch vụ email hoặc webhook sau này.
- **Ảnh sản phẩm:** một số ảnh dùng URL bên ngoài. Đảm bảo bạn có quyền sử dụng ảnh và URL còn hoạt động.
- **Domain:** Render cấp tên miền `onrender.com`; có thể gắn tên miền riêng và kiểm tra HTTPS sau khi deploy.

## Lưu ý vận hành
- Đơn được tạo sẽ trừ tồn kho; khi đổi trạng thái sang `cancelled`, hệ thống cộng lại tồn kho. Không đổi đơn đã hủy trở lại trạng thái khác tự động.
- Mã giảm giá hiện có `BAOMY10` và `FREESHIP`; backend tự tính lại giảm giá và phí giao hàng. Không tin số tiền do trình duyệt gửi lên.
- Dự án này không lưu thông tin thẻ ngân hàng. Không nhập thông tin bí mật vào source code.
- Trước khi mở bán: kiểm tra log Render, kiểm thử trên điện thoại, xác nhận giá/tồn kho, kiểm thử đơn hàng, chính sách và thông tin liên hệ.
