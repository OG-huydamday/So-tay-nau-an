# Sổ tay công thức nấu ăn

Đề 3 — Website chia sẻ công thức, tìm món từ nguyên liệu đang có và lên thực đơn tuần. Repo này bàn giao **bộ khung và kế hoạch triển khai cho nhóm ba người**. API hiện có `/api/health` và web có trang khởi động. Model, middleware xác thực và hàm gộp nguyên liệu là phần nền sơ bộ để người phụ trách rà soát khi nối module.

## Bắt đầu

Dùng Node.js 22.12+ và npm. Sau khi clone repo chung, chạy từ thư mục gốc trên PowerShell.

```powershell
npm ci
npm run dev
```

- Web: <http://127.0.0.1:5173>
- API qua proxy của Vite: <http://127.0.0.1:5173/api/health> → `{"status":"ok","stage":"scaffold"}`
- Trước khi mở PR, chạy `npm run check` và `npm test`.

Trang khởi động và `/api/health` dùng để xác nhận web và API chạy trên máy. P1 sẽ nối MongoDB khi triển khai nghiệp vụ. Khi cần DB local, sao chép `.env.example` thành `.env`, đặt `JWT_SECRET` ngẫu nhiên và dùng Docker Compose.

```powershell
if (!(Test-Path -LiteralPath .env)) { Copy-Item .env.example .env }
docker compose up -d --wait mongo
docker compose ps mongo
```

Nhóm cũng có thể dùng một MongoDB replica set dành riêng cho phát triển qua `MONGODB_URI`. Replica set phục vụ giao dịch ghi đánh giá và cập nhật điểm trung bình. Giữ `.env` và thông tin kết nối ở máy của từng người.

## Tài liệu bàn giao

| Tài liệu | Dùng để |
| --- | --- |
| [Kế hoạch kickoff gửi nhóm](docs/Ke%20hoạch.md) | Mục tiêu, phân vai P1/P2/P3, việc buổi đầu và mốc demo |
| [Kế hoạch tổng thể 21/11–15/12](docs/KE-HOACH-TONG-THE-BEP-NHA.md) | Thiết kế đích, hợp đồng API, lịch 25 ngày và 13 ca nghiệm thu |
| [Dữ liệu mẫu buổi đầu](docs/fixtures/README.md) | Dựng giao diện song song với API đăng nhập, công thức và thực đơn |
| [Wireframe và thiết kế màn hình](docs/DESIGN.md) | Tham khảo bố cục. Áp dụng quyết định nghiệp vụ và phân công trong kế hoạch tổng thể |

```text
apps/
├── api/   Express · MongoDB · routes theo tính năng · kiểm thử API
└── web/   React · Vite · Redux Toolkit cho thực đơn · giao diện theo tính năng
docs/      Sơ đồ, thiết kế, API, kế hoạch nhóm
```

Nhóm bắt đầu từ kế hoạch kickoff, điền tên P1/P2/P3 và chốt giờ demo đầu tiên. Các tài liệu nền trong `docs/` là bản tham khảo. Nếu lịch hoặc giao diện/API có điểm khác nhau, dùng kế hoạch tổng thể làm chuẩn.
