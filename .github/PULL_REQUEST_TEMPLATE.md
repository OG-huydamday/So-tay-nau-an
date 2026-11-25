## Mô tả ngắn gọn thay đổi
- 

## Kiểm tra quy trình và mã nguồn (bắt buộc tích trước khi mở PR)
- [ ] Nhánh được tách trực tiếp từ `main` mới nhất (không tách từ nhánh `feat/*` khác).
- [ ] Tên nhánh đặt đúng chuẩn `feat/<ten-task>`.
- [ ] Code API đặt đúng trong `apps/api/src/features/` và dùng **named export** khi import model.
- [ ] Truy vấn món công khai sử dụng đúng `published.*` và `publicRecipeFilter()`.
- [ ] Định dạng JSON trả về khớp hợp đồng API (`{ items, page, limit, total }` / `{ code, message }`).
- [ ] Không sửa đè vào file dùng chung (`app.js`, `auth.jsx`, `main.jsx`) ngoài phạm vi task mà chưa báo nhóm.
- [ ] Đã chạy `npm run check` (lint + build) và `npm test` đạt 100%.

## Bằng chứng kiểm thử / Cách chạy thử
- 
