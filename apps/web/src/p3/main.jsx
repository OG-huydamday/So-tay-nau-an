/* global URLSearchParams, window */
import React, { useState, useEffect, useRef } from "react";

import {
  HashRouter,
  Routes,
  Route,
  Link,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./auth";
import {Discover, Favorites, RecipePreview} from "../features/planner/Discovery";
import {writeFavorite} from "../features/planner/useRecipes";
import { RecipeCards } from "../features/catalog/RecipeCards";
import { AdminReviewsPage } from "../features/reviews/AdminReviewsPage";
import { useCarousel } from "../shared/useCarousel";
import fixture from "../../../../docs/fixtures/kickoff.json";
import "./style.css";

const paths = {
  pot: "M3 10h18M5 11v5a4 4 0 0 0 4 4h6a4 4 0 0 0 4-4v-5M7 7c2-1-1-2 1-4m4 4c2-1-1-2 1-4m4 4c2-1-1-2 1-4",
  leaf: "M20 3C8 3 3 8 5 15s15 6 15-12ZM4 21 15 10",
  book: "M3 5q5-2 9 1 4-3 9-1v14q-5-2-9 1-4-3-9-1zM12 6v14",
  calendar: "M4 6h16v14H4zM4 10h16M8 3v5m8-5v5M8 14h2m4 0h2",
  clock: "M21 12a9 9 0 1 1-18 0 9 9 0 1 1 18 0ZM12 7v5l3 2",
  bookmark: "M6 3h12v18l-6-4-6 4z",
  arrow: "M4 12h15m-6-6 6 6-6 6",
  menu: "M3 6h18M3 12h18M3 18h18",
};
function Icon({ name, size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
function Brand() {
  return (
    <Link className="brand" to="/">
      <img src={`${import.meta.env.BASE_URL}logo-so-tay-nia-la.png`} width="48" height="48" alt="" />
      Sổ Tay Nấu Ăn
    </Link>
  );
}
const sections = [
  ["cong-thuc", "Công thức"],
  ["loi-ich", "Lợi ích"],
  ["tinh-nang", "Tính năng"],
  ["faq", "Hỏi đáp"],
];
function Shell() {
  const location = useLocation(),
    [open, setOpen] = useState(false),
    { session, loading, logout } = useAuth();
  const [logoutError, setLogoutError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  async function endSession() {
    setLogoutError("");
    setLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      setLogoutError(error.message);
    } finally {
      setLoggingOut(false);
    }
  }
  useEffect(() => {
    setOpen(false);
    const id = new URLSearchParams(location.search).get("muc");
    if (id) document.getElementById(id)?.scrollIntoView();
    else if (!location.search || location.pathname !== "/kham-pha") window.scrollTo(0, 0);
  }, [location]);
  return (
    <>
      <header>
        <div className="wrap bar">
          <Brand />
          <button
            className="hamb"
            aria-label="Mở hoặc đóng điều hướng"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            <Icon name="menu" />
          </button>
          <nav className={open ? "open" : ""}>
            <Link to="/kham-pha">Khám phá</Link>
            <Link to="/yeu-thich">Yêu thích</Link>
            {sections.map(([id, label]) => (
              <Link key={id} to={"/?muc=" + id}>
                {label}
              </Link>
            ))}
          </nav>
          {session ? (
            <div className="account-actions">
              <span className="member">{session.user.name || "Thành viên"}</span>
              {session.user.role === "admin" && (
                <Link className="smallbtn" to="/quan-tri/danh-gia">Quản trị</Link>
              )}
              <button className="smallbtn" disabled={loggingOut} onClick={endSession}>Đăng xuất</button>
              {logoutError && <span role="alert" className="error">{logoutError}</span>}
            </div>
          ) : !loading && (
            <Link className="smallbtn" to="/dang-nhap">
              Đăng nhập <Icon name="arrow" size={15} />
            </Link>
          )}
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      <footer>
        <div className="wrap foot">
          <Brand />
          <span>Sổ tay dành cho căn bếp Việt</span>
          <Link to="/?muc=faq">Hỏi đáp ↗</Link>
        </div>
      </footer>
    </>
  );
}

const benefits = [
  { title: "Tạo sổ tay nấu ăn riêng của bạn", body: "Gom những công thức hợp khẩu vị vào một chỗ để lần sau mở ra là nấu.", image: "/images/loi-ich-so-tay.jpg" },
  { title: "Tận dụng nguyên liệu sẵn có", body: "Bắt đầu từ vài quả trứng và cà chua trong bếp để tìm món cho bữa tối.", image: "/images/loi-ich-nguyen-lieu.jpg" },
  { title: "Tự tin vào bếp", body: "Xem trước nguyên liệu, rồi theo từng bước khi thử một món mới.", image: "/images/loi-ich-vao-bep.jpg" },
  { title: "Nhẹ đầu chuyện đi chợ", body: "Xếp món cho cả tuần và gom nguyên liệu cần mua vào một danh sách.", image: "/images/loi-ich-di-cho.jpg" },
];

function BenefitCarousel() {
  const { index, setIndex, playing, setPlaying } = useCarousel(benefits.length);
  return (
    <section id="loi-ich" className="cover" aria-label="Lợi ích của sổ tay">
      {benefits.map((benefit, i) => (
        <figure className="dish-slide" key={benefit.title} aria-hidden={i !== index}>
          <img src={benefit.image} alt="" />
          <figcaption>
            <strong>{benefit.title}</strong>
            <span>{benefit.body}</span>
          </figcaption>
        </figure>
      ))}
      <div className="dish-controls">
        <button type="button" aria-label={playing ? "Tạm dừng chuyển ảnh" : "Tiếp tục chuyển ảnh"}
          onClick={() => setPlaying(!playing)}>{playing ? "Ⅱ" : "▶"}</button>
        {benefits.map((benefit, i) => (
          <button key={benefit.title} type="button" aria-label={`Xem: ${benefit.title}`} aria-pressed={i === index}
            onClick={() => { setIndex(i); setPlaying(false); }}><i /></button>
        ))}
      </div>
    </section>
  );
}

function Hero() {
  const [name,setName]=useState("");
  const navigate=useNavigate();
  return (
    <section className="hero">
      <div>
        <div className="kicker">
          <i /> CẨM NANG BẾP NHÀ
        </div>
        <h1>
          Hôm nay,
          <br />
          <em>nấu món gì?</em>
        </h1>
        <p>
          Từ vài nguyên liệu sẵn trong tủ lạnh đến thực đơn cả tuần, tìm cảm
          hứng cho từng bữa cơm nhà.
        </p>
        <form className="home-search" onSubmit={event=>{
          event.preventDefault();
          navigate(name.trim()?"/kham-pha?q="+encodeURIComponent(name.trim()):"/kham-pha");
        }}>
          <label htmlFor="home-recipe-name">Tìm món theo tên</label>
          <input id="home-recipe-name" placeholder="Ví dụ: trứng chiên" maxLength={120} value={name} onChange={event=>setName(event.target.value)}/>
          <button className="btn shine">Khám phá sổ tay <Icon name="arrow"/></button>
        </form>
      </div>
      <BenefitCarousel />
    </section>
  );
}
const features = [
  {
    name: "Khám phá",
    title: "Bắt đầu từ tủ lạnh",
    desc: "Chọn những nguyên liệu đang có. Những món khớp nhiều nguyên liệu hơn sẽ xuất hiện trước.",
    label: "Nguyên liệu gợi ý",
    rows: ["Trứng gà", "Cà chua", "Hành lá"],
  },
  {
    name: "Yêu thích",
    title: "Giữ lại món hợp vị",
    desc: "Lưu các công thức bạn muốn nấu lại vào một bộ sưu tập riêng.",
    label: "Bộ sưu tập mẫu",
    rows: ["Đậu phụ sốt cà chua", "Canh rau ngót", "Trứng hấp nấm"],
  },
  {
    name: "Thực đơn tuần",
    title: "Xếp món cho cả tuần",
    desc: "Sắp xếp bữa sáng, trưa và tối cho từng ngày để biết trước cần chuẩn bị gì.",
    label: "Thực đơn thứ Hai",
    rows: [
      "Sáng · Bánh mì trứng",
      "Trưa · Cơm gà + dưa leo + canh rau ngót",
      "Tối · Cơm trắng + cá kho + canh bí đỏ",
    ],
  },
  {
    name: "Đi chợ",
    title: "Gom gọn từng nguyên liệu",
    desc: "Nguyên liệu trùng tên và đơn vị trong thực đơn được cộng lại để bạn dễ mua đủ lượng.",
    label: "Danh sách đi chợ mẫu",
    rows: ["Trứng gà · 5 quả", "Cà chua · 3 quả", "Hành lá · 1 bó"],
  },
];
function Features() {
  const [idx, select] = useState(0),
    f = features[idx];
  return (
    <section id="tinh-nang" className="wrap section">
      <div className="kicker">
        <i /> TÍNH NĂNG
      </div>
      <h2>Mở sổ tay của bạn</h2>
      <div className="tabs" aria-label="Xem trước tính năng">
        {features.map((item, i) => (
          <button
            key={item.name}
            aria-pressed={idx === i}
            onClick={() => select(i)}
          >
            {item.name}
          </button>
        ))}
      </div>
      <div className="panel" aria-live="polite">
        <div>
          <h3>{f.title}</h3>
          <p>{f.desc}</p>
        </div>
        <div className="sample">
          <b>{f.label}</b>
          {f.rows.map((r) => (
            <span key={r}>{r}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
const faqs = [
  [
    "Người mới tập nấu nên bắt đầu từ đâu?",
    "Hãy bắt đầu với món ít nguyên liệu, thời gian nấu ngắn và mức độ dễ. Đọc hết các bước trước khi bật bếp.",
  ],
  [
    "Tôi có thể tìm món bằng nhiều nguyên liệu cùng lúc không?",
    "Có. Màn Khám phá của dự án được thiết kế để ưu tiên món khớp với nhiều nguyên liệu bạn nhập nhất.",
  ],
  [
    "Tôi cần tài khoản để làm gì?",
    "Thành viên có thể lưu món yêu thích, lập thực đơn tuần và tạo danh sách đi chợ từ các bữa đã chọn.",
  ],
];
function Home() {
  const { session } = useAuth();
  return (
    <>
      <Hero />
      <RecipeCards items={fixture.recipeList.items} />
      <Features />
      <section className="wrap cta shine">
        <div>
          <h2>Góc bếp của riêng bạn</h2>
          <p>Lưu món hợp vị và lên thực đơn cho những ngày tới.</p>
        </div>
        <Link
          className="btn light"
          to={session ? "/?muc=tinh-nang" : "/dang-nhap"}
        >
          {session ? "Xem tính năng" : "Đăng nhập vào sổ tay"}{" "}
          <Icon name="arrow" />
        </Link>
      </section>
      <section className="wrap section faq" id="faq">
        <h2>Câu hỏi thường gặp</h2>
        <div>
          {faqs.map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
function Login({ signingUp = false }) {
  const intent = useLocation().state;
  const { login, register, loading } = useAuth(),
    navigate = useNavigate(),
    emailRef = useRef(null),
    passRef = useRef(null);
  const [email, setEmail] = useState(""),
    [name, setName] = useState(""),
    [password, setPassword] = useState(""),
    [visible, show] = useState(false),
    [error, report] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    if (busy || loading) return;
    report("");
    if (signingUp && !name.trim()) {
      report("Vui lòng nhập tên hiển thị.");
      e.currentTarget.elements.namedItem("account-name").focus();
      return;
    }
    if (!email.trim() || !emailRef.current.validity.valid) {
      report("Vui lòng nhập địa chỉ email hợp lệ.");
      emailRef.current.focus();
      return;
    }
    if (!password) {
      report("Vui lòng nhập mật khẩu.");
      passRef.current.focus();
      return;
    }
    setBusy(true);
    try {
      if (signingUp) await register(name.trim(), email.trim(), password);
      else await login(email.trim(), password);
      if(intent?.saveId) await writeFavorite(intent.saveId,true);
      const target=intent?.returnTo;
      navigate(typeof target==="string" && /^\/(?:kham-pha|yeu-thich|quan-tri\/danh-gia|cong-thuc\/[a-f0-9]{24})(?:\?|$)/.test(target)?target:"/",{replace:true});
    } catch (err) {
      report(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="login wrap">
      <aside>
        <div className="kicker">
          <i /> SỔ TAY CÁ NHÂN
        </div>
        <h2>
          Trở về
          <br />
          <em>góc bếp quen.</em>
        </h2>
        <p>Những món ngon bạn muốn lưu lại bắt đầu từ đây.</p>
      </aside>
      <form onSubmit={submit} noValidate>
        <h1>{signingUp ? "Đăng ký" : "Đăng nhập"}</h1>
        {signingUp && <>
          <label htmlFor="account-name">Tên hiển thị</label>
          <input id="account-name" autoComplete="name" maxLength={60} required
            value={name} onChange={e => setName(e.target.value)} />
        </>}
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          required
          ref={emailRef}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ban@example.com"
        />
        <label htmlFor="pw">Mật khẩu</label>
        <div className="pw">
          <input
            id="pw"
            type={visible ? "text" : "password"}
            autoComplete={signingUp ? "new-password" : "current-password"}
            required
            ref={passRef}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            onClick={() => show(!visible)}
          >
            {visible ? "Ẩn" : "Hiện"}
          </button>
        </div>
        <p role="alert" className="error">
          {error}
        </p>
        <button disabled={busy || loading} className="btn shine">
          {busy ? "Đang xử lý…" : signingUp ? "Đăng ký" : "Đăng nhập"} <Icon name="arrow" />
        </button>
        <Link className="back" state={intent} to={signingUp ? "/dang-nhap" : "/dang-ky"}>
          {signingUp ? "Đã có tài khoản? Đăng nhập" : "Chưa có tài khoản? Đăng ký"}
        </Link>
        <Link className="back" to="/">
          ← Về trang chủ
        </Link>
      </form>
    </div>
  );
}
export function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Shell />}>
            <Route index element={<Home />} />
            <Route path="kham-pha" element={<Discover />} />
            <Route path="yeu-thich" element={<Favorites />} />
            <Route path="cong-thuc/:id" element={<RecipePreview />} />
            <Route path="dang-nhap" element={<Login key="login" />} />
            <Route path="dang-ky" element={<Login key="register" signingUp />} />
            <Route path="quan-tri/danh-gia" element={<AdminReviewsPage />} />
            <Route
              path="*"
              element={
                <Link className="btn" to="/">
                  Về trang chủ
                </Link>
              }
            />
          </Route>
        </Routes>
      </AuthProvider>
    </HashRouter>
  );
}
