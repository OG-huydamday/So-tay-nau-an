# Thiết kế giao diện Bếp Nhà

## Hệ thiết kế đề xuất

Giao diện lấy ảnh món ăn làm điểm nhấn, dùng nền kem và chữ xanh sẫm. Tên làm việc là **Bếp Nhà**. Nhóm có thể đổi tên trước khi dựng logo hoặc chụp hình thuyết trình.

| Hạng mục | Quyết định |
| --- | --- |
| Màu nền / bề mặt | `#F7F3E8` / `#FFFDF7` |
| Chữ chính / phụ | `#233328` / `#4F6255` |
| Nút chính | `#254C39` với chữ trắng |
| Trạng thái nhấn / lỗi | Cam đất `#A84325`, đi cùng chữ hoặc biểu tượng |
| Chữ | Be Vietnam Pro cho nội dung, Playfair Display cho tiêu đề lớn. Dùng system-ui và Georgia khi font chưa tải. Kiểm tra dấu tiếng Việt trước khi chốt. |
| Khoảng cách | 4, 8, 12, 16, 24, 32, 48 px. Màn desktop giới hạn nội dung 1200 px. |
| Thành phần | Thẻ bo 16 px, viền `#D8D4C5`, ảnh cover 4:3, nút cao tối thiểu 44 px. |

## Bản đồ màn hình

| Đường dẫn | Thành phần chính | Phụ trách |
| --- | --- | --- |
| `/` | Khám phá, nhập tên hoặc nguyên liệu, bộ lọc loại/thời gian/độ khó, lưới thẻ và phân trang | P3 giao diện, P2 API |
| `/cong-thuc/:id` | Ảnh, thời gian, độ khó, nguyên liệu, bước làm, đánh giá, lưu và thêm món vào tuần | P2 nội dung món, P1 đánh giá, P3 yêu thích và thực đơn |
| `/cong-thuc/moi` và `/cong-thuc/:id/sua` | Form ảnh, tên, loại, nguyên liệu và bước động, xem lỗi tại trường | P2 |
| `/cong-thuc-cua-toi` | Công thức của mình, trạng thái duyệt, mở chi tiết riêng, sửa và xóa | P2 |
| `/dang-nhap`, `/dang-ky` | Form tài khoản, quay lại trang trước sau xác thực | P1 xác thực, P3 form đăng nhập |
| `/yeu-thich` | Các món đã lưu, hủy lưu, mở chi tiết | P3 |
| `/thuc-don` | Bảng 7 ngày × 3 bữa, chọn món, chỉnh khẩu phần, đi chợ | P3 |
| `/quan-tri` | Hàng đợi duyệt, kiểm tra chi tiết, bình luận, loại món và xếp hạng | P1 bình luận và xếp hạng, P2 công thức và loại món, P3 bố cục |

## Wireframe khám phá

```text
┌────────────────────────────────────────────────────────────┐
│ Bếp Nhà          Khám phá   Thực đơn            Đăng nhập   │
├────────────────────────────────────────────────────────────┤
│ Hôm nay nấu gì?               │                            │
│ [ Theo tên | Theo nguyên liệu ]│   Ảnh món ăn tại nhà       │
│ [ VD: trứng, cà chua        ] │                            │
├────────────────────────────────────────────────────────────┤
│ [Loại món ▾]  [Tổng thời gian ▾]  [Độ khó ▾]  Xóa bộ lọc    │
│ Công thức phù hợp                                12 kết quả│
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐          │
│ │ Ảnh       ♡  │ │ Ảnh       ♡  │ │ Ảnh       ♡  │          │
│ │ Tên món      │ │ Tên món      │ │ Tên món      │          │
│ │ 15 phút · Dễ │ │ 30 phút · Vừa│ │ 20 phút · Dễ │          │
│ │ Khớp 2/2     │ │ Khớp 1/2     │ │ Khớp 1/2     │          │
│ └──────────────┘ └──────────────┘ └──────────────┘          │
└────────────────────────────────────────────────────────────┘
```

