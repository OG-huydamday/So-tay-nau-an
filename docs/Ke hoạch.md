# Kế hoạch khởi động đồ án sổ tay công thức nấu ăn

Nhóm có 15 ngày từ 21/11 đến 05/12/2026, dự kiến 2–3 giờ/người/ngày. Mục tiêu ngày 02/12 là chạy đủ chức năng bắt buộc trên main. Ngày 03–04/12 dành cho triển khai, kiểm thử và sửa lỗi. Ngày 05/12 nghiệm thu và bàn giao.

## Mục tiêu sản phẩm

Người dùng tìm món theo tên, nguyên liệu, loại món, thời gian hoặc độ khó. Thành viên đăng công thức, đánh giá, lưu món yêu thích, lập thực đơn tuần và xem danh sách đi chợ. Quản trị viên duyệt bài, quản lý loại món, xử lý bình luận và xem xếp hạng. Buổi demo cuối đi qua đủ ba vai trò khách, thành viên và quản trị viên.

## Phân vai và việc nhận ngay

| Vai trò | Phụ trách | Việc đầu tiên và cách kiểm tra |
| --- | --- | --- |
| **P1 — Trưởng nhóm** | Cơ sở dữ liệu, tài khoản, quyền truy cập, đánh giá và tích hợp | Xác nhận MongoDB chạy, tạo dữ liệu tài khoản demo và nối API đăng nhập. Kiểm một lần đăng nhập đúng và một lần sai. |
| **P2 — Công thức** | Tìm kiếm, đăng/sửa/xóa, ảnh, duyệt công thức và loại món | Chốt dữ liệu món mẫu và API danh sách món đã duyệt. Mở một món chi tiết bằng ID, xác nhận món chờ duyệt không xuất hiện công khai. |
| **P3 — Giao diện và thực đơn** | Layout chung, đăng nhập/khám phá ban đầu, yêu thích, thực đơn và đi chợ | Dựng form đăng nhập và màn danh sách từ JSON mẫu. Nối API khi P1/P2 có bản chạy và thử hiển thị lỗi khi đăng nhập sai. |

Điền tên thật cho từng vai trò trong buổi đầu. P1 cùng P2 chốt định dạng dữ liệu cho P3. Vòng kiểm tra chéo gồm P2 xem việc của P1, P3 xem việc của P2 và P1 xem việc của P3.

## Hướng triển khai

Giao diện đặt trong `apps/web` với React/Vite. API đặt trong `apps/api` với Express/Mongoose. Hai phần dùng chung quy ước dữ liệu trong kế hoạch tổng thể. Dùng Redux Toolkit cho thực đơn và một client API dùng chung. Khi API đang được viết, giao diện có thể phát triển với [JSON mẫu](fixtures/README.md).

1. Cả ba clone cùng repo, chạy `npm ci` và `npm run dev`. Xác nhận mở được trang web và `/api/health`.
2. Mỗi người mở một việc nhỏ ghi người làm, người review, kết quả cần đạt và cách thử. Tạo nhánh theo việc từ `main`, chẳng hạn `feat/login-api`.
3. Trước khi mở PR, chạy `npm run check` và `npm test`, rồi ghi cách thử hoặc đính kèm ảnh. Ghép vào `main` sau khi có người review và các kiểm tra đạt.
4. Khi bị chặn, báo trong nhóm hạng mục đang thiếu và người cần phối hợp. Ghi kết quả thử sau khi ghép để cả nhóm biết điều gì đã chạy với dữ liệu thật.

## Các mốc kiểm tra

| Mốc | Kết quả cần thấy |
| --- | --- |
| **21–23/11** | Đăng nhập, tìm và mở món từ dữ liệu thật. |
| **24–27/11** | Tìm theo nguyên liệu, đăng món có ảnh, duyệt và đánh giá. |
| **28/11–02/12** | Hoàn tất quản trị, yêu thích, thực đơn và đi chợ trên main. |
| **03–04/12** | Triển khai, kiểm thử chéo, sửa lỗi và tập demo. |
| **05/12** | Nghiệm thu và bàn giao mã nguồn, hướng dẫn, báo cáo và demo. |

Xem [kế hoạch tổng thể](KE-HOACH-TONG-THE-BEP-NHA.md) để tra lịch từng ngày, hợp đồng API và ca nghiệm thu. Phần cộng điểm được xem xét sau khi chức năng bắt buộc đã qua kiểm thử.
