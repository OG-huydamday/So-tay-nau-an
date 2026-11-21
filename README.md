# Sổ tay công thức nấu ăn

Đề 3 — Website chia sẻ công thức, tìm món từ nguyên liệu đang có và lên thực đơn tuần. API kết nối MongoDB, hỗ trợ đăng nhập bằng cookie và trả danh sách công thức công khai. Web có trang chủ, thẻ công thức mẫu và form đăng nhập.

## Bắt đầu

Dùng Node.js 22.12+ và npm. Sau khi clone repo chung, chạy từ thư mục gốc trên PowerShell.

```powershell
npm ci
if (!(Test-Path -LiteralPath .env)) {
  $secret = node -p "require('node:crypto').randomBytes(32).toString('hex')"
  (Get-Content -Raw .env.example).Replace('replace-with-a-long-random-string', $secret) | Set-Content .env
}
docker compose up -d --wait mongo
npm run seed:accounts
npm run seed:catalog -w @bep-nha/api
npm run dev
```

- Web: <http://localhost:5173> (khớp `CLIENT_URL` trong `.env`).
- API qua proxy của Vite: <http://127.0.0.1:5173/api/health> → `{"status":"ok","stage":"scaffold"}`
- Trước khi mở PR, chạy `npm run check` và `npm test`.

Seed tạo `demo@example.test` (member) và `admin@example.test` (admin). Lần đầu, lưu mật khẩu mà lệnh in ra hoặc đặt trước `DEMO_MEMBER_PASSWORD` và `DEMO_ADMIN_PASSWORD` trong `.env`. Chạy lại seed giữ mật khẩu và dữ liệu hiện có.

Form P3 gửi JSON `{email,password}` đến `POST /api/auth/login` qua proxy Vite. Đăng nhập đúng trả `200 {user:{id,name,email,role}}` cùng cookie phiên HttpOnly có hạn 8 giờ. Sai thông tin trả `401` theo fixture `loginError`. Với yêu cầu ghi sau đăng nhập, đọc cookie `csrf` và gửi giá trị trong header `X-CSRF-Token`.

Trang chủ hiển thị thẻ món từ `docs/fixtures/kickoff.json`. API `GET /api/recipes?page=1&limit=10` trả danh sách thực từ MongoDB, với tối đa 48 món mỗi trang. Seed danh mục tạo 5 loại và 11 món ở nhiều trạng thái để thử điều kiện hiển thị.

Để chạy ca kiểm thử HTTP với MongoDB thật, đặt hai biến mật khẩu demo trong `.env` khớp với tài khoản đã seed rồi chạy trên PowerShell.

```powershell
$env:TEST_DEMO_LOGIN = '1'
$env:TEST_DEMO_CATALOG = '1'
npm test
Remove-Item Env:TEST_DEMO_LOGIN, Env:TEST_DEMO_CATALOG
```

Nhóm cũng có thể dùng một MongoDB replica set dành riêng cho phát triển qua `MONGODB_URI`. Replica set phục vụ giao dịch ghi đánh giá và cập nhật điểm trung bình. Giữ `.env` và thông tin kết nối ở máy của từng người.

## Tài liệu bàn giao

| Tài liệu | Dùng để |
| --- | --- |
| [Kế hoạch kickoff gửi nhóm](docs/Ke%20hoạch.md) | Mục tiêu, phân vai P1/P2/P3, việc buổi đầu và mốc demo |
| [Kế hoạch tổng thể 21/11–05/12](docs/KE-HOACH-TONG-THE-BEP-NHA.md) | Thiết kế đích, hợp đồng API, lịch 15 ngày và 13 ca nghiệm thu |
| [Dữ liệu mẫu buổi đầu](docs/fixtures/README.md) | Dựng giao diện song song với API đăng nhập, công thức và thực đơn |
| [Wireframe và thiết kế màn hình](docs/DESIGN.md) | Tham khảo bố cục. Áp dụng quyết định nghiệp vụ và phân công trong kế hoạch tổng thể |

```text
apps/
├── api/   Express · MongoDB · routes theo tính năng · kiểm thử API
└── web/   React · Vite · Redux Toolkit cho thực đơn · giao diện theo tính năng
docs/      Sơ đồ, thiết kế, API, kế hoạch nhóm
```

Nhóm bắt đầu từ kế hoạch kickoff, điền tên P1/P2/P3 và chốt giờ demo đầu tiên. Các tài liệu nền trong `docs/` là bản tham khảo. Nếu lịch hoặc giao diện/API có điểm khác nhau, dùng kế hoạch tổng thể làm chuẩn.
