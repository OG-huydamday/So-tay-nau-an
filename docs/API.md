# Hợp đồng API v1

Tài liệu này là hợp đồng để nhóm triển khai đồng thời. Hiện repo chỉ mở route `GET /api/health`. Trao đổi trong PR nếu cần đổi contract, cập nhật tài liệu và fixture cùng lúc.

## Quy ước

- Base URL `/api`. JSON dùng `camelCase`, ID MongoDB xuất thành chuỗi `id` và thời gian theo ISO 8601. Chỉ phản hồi các trường trong hợp đồng, loại bỏ `_id`, `__v`, mật khẩu và dữ liệu nội bộ.
- Route cá nhân nhận `Authorization: Bearer <token>`. `401` khi chưa xác thực, `403` khi thiếu quyền thao tác, `404` khi đối tượng không tồn tại hoặc nội dung chưa công khai qua route công khai.
- Lỗi `{ "message": "…", "code": "RECIPE_NOT_OWNED", "details": {} }`. `400` cho dữ liệu sai, `409` cho xung đột và đã đánh giá, `413` cho ảnh quá dung lượng, `415` cho định dạng ảnh không hỗ trợ.
- Danh sách trả `{ "items": [], "page": 1, "limit": 12, "total": 0 }` nếu có phân trang. `page` bắt đầu từ 1, `limit` tối đa 48. Danh sách nhỏ như thể loại có thể trả `{ "items": [] }`.

## A · Công thức và khám phá

| Method và đường dẫn | Quyền | Request → response |
| --- | --- | --- |
| `GET /categories` | Công khai | `{items: Category[]}` |
| `GET /recipes` | Công khai | `q`, `category` (slug), `maxMinutes`, `difficulty`, `ingredients` (CSV), `page`, `limit` → `RecipeCard[]` có phân trang |
| `GET /recipes/:id` | Công khai | `RecipeDetail` nếu đã duyệt |
| `GET /me/recipes` | Thành viên | Công thức của mình, có trạng thái và phân trang |
| `GET /me/recipes/:id` | Chủ công thức | `RecipeDetail` kể cả bản chờ hoặc bị ẩn |
| `POST /recipes` | Thành viên | `RecipeInput` → `201 RecipeDetail`, `pending` |
| `PUT /recipes/:id` | Chủ công thức | `RecipeInput` → `RecipeDetail`, `pending` |
| `DELETE /recipes/:id` | Chủ công thức | Đặt `hidden`, `204` |
| `POST /uploads` | Thành viên | `multipart/form-data`, một trường `image` → `201 {url}` |

`maxMinutes` tính cả sơ chế và nấu. `difficulty` nhận `Dễ`, `Vừa`, `Khó`. Thiết lập thứ tự mặc định ổn định theo `createdAt DESC, id DESC`. Khi có `ingredients`, trả thêm `matchedCount` và xếp theo `matchedCount DESC, ratingAverage DESC, id DESC`. Giới hạn tối đa 12 tên và tránh chuỗi truy vấn dài bất thường. API kiểm tra loại món tồn tại trước khi tạo/sửa.

`RecipeCard` có `id`, `title`, `summary`, `image`, `category` (`id`, `name`, `slug`, `icon`), `cookMinutes`, `prepMinutes`, `difficulty`, `servings`, `ratingAverage`, `ratingCount`. `RecipeDetail` thêm `author` (`id`, `name`), `ingredients`, `steps`, `tags`, `createdAt` và `updatedAt`. Trả thêm `status` trong route cá nhân và admin.

```json
{
  "title": "Trứng xào cà chua",
  "summary": "Món nhanh cho bữa tối trong tuần.",
  "image": "/uploads/8a29a7c4.jpg",
  "category": "65d0afbb1234567890123456",
  "prepMinutes": 5,
  "cookMinutes": 10,
  "difficulty": "Dễ",
  "servings": 2,
  "ingredients": [
    { "name": "trứng", "quantity": 3, "unit": "quả", "note": "" },
    { "name": "cà chua", "quantity": 200, "unit": "g" }
  ],
  "steps": [
    { "text": "Rửa và cắt cà chua thành múi cau.", "image": "/uploads/0f83cb21.webp", "timerMinutes": 0 },
    { "text": "Xào đến khi cà chua mềm rồi cho trứng vào.", "timerMinutes": 4 }
  ],
  "tags": ["món nhanh"]
}
```