Đổi tab tìm kiếm trì hoãn gọi API bằng `useDebounce`. Xóa điều kiện hoặc thay bộ lọc đưa về trang 1. Với 0 kết quả, giữ nguyên từ khóa và cho xóa lọc ngay. Ẩn dòng số nguyên liệu khớp khi đang tìm theo tên.

## Wireframe chi tiết và form

```text
CHI TIẾT                          FORM ĐĂNG HOẶC SỬA
┌─────────────────────────┐      ┌─────────────────────────┐
│ Ảnh bìa                  │      │ Ảnh bìa [Chọn tệp]      │
│ Tên món         [Lưu ♡]  │      │ Tên · Mô tả · Loại món  │
│ Thời gian · Độ khó · ★   │      │ Thời gian · Khẩu phần   │
│ [Thêm vào thực đơn]      │      │                         │
├───────────┬─────────────┤      │ Nguyên liệu             │
│ Nguyên    │ Các bước    │      │ [Tên][Lượng][Đơn vị][×] │
│ liệu      │ 1. Nội dung │      │ [+ Thêm nguyên liệu]    │
│           │    [Ảnh]    │      │                         │
│ [-] 2 [+] │ 2. Nội dung │      │ Các bước                │
├───────────┴─────────────┤      │ [Nội dung][Ảnh][Xóa]    │
│ Đánh giá của cộng đồng   │      │ [+ Thêm bước]           │
│ [1–5 sao] [Bình luận]    │      │        [Gửi duyệt]      │
└─────────────────────────┘      └─────────────────────────┘
```

Chỉnh khẩu phần ngay chi tiết là phần cộng điểm. P3 dùng tỷ lệ khẩu phần trong từng ô thực đơn để tính đi chợ nhất quán. Với form, gán ID ổn định cho dòng thêm/bớt để giữ focus và kiểm tra quyền ở API khi nhấn lưu. Khi chờ duyệt, trang cá nhân hiển thị trạng thái «Chờ duyệt» kèm hành động xem lại.

## Wireframe thực đơn và admin

```text
THỰC ĐƠN TUẦN                            QUẢN TRỊ
┌───────────────────────────────┐        ┌──────────────────────────┐
│ Thực đơn tuần      [Lưu]      │        │ [Duyệt] [Bình luận]      │
│        T2 T3 T4 T5 T6 T7 CN  │        │ [Loại món] [Xếp hạng]    │
│ Sáng   +  +  +  +  +  +  +   │        ├──────────────────────────┤
│ Trưa   +  +  +  +  +  +  +   │        │ Món · Tác giả · Gửi lúc │
│ Tối    +  +  +  +  +  +  +   │        │ [Xem chi tiết] [Duyệt]   │
│                               │        │ [Chuyển sang ẩn]         │
│ Danh sách đi chợ              │        └──────────────────────────┘
│ □ Trứng              5 quả    │
│ □ Cà chua            300 g    │
└───────────────────────────────┘
```

Trên điện thoại, thực đơn hiển thị nhóm theo ngày, mỗi nhóm có ba hàng, cùng thứ tự với desktop. Popup chọn món có tìm kiếm, danh sách món phù hợp và nhập khẩu phần. Hiển thị trạng thái lỗi khi lưu, giữ thay đổi để thử lại. Admin xem đầy đủ công thức trước khi duyệt, yêu cầu xác nhận với hành động ẩn hoặc xóa.

## Điều kiện giao diện chung

- Kiểm tra riêng ở 360 px, 768 px và 1280 px. Lưới khám phá tương ứng 1, 2 và 3 cột. Chi tiết thu về một cột trên màn hình hẹp.
- Dùng nhãn cho ô nhập, focus nhìn thấy được, hỗ trợ bàn phím, mô tả ảnh phù hợp và thông báo tải/xong/lỗi. Trạng thái duyệt đi cùng chữ.
- Chuẩn bị ảnh mẫu có quyền sử dụng và lưu nguồn. Thử ảnh thiếu hoặc lỗi với placeholder có tỉ lệ đồng nhất.
- Sau MVP, có thể thêm chế độ nấu theo bước với hẹn giờ và vùng in thực đơn riêng qua `@media print` để lưu PDF từ trình duyệt.
