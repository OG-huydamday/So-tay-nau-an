# Dữ liệu mẫu kickoff

`kickoff.json` là ví dụ JSON để P1, P2 và P3 thống nhất cách nối màn hình với API. ID và email là dữ liệu minh họa. Khi chốt hợp đồng API trong buổi đầu, sửa cả ví dụ và màn hình sử dụng nếu có thay đổi.

| Khóa | API dự kiến | Nội dung |
| --- | --- | --- |
| `loginSuccess`, `loginError` | POST `/api/auth/login` | Ví dụ thành công có `user` và lỗi thông tin đăng nhập. API thật dùng cookie phiên. |
| `recipeList`, `recipeDetail` | GET `/api/recipes`, GET `/api/recipes/:id` | Danh sách và chi tiết công thức công khai. |
| `weeklyMenu` | GET `/api/me/weekly-menu?weekStart=2026-11-23` | Ví dụ tuần có một món. P3 và P1 chốt thêm payload lưu theo hợp đồng tổng thể. |

Dữ liệu mẫu chỉ dùng trong lúc dựng UI. Danh sách trang chủ có sáu món thuộc bốn nhóm. Thời gian, độ khó và khẩu phần là ví dụ cho giao diện. Demo tích hợp dùng API và dữ liệu seed thật.

Ảnh trứng chiên cà chua, phở bò và bộ minh họa lợi ích được tạo bằng ImageGen. Ảnh bún thịt nướng và crème brûlée lấy từ [TheMealDB](https://www.themealdb.com/), ảnh sinh tố xoài cam lấy từ [TheCocktailDB](https://www.thecocktaildb.com/). Ảnh salad có sẵn trong phần giao diện P3, cần bổ sung nguồn trước khi phát hành.
