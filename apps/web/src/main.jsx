import { createRoot } from 'react-dom/client';
import './styles/base.css';

function App() {
  return (
    <main className="scaffold">
      <p>Bộ khung dự án Đề 3</p>
      <h1>Bếp Nhà</h1>
      <p>Sổ tay công thức nấu ăn cộng đồng.</p>
      <p>Nhóm xem sơ đồ và phân công trong thư mục <code>docs/</code>.</p>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
