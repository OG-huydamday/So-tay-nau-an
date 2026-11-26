# Các module API

Mỗi thư mục sở hữu router và phần xử lý của một nhóm nghiệp vụ. Bắt đầu với `routes.js`, tách `service.js` khi router cần xử lý nhiều bước. Model dùng chung ở `../models` và middleware dùng chung ở `../middleware`.

| Thư mục | Người phụ trách |
| --- | --- |
| `auth`, `reviews` | Huy · tài khoản, đánh giá, bình luận và xếp hạng |
| `catalog`, `uploads` | Duy Anh · công thức, kiểm duyệt công thức, loại món và ảnh |
| `planner` | Phú · thực đơn, lưu món và dữ liệu đi chợ |

Huy nối MongoDB và phối hợp đăng ký các router trong `../app.js`. Xem [hợp đồng API đích](../../../../docs/KE-HOACH-TONG-THE-BEP-NHA.md#7-hợp-đồng-api-chốt-cho-nhóm).
