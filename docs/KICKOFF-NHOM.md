# Kế hoạch khởi động đồ án sổ tay công thức nấu ăn

**Thời gian tiếp tục 21/11–15/12/2026.** Nhóm dự kiến dành 2–3 giờ/người/ngày. Mốc nội bộ là **09/12 có đủ chức năng bắt buộc chạy cùng nhau**. Hẹn 30 phút cho buổi đầu để kiểm kê phần đã làm, chạy bộ khung và chốt việc của từng người.

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
| **21/11** | Cả ba chạy bộ khung, chốt phân vai và nhận việc đầu tiên. |
| **26/11** | Đăng nhập tài khoản mẫu, tìm món và mở chi tiết từ dữ liệu thật. |
| **03/12** | Đăng công thức có ảnh, duyệt công thức và thử đánh giá. |
| **09/12** | Chạy đủ chức năng bắt buộc trên `main`, gồm thực đơn và danh sách đi chợ. |
| **10–12/12** | Tích hợp, kiểm thử chéo và sửa lỗi từ bản demo. |
| **13–15/12** | Dự phòng và tập demo. Bàn giao mã nguồn, hướng dẫn chạy, bản demo và báo cáo ngày 15/12. |

Xem [kế hoạch tổng thể](KE-HOACH-TONG-THE-BEP-NHA.md) để tra lịch từng ngày, hợp đồng API và ca nghiệm thu. Phần cộng điểm được xem xét sau khi chức năng bắt buộc đã qua kiểm thử.
