# Quy trình làm việc và quy chuẩn mã nguồn — Bếp Nhà

Tài liệu ngắn gọn này giúp cả nhóm (**Huy**, **Duy Anh**, **Phú**) tránh conflict Git và lệch cấu trúc khi làm việc song song. Xem chi tiết thiết kế tại [docs/KE-HOACH-TONG-THE-BEP-NHA.md](docs/KE-HOACH-TONG-THE-BEP-NHA.md).

---

## 1. Quy trình Git chống conflict

1. **Luôn tách nhánh từ `main` mới nhất**:
   ```powershell
   git checkout main
   git pull origin main
   git checkout -b feat/ten-task
   ```
   - Không tách nhánh mới từ một nhánh `feat/*` khác đang làm dở.
   - Đặt tên nhánh theo tính năng (`feat/recipe-write`, `feat/weekly-menu`, `feat/reviews`), không ghép tên người hoặc ngày tháng.
2. **Giữ đúng phạm vi file của task & tách file riêng**:
   - Không tự ý sửa đổi code trong các file dùng chung (`apps/api/src/app.js`, `apps/web/src/p3/main.jsx`, `apps/web/src/p3/auth.jsx`, `apps/web/src/p3/style.css`) ngoài phạm vi công việc của mình nếu chưa báo trước trong nhóm.
   - **Frontend**: Mỗi tính năng tự tạo file `.jsx` và `.css` riêng trong `apps/web/src/features/<tên-module>/` (không viết component mới vào `p3/main.jsx` hay dồn CSS mới vào `p3/style.css`). Ở `p3/main.jsx` chỉ import trang đó và thêm đúng 1 dòng `<Route>`.
   - **Backend**: Khi gắn API mới vào `apps/api/src/app.js`, không sửa các dòng `app.use(...)` đang có, chỉ thêm dòng `app.use(...)` của module mình ngay trước `notFound` theo đúng đường dẫn đã phân chia:
     - **Huy**: `/api/auth`, `/api/recipes/:id/reviews`, `/api/admin/reviews`, `/api/admin/stats/top-recipes`
     - **Duy Anh**: `/api/me/recipes`, `/api/recipes` (`POST`/`PUT`/`DELETE`/`submit`), `/api/uploads`, `/api/admin/recipes`, `/api/admin/categories`
     - **Phú**: `/api/me/favorites`, `/api/me/weekly-menu`

---

## 2. Quy chuẩn kỹ thuật bắt buộc (API & Web)

### Backend (`apps/api`)
- **Import Model**: Tất cả các model trong `apps/api/src/models/` đều dùng **named export**, không dùng default import:
  ```js
  import { Recipe, publicRecipeFilter } from '../../models/Recipe.js';
  import { Category } from '../../models/Category.js';
  ```
- **Schema `Recipe`**:
  - Dữ liệu công khai nằm trong `published.*` (`published.title`, `published.titleSearch`, `published.totalMinutes`, `published.ingredients.nameNormalized`...).
  - Bản đang soạn/chờ duyệt nằm trong `draft.*`.
  - Mọi truy vấn hiển thị công khai bắt buộc dùng `publicRecipeFilter()` (`published: { $ne: null }, visibility: 'visible', deletedAt: null`).
- **Tổ chức thư mục**: Đặt router và xử lý nghiệp vụ trong `apps/api/src/features/<tên-module>/` (không tạo thư mục `src/routes/` bên ngoài).
- **Hợp đồng API**:
  - Danh sách phân trang: `{ items, page, limit, total }`.
  - Chi tiết công thức công khai: trả object làm phẳng `{ id, title, summary, image, ... }`, không bọc trong `{ data }`.
  - Phản hồi lỗi: `{ code, message }` (tên mã lỗi in hoa như `INVALID_INPUT`, `NOT_FOUND`, `CONFLICT`, `FORBIDDEN`).
  - Thao tác ghi (`POST`, `PUT`, `PATCH`, `DELETE`) sau đăng nhập bắt buộc qua middleware `protectWrites` (đã gắn sẵn ở `/api`).

### Frontend (`apps/web`)
- Đặt component và CSS theo đúng module trong `apps/web/src/features/<tên-module>/`.
- Tìm kiếm cần debounce (~350ms) và dùng `AbortController` hủy request cũ.
- Mọi thao tác ghi API cần đọc cookie `csrf` và gửi kèm header `X-CSRF-Token`.

---

## 3. Kiểm tra trước khi push & mở PR

Chạy từ thư mục gốc và đảm bảo đạt 100% trước khi mở Pull Request:

```powershell
npm run check
npm test
```
