# Phân công nhóm ba người

Điền tên thật trước buổi bắt đầu. Mỗi người sở hữu một nhóm chức năng từ API đến màn hình, đồng thời có một người khác review PR. A, B, C chạy các phần song song sau khi thống nhất [API](API.md).

| Người | Sở hữu | Đầu ra và điều kiện bàn giao | Reviewer |
| --- | --- | --- | --- |
| A · `________` | Khám phá, công thức và giao diện chung | Routes catalog, tìm/lọc/aggregation, custom hook, form động, upload ảnh, CRUD có quyền sở hữu, màn chi tiết và điều hướng. Tìm từ 2 nguyên liệu xếp đúng, khách chỉ thấy món đã duyệt và tài khoản khác sửa/xóa nhận `403`. | B |
| B · `________` | Xác thực, cộng đồng và quản trị | Kết nối MongoDB, đăng ký/đăng nhập, phân quyền, review nguyên tử, duyệt món, ẩn bình luận, CRUD loại món, bảng xếp hạng, tài khoản seed. Hai yêu cầu review trùng gửi đồng thời chỉ có một `201`, route quản trị từ thành viên nhận `403`. | C |
| C · `________` | Yêu thích, thực đơn và đi chợ | Routes planner, Redux store/slice và selector, UI lưu món và lưới 21 ô, lưu lại sau tải lại, cộng nguyên liệu theo tên + đơn vị và tỷ lệ khẩu phần. Ô sai hoặc trùng bị API từ chối, thử lại sau lỗi giữ dữ liệu đang nhập. | A |

## Backlog theo người

| ID | Việc | Ưu tiên | Phụ thuộc |
| --- | --- | --- | --- |
| A1 | Layout, route công khai, thẻ món, trạng thái tải/rỗng/lỗi | Bắt buộc | API fixture |
| A2 | Danh mục công khai, bộ lọc, tìm tên, `$in` + Aggregation, `useDebounce` | Bắt buộc | A1, model danh mục |
| A3 | Form nguyên liệu và bước động, ảnh bìa/ảnh bước, Multer và kiểm tra file | Bắt buộc | B1 cho route ghi |
| A4 | Trang cá nhân, kiểm tra ownership, gửi duyệt lại sau khi sửa | Bắt buộc | A3, B1, B3 |
| B1 | DB, auth, seed dữ liệu và admin local, HTTP client, route guard | Bắt buộc | `.env`, demo fixture chung |
| B2 | Đánh giá kèm bình luận, unique index, cập nhật average/count cùng giao dịch | Bắt buộc | B1, mẫu công thức đã duyệt |
| B3 | Duyệt công thức, ẩn bình luận, quản lý loại món, món xếp hạng cao | Bắt buộc | B1, B2 cho bảng điểm |
| C1 | Lưu/hủy yêu thích, trang danh sách, nút trên thẻ và chi tiết | Bắt buộc | B1, A1 |
| C2 | API lập tuần, Redux slice, 21 ô và lưu dữ liệu | Bắt buộc | B1, API `RecipeCard` |
| C3 | Selector `reduce`, giao diện danh sách đi chợ và khẩu phần theo ô | Bắt buộc | C2, mẫu món trùng nguyên liệu |
| A5 | Tỷ lệ khẩu phần tại trang chi tiết và chế độ nấu từng bước có hẹn giờ | Cộng điểm | A4 |
| C4 | In thực đơn tuần, bố cục giấy và lưu PDF | Cộng điểm | C2–C3 |

## Mốc làm việc đề xuất

1. **Ngày 1 · Chốt hợp đồng.** Gán tên A/B/C, mở ba nhánh `feat/catalog`, `feat/community-admin`, `feat/weekly-planner`. Thống nhất fixture JSON có 2 loại món, 3 công thức đã duyệt (ít nhất 2 công thức trùng nguyên liệu), 1 bản chờ, 2 thành viên và 1 admin. B cung cấp seed local và tài khoản demo trong tài liệu nhóm. A và C dùng fixture lúc kết nối backend chưa xong.
2. **Ngày 2–4 · Dựng luồng song song.** A làm A1–A3, B ưu tiên B1 rồi B2/B3, C song song C1–C3 bằng fixture. PR nhỏ theo từng ID. A giữ layout/router, B giữ `apps/api/src/app.js` và cấu hình kết nối, C giữ `store.js`. B đăng ký tất cả router khi các module sẵn sàng, A ghép các màn và ba người ghép providers cùng lúc.
3. **Ngày 5–6 · Ghép và nghiệm thu.** Ghép B1 trước, tiếp theo catalog và phần còn lại. Mỗi người review một luồng của người khác, nhập lỗi với bước tái hiện, sửa lỗi chặn demo trước. Chỉ làm phần cộng điểm sau khi checklist bắt buộc đạt.
4. **Ngày 7 · Bàn giao.** Cập nhật README về seed, chụp ảnh từng luồng, lưu bằng chứng kiểm thử và chạy thử demo liền mạch. Mỗi người chuẩn bị giải thích phần kỹ thuật chính do mình phụ trách.

Mốc này là gợi ý 7 ngày làm việc. PR mô tả ID, cách chạy, ví dụ request/response cho thay đổi API và ảnh nếu đổi UI. Sau review, ghép khi `npm run check` và `npm test` đạt. Chỉ commit dữ liệu demo, không commit `.env`, ảnh tải lên trong phiên hoặc mật khẩu thật.

## Nghiệm thu và demo

| Ca demo | Kết quả cần thấy | Người trình bày |
| --- | --- | --- |
| Tìm `trứng, cà chua`, thêm bộ lọc thời gian | Món khớp cả hai lên đầu, bộ lọc giữ đúng và giới hạn món công khai | A |
| Thành viên đăng món, thêm/xóa dòng nguyên liệu và bước, gửi ảnh hợp lệ | Công thức chờ duyệt, ảnh hỏng hoặc quá dung lượng bị từ chối | A |
| Tài khoản thứ hai gửi PUT/DELETE tới món vừa tạo | API trả `403`, trạng thái và nội dung giữ nguyên | A |
| Admin xem chi tiết rồi duyệt món | Món xuất hiện khi khách tìm; thành viên mở route admin nhận `403` | B |
| Hai thành viên đánh giá lần lượt 5 và 3 sao | Trung bình 4.0 và 2 lượt, yêu cầu đánh giá lại cùng món trả `409` | B |
| Admin ẩn bình luận, sửa loại món và xem xếp hạng | Bình luận biến mất công khai, sao giữ nguyên, thứ tự bảng hạng đúng | B |
| Lưu món và lập thực đơn ở hai ngày khác nhau | Sau tải lại vẫn đúng người dùng, đúng ngày, đúng bữa | C |
| Hai món cùng dùng trứng theo `quả` và một nguyên liệu có hai đơn vị khác nhau | Trứng cộng đúng sau điều chỉnh khẩu phần, hai đơn vị vẫn tách dòng | C |
| Thu nhỏ xuống màn hình điện thoại và dùng bàn phím | Duyệt món, gửi form và thao tác thực đơn được | C |

Đề nghị mỗi người lưu một ca kiểm thử lỗi quan trọng vào `apps/api/test/integration` hoặc ghi rõ bước tái hiện trong PR. Cập nhật danh sách trên nếu nhóm đổi hành vi. Kết quả chạy khi bàn giao bộ khung chỉ xác nhận phần khởi động và phép gộp đã có sẵn.
