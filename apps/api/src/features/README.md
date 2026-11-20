# Các module API

Mỗi thư mục sở hữu router và phần xử lý của một nhóm nghiệp vụ. Bắt đầu với `routes.js`, tách `service.js` khi router cần xử lý nhiều bước. Model dùng chung ở `../models` và middleware dùng chung ở `../middleware`.

| Thư mục | Người phụ trách |
| --- | --- |
| `auth`, `reviews` | P1 · tài khoản, đánh giá, bình luận và xếp hạng |
| `catalog`, `uploads` | P2 · công thức, kiểm duyệt công thức, loại món và ảnh |
| `planner` | P3 · thực đơn, lưu món và dữ liệu đi chợ |

P1 nối MongoDB và phối hợp đăng ký các router trong `../app.js`. Các thư mục `community` và `admin` trong bộ khung là vị trí sơ bộ. Xem [hợp đồng API đích](../../../../docs/KE-HOACH-TONG-THE-BEP-NHA.md#7-hợp-đồng-api-chốt-cho-nhóm).
