import React, { useEffect, useRef, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useAuth } from "../../p3/auth";
import { RecipeReviews } from "../reviews/RecipeReviews";
import { useResource, useDebounce, writeFavorite } from "./useRecipes";
import "./discovery.css";

const perPage = 6;
const emptyFilters = {
  q: "",
  ingredients: "",
  category: "",
  difficulty: "",
  maxTime: "",
};
function Status({ resource }) {
  if (resource.error)
    return (
      <p role="alert">
        {resource.error.message}{" "}
        <button onClick={resource.retry}>Thử lại</button>
      </p>
    );
  if (resource.loading) return <p role="status">Đang tải…</p>;
  return null;
}
function useFavorites() {
  const { session, loading: restoring } = useAuth();
  const location = useLocation(),
    navigate = useNavigate();
  const [revision, refresh] = useState(0),
    [busy, setBusy] = useState(null),
    [error, report] = useState("");
  const lock = useRef(false);
  const list = useResource(session ? "/me/favorites" : null, revision);
  const ids = new Set(list.data?.items.map((item) => item.id));
  function loginFor(id) {
    navigate("/dang-nhap", {
      state: { returnTo: location.pathname + location.search, saveId: id },
    });
  }
  async function toggle(id) {
    if (lock.current || restoring) return;
    if (!session || list.error?.status === 401) {
      loginFor(id);
      return;
    }
    lock.current = true;
    setBusy(id);
    report("");
    try {
      await writeFavorite(id, !ids.has(id));
      refresh((n) => n + 1);
    } catch (err) {
      if (err.status === 401) loginFor(id);
      else report(err.message);
    } finally {
      lock.current = false;
      setBusy(null);
    }
  }
  return { ids, list, toggle, busy, error, session, restoring, loginFor };
}
function Save({ id, fav }) {
  const saved = fav.ids.has(id);
  return (
    <button
      className="save-recipe"
      aria-pressed={saved}
      disabled={
        fav.restoring ||
        fav.busy !== null ||
        fav.list.loading ||
        !!(fav.list.error && fav.list.error.status !== 401)
      }
      onClick={() => fav.toggle(id)}
    >
      {fav.busy === id
        ? "Đang lưu…"
        : saved
          ? "♥ Bỏ yêu thích"
          : "♡ Lưu yêu thích"}
    </button>
  );
}
function Cards({ items, fav, showMatch = false }) {
  return (
    <div className="discover-grid">
      {items.map((r) => (
        <article key={r.id} className="discover-card">
          {r.image && <img src={r.image} alt={r.title} loading="lazy" />}
          <div>
            <small>
              {r.category?.name} ·{" "}
              {r.totalMinutes ?? r.prepMinutes + r.cookMinutes} phút ·{" "}
              {r.difficulty}
            </small>
            <h3>
              <Link to={"/cong-thuc/" + r.id}>{r.title}</Link>
            </h3>
            <p>{r.summary}</p>
            {showMatch && (
              <p>
                <strong>Khớp {r.matchedIngredients.length} nguyên liệu</strong>{" "}
                · {r.matchedIngredients.join(", ")}
                <br />
                Còn thiếu:{" "}
                {r.missingIngredients.join(", ") || "Đã có đủ loại nguyên liệu"}
              </p>
            )}
            <div className="card-actions">
              <Link to={"/cong-thuc/" + r.id}>Xem công thức →</Link>
              <Save id={r.id} fav={fav} />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
export function Discover() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get("q") || ""),
    [ingredient, setIngredient] = useState("");
  const selected = (params.get("ingredients") || "").split(",").filter(Boolean);
  const query = useDebounce(q.trim()),
    hint = useDebounce(ingredient.trim());
  const urlName = params.get("q") || "";
  const lastName = useRef(urlName);
  useEffect(() => {
    if (lastName.current !== urlName) {
      lastName.current = urlName;
      setQ(urlName);
    }
  }, [urlName]);
  function update(key, value) {
    const next = new globalThis.URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(next, { replace: true });
  }
  useEffect(() => {
    if (query === q.trim() && query !== urlName) {
      update("q", query);
    }
  }, [query]);
  const page = Math.max(1, Number(params.get("page")) || 1);
  const apiParams = new globalThis.URLSearchParams({
    page: String(page),
    limit: String(perPage),
  });
  for (const key of Object.keys(emptyFilters)) {
    const val = params.get(key);
    if (val) apiParams.set(key, val);
  }
  const recipes = useResource("/recipes?" + apiParams),
    categories = useResource("/categories");
  const suggestions = useResource(
    hint ? "/ingredients/suggestions?q=" + encodeURIComponent(hint) : null,
  );
  const fav = useFavorites();
  const [notice, setNotice] = useState("");
  function add(value) {
    const values = value
      .split(",")
      .map((v) => v.normalize("NFC").toLowerCase().trim().replace(/\s+/g, " "))
      .filter(Boolean);
    const combined = [...new Set([...selected, ...values])];
    if (combined.length > 12 || combined.some((v) => v.length > 80)) {
      setNotice("Chọn tối đa 12 nguyên liệu, mỗi tên tối đa 80 ký tự.");
      return;
    }
    update("ingredients", combined.join(","));
    setIngredient("");
    setNotice("");
  }
  return (
    <section className="wrap section discovery" id="kham-pha">
      <h2>Khám phá món ngon</h2>
      <p>Tìm món theo tên hoặc thêm những nguyên liệu bạn đang có.</p>
      <div className="search-panel">
        <label>
          Tên món
          <input
            value={q}
            maxLength={120}
            placeholder="Ví dụ: trung chien"
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            add(ingredient);
          }}
        >
          <label>
            Nguyên liệu đang có
            <input
              value={ingredient}
              placeholder="Trứng, cà chua…"
              onChange={(e) => setIngredient(e.target.value)}
            />
          </label>
          <button disabled={!ingredient.trim()}>Thêm</button>
        </form>
        {ingredient.trim() && suggestions.data?.items.length > 0 && (
          <div className="chips">
            {suggestions.data.items
              .filter((v) => !selected.includes(v))
              .slice(0, 6)
              .map((v) => (
                <button key={v} onClick={() => add(v)}>
                  + {v}
                </button>
              ))}
          </div>
        )}
        {selected.length > 0 && (
          <div className="chips">
            {selected.map((v) => (
              <button
                key={v}
                aria-label={"Bỏ " + v}
                onClick={() =>
                  update(
                    "ingredients",
                    selected.filter((n) => n !== v).join(","),
                  )
                }
              >
                {v} ×
              </button>
            ))}
          </div>
        )}
        {notice && <p role="alert">{notice}</p>}
        <div className="filters">
          <label>
            Loại món
            <select
              value={params.get("category") || ""}
              onChange={(e) => update("category", e.target.value)}
            >
              <option value="">Tất cả</option>
              {categories.data?.items.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Độ khó
            <select
              value={params.get("difficulty") || ""}
              onChange={(e) => update("difficulty", e.target.value)}
            >
              <option value="">Tất cả</option>
              {["Dễ", "Vừa", "Khó"].map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </label>
          <label>
            Tổng thời gian
            <select
              value={params.get("maxTime") || ""}
              onChange={(e) => update("maxTime", e.target.value)}
            >
              <option value="">Bất kỳ</option>
              {[15, 30, 45, 60].map((n) => (
                <option key={n} value={n}>
                  Tối đa {n} phút
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={() => {
              setQ("");
              setIngredient("");
              setNotice("");
              setParams({}, { replace: true });
            }}
          >
            Xóa bộ lọc
          </button>
        </div>
        {categories.error && <Status resource={categories} />}
      </div>
      <Status resource={recipes} />
      {fav.list.error && fav.list.error.status !== 401 && (
        <Status resource={fav.list} />
      )}
      {fav.error && <p role="alert">{fav.error}</p>}
      {recipes.data && (
        <>
          <p aria-live="polite">
            {recipes.data.total
              ? recipes.data.total + " món phù hợp"
              : "Chưa tìm thấy món. Hãy thử bỏ bớt bộ lọc hoặc đổi nguyên liệu."}
          </p>
          <Cards
            items={recipes.data.items}
            fav={fav}
            showMatch={!!selected.length}
          />
          {(page > 1 || recipes.data.total > perPage) && (
            <div className="pager">
              <button
                disabled={page <= 1}
                onClick={() => update("page", String(page - 1))}
              >
                ← Trước
              </button>
              <span>Trang {page}</span>
              <button
                disabled={page * perPage >= recipes.data.total}
                onClick={() => update("page", String(page + 1))}
              >
                Sau →
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
export function Favorites() {
  const fav = useFavorites();
  return (
    <section className="wrap section discovery">
      <h1>Món yêu thích</h1>
      {fav.restoring ? (
        <p>Đang đọc tài khoản…</p>
      ) : !fav.session || fav.list.error?.status === 401 ? (
        <>
          <p>Đăng nhập để mở sổ món của bạn.</p>
          <button onClick={() => fav.loginFor(null)}>Đăng nhập</button>
        </>
      ) : (
        <>
          <Status resource={fav.list} />
          {fav.error && <p role="alert">{fav.error}</p>}
          {fav.list.data &&
            (fav.list.data.items.length ? (
              <Cards items={fav.list.data.items} fav={fav} />
            ) : (
              <p>
                Bạn chưa lưu món nào.{" "}
                <Link to="/kham-pha">Khám phá món ngon →</Link>
              </p>
            ))}
        </>
      )}
    </section>
  );
}
export function RecipePreview() {
  const { id } = useParams(),
    recipe = useResource("/recipes/" + encodeURIComponent(id)),
    fav = useFavorites(),
    r = recipe.data;
  return (
    <section className="wrap section discovery recipe-preview">
      <Link to="/kham-pha">← Khám phá</Link>
      <Status resource={recipe} />
      {r && (
        <>
          <h1>{r.title}</h1>
          <p>{r.summary}</p>
          {r.image && <img src={r.image} alt={r.title} />}
          <p>
            {r.totalMinutes} phút · {r.servings} phần · {r.difficulty}
          </p>
          <Link to={"/thuc-don?mon="+encodeURIComponent(id)}>Thêm vào thực đơn tuần</Link>
          <Save id={id} fav={fav} />
          {fav.error && <p role="alert">{fav.error}</p>}
          {fav.list.error && fav.list.error.status !== 401 && (
            <Status resource={fav.list} />
          )}
          <h2>Nguyên liệu</h2>
          <ul>
            {r.ingredients.map((i, n) => (
              <li key={n}>
                {i.name} ·{" "}
                {i.quantityType === "to-taste"
                  ? "vừa đủ"
                  : i.quantity + " " + i.unit}
              </li>
            ))}
          </ul>
          <h2>Cách làm</h2>
          <ol>
            {r.steps.map((s) => (
              <li key={s.order}>
                {s.text}
                {s.image && <img src={s.image} alt={"Bước " + s.order} />}
              </li>
            ))}
          </ol>
          <RecipeReviews
            recipeId={id}
            initialAverage={r.ratingAverage}
            initialCount={r.ratingCount}
          />
        </>
      )}
    </section>
  );
}
