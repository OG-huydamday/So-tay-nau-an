# Các module API

Mỗi thư mục sở hữu router và phần xử lý của một nhóm nghiệp vụ. Bắt đầu với `routes.js`, tách `service.js` khi router cần xử lý nhiều bước. Model dùng chung ở `../models` và middleware dùng chung ở `../middleware`.

| Thư mục | Người phụ trách |
| --- | --- |
| `catalog` | A · công thức và danh mục công khai |
| `auth`, `community`, `admin` | B · tài khoản, đánh giá/bình luận, quản trị |
| `planner` | C · thực đơn, lưu món, dữ liệu đi chợ |

Ngày ghép module, B nối MongoDB cho server và đăng ký các router trong `../app.js`. Các luồng và cấu trúc dữ liệu xem [hợp đồng API](../../../../docs/API.md).