`steps[].order` do server gán theo vị trí bắt đầu từ 1. UI hỗ trợ thêm/bớt/sắp thứ tự; số lượng và văn bản được validation ở cả hai đầu. Ảnh bìa bắt buộc, ảnh từng bước tùy chọn. A triển khai Multer với giới hạn 5 MB, JPEG/PNG/WebP, kiểm tra signature của file trên server trước khi lưu, đổi tên ngẫu nhiên và trả URL tương đối. Ghi nhận người upload hoặc dùng upload token để ngăn gắn ảnh người khác. Tránh dùng tên tệp do người dùng gửi để tạo đường dẫn.

## B · Xác thực, cộng đồng và admin

| Method và đường dẫn | Quyền | Request → response |
| --- | --- | --- |
| `POST /auth/register` | Công khai | `{name,email,password}` → `201 {token,user}` với role `member` |
| `POST /auth/login` | Công khai | `{email,password}` → `{token,user}` |
| `GET /auth/me` | Thành viên | `{user}` với `id`, `name`, `email`, `role` |
| `GET /recipes/:id/reviews` | Công khai | `{items,page,limit,total}` của bình luận hiển thị kèm sao |
| `POST /recipes/:id/reviews` | Thành viên | `{stars: 1..5, comment}` → `201 {review,ratingAverage,ratingCount}` |
| `GET /admin/recipes?status=pending` | Admin | Danh sách công thức cần duyệt, có phân trang |
| `GET /admin/recipes/:id` | Admin | Chi tiết công thức gồm nguyên liệu, bước, ảnh và trạng thái |
| `PATCH /admin/recipes/:id/status` | Admin | `{status:"approved"\|"hidden"}` → `RecipeDetail` |
| `GET /admin/comments?status=visible` | Admin | Danh sách bình luận, tác giả và tên món, có phân trang |
| `PATCH /admin/comments/:id/status` | Admin | `{status:"hidden"}` → `{id,status}` |
| `POST /admin/categories` | Admin | `{name,slug,icon,color}` → `201 Category` |
| `PUT /admin/categories/:id` | Admin | `{name,slug,icon,color}` → `Category` |
| `DELETE /admin/categories/:id` | Admin | `204` nếu không có tham chiếu, `409` nếu đang dùng |
| `GET /admin/stats/top-recipes?limit=10` | Admin | `{items: RecipeCard[]}` |

Review công khai trả `{id, author:{id,name}, stars, comment, createdAt}`. Chỉ đánh giá món đã duyệt. Trả `409 REVIEW_ALREADY_EXISTS` cho lần gửi thứ hai của cùng tài khoản trên cùng một món. Khi lưu, map `stars` sang `Rating.value` và `comment` sang `Comment.content`, tạo liên kết `Comment.rating` để truy vấn rõ ràng. Comment ẩn không xuất qua endpoint công khai. Thống kê dùng món đã duyệt và có ít nhất một lượt đánh giá, xếp theo `ratingAverage DESC, ratingCount DESC, id DESC`.

## C · Yêu thích, thực đơn và dữ liệu đi chợ

| Method và đường dẫn | Quyền | Request → response |
| --- | --- | --- |
| `GET /me/favorites` | Thành viên | `{items: RecipeCard[]}` chỉ gồm món đã duyệt |
| `PUT /me/favorites/:recipeId` | Thành viên | Lưu món đã duyệt, `204`, gọi lặp không tạo bản sao |
| `DELETE /me/favorites/:recipeId` | Thành viên | Hủy lưu, `204` |
| `GET /me/weekly-menu` | Thành viên | `{meals: MealView[]}`, rỗng cho người dùng mới |
| `PUT /me/weekly-menu` | Thành viên | `{meals: MealInput[]}` → `{meals: MealView[]}` |

`MealInput` là `{day, slot, recipeId, servings}`. `day` từ 0 (thứ Hai) đến 6 (Chủ nhật). `slot` nhận `breakfast`, `lunch`, `dinner`. `servings` là số nguyên 1–50. `MealView` thêm `recipe` gồm `id`, `title`, `image`, `servings`, `ingredients` hoặc `null` cho món không còn khả dụng. Khi lưu, chỉ chấp nhận món không khả dụng ở ô cũ với cùng `recipeId`, để các ô còn lại vẫn cập nhật được. Trả `400` nếu trùng ô hoặc dữ liệu sai. Mọi thao tác cá nhân lấy user từ token.

Redux Toolkit giữ dữ liệu thực đơn và trạng thái `idle/loading/saving/error`. Ngày 0 và `breakfast` là hai trường độc lập trong API. Client có thể lập khóa ô `0:breakfast`. Selector dùng `reduce` để gom theo tên chuẩn hóa và đơn vị. Planner làm việc từ response `MealView`; seed và mock minh họa số khẩu phần khác nhau và nguyên liệu trùng.
