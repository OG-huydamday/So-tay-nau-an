import React, { useEffect, useState } from "react";
import { Provider, useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "../../p3/auth";
import { request, useResource, useDebounce } from "./useRecipes";
import { actions, createMenuStore, monday, shopping } from "./weekStore";
import "./weekly.css";
const days = [
  "Thứ Hai",
  "Thứ Ba",
  "Thứ Tư",
  "Thứ Năm",
  "Thứ Sáu",
  "Thứ Bảy",
  "Chủ nhật",
];
const slots = { breakfast: "Sáng", lunch: "Trưa", dinner: "Tối" };

function PickRecipe({ add, close }) {
  const [q, setQ] = useState(""),
    [page, setPage] = useState(1);
  const term = useDebounce(q.trim());
  const result = useResource(
    "/recipes?limit=6&page=" + page + "&q=" + encodeURIComponent(term),
  );
  return (
    <section className="week-picker">
      <h3>Chọn món cho bữa</h3>
      <label>
        Tìm tên món{" "}
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
        />
      </label>
      {result.loading && <p>Đang tìm món…</p>}
      {result.error && <button onClick={result.retry}>Thử lại</button>}
      {result.data && (
        <>
          <ul>
            {result.data.items.map((r) => (
              <li key={r.id}>
                <button onClick={() => add(r.id)}>{r.title}</button>
              </li>
            ))}
          </ul>
          {!result.data.total && <p>Chưa có món phù hợp.</p>}
          <button disabled={page === 1} onClick={() => setPage(page - 1)}>
            Trước
          </button>{" "}
          Trang {page}{" "}
          <button
            disabled={page * 6 >= result.data.total}
            onClick={() => setPage(page + 1)}
          >
            Sau
          </button>
        </>
      )}
      <button onClick={close}>Đóng</button>
    </section>
  );
}
function Checklist({ rows, skipped }) {
  const [checked, mark] = useState({});
  return (
    <section className="week-shopping">
      <h2>Danh sách đi chợ</h2>
      {skipped > 0 && (
        <p role="status">Đã bỏ qua {skipped} lượt món bị ẩn hoặc xóa.</p>
      )}
      {!rows.length && <p>Thêm món vào thực đơn để xem nguyên liệu cần mua.</p>}
      {rows.map((row) => (
        <label key={row.key}>
          <input
            type="checkbox"
            checked={!!checked[row.key]}
            onChange={() => mark({ ...checked, [row.key]: !checked[row.key] })}
          />
          {row.name} ·{" "}
          {row.unit === null
            ? "vừa đủ"
            : row.quantity.toLocaleString("vi-VN", {
                maximumFractionDigits: 2,
              }) +
              " " +
              row.unit}
        </label>
      ))}
    </section>
  );
}
function Editor() {
  const dispatch = useDispatch(),
    menu = useSelector((s) => s),
    list = useSelector(shopping);
  const [params, setParams] = useSearchParams();
  const incoming = params.get("mon");
  const [cell, choose] = useState(null),
    [pending, wait] = useState(false),
    [notice, report] = useState(""),
    [attempt, retry] = useState(0);
  const busy = menu.status === "saving" || pending;
  const path = "/me/weekly-menu?weekStart=" + menu.week;
  useEffect(() => {
    const controller = new globalThis.AbortController();
    request(path, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) dispatch(actions.loaded(data));
      })
      .catch((e) => {
        if (!controller.signal.aborted)
          dispatch(
            actions.failure({ status: "loadError", message: e.message }),
          );
      });
    return () => controller.abort();
  }, [path, attempt, dispatch]);
  function weekChange(date) {
    if (!date || date.length !== 10) return;
    const week = monday(date);
    if (week === menu.week) return;
    if (
      menu.dirty &&
      !globalThis.confirm("Bỏ thay đổi chưa lưu và chuyển tuần?")
    )
      return;
    choose(null);
    report("");
    dispatch(actions.open(week));
  }
  async function add(id, day, slot, items) {
    if (pending) return;
    if (items.some((i) => i.recipeId === id) || items.length >= 5) {
      report(
        "Mỗi ô tối đa 5 món khác nhau. Bạn có thể chỉnh số phần của món đã có.",
      );
      return;
    }
    wait(true);
    report("");
    try {
      const r = await request("/recipes/" + encodeURIComponent(id));
      dispatch(
        actions.edit({
          day,
          slot,
          items: [
            ...items,
            {
              recipeId: id,
              servings: r.servings,
              available: true,
              snapshot: {
                title: r.title,
                servings: r.servings,
                ingredients: r.ingredients,
                image: r.image,
              },
            },
          ],
        }),
      );
      choose(null);
      if (incoming) setParams({}, { replace: true });
    } catch (e) {
      report(e.message);
    } finally {
      wait(false);
    }
  }
  async function save() {
    dispatch(actions.saving());
    report("");
    try {
      const csrf = document.cookie
        .split("; ")
        .find((v) => v.startsWith("csrf="))
        ?.slice(5);
      const meals = menu.meals.map((m) => ({
        ...m,
        items: m.items.map(({ recipeId, servings }) => ({
          recipeId,
          servings,
        })),
      }));
      const data = await request(path, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrf || "",
        },
        body: JSON.stringify({ version: menu.version, meals }),
      });
      dispatch(actions.loaded(data));
      report("Đã lưu thực đơn.");
    } catch (e) {
      dispatch(
        actions.failure({
          status: e.status === 409 ? "conflict" : "ready",
          message: e.message,
        }),
      );
    }
  }
  function reload() {
    if (
      menu.dirty &&
      !globalThis.confirm("Tải bản mới và bỏ các sửa đổi đang hiển thị?")
    )
      return;
    choose(null);
    report("");
    dispatch(actions.open(menu.week));
    retry((n) => n + 1);
  }
  return (
    <section className="wrap section week-page">
      <h1>Thực đơn tuần</h1>
      <label>
        Tuần bắt đầu{" "}
        <input
          type="date"
          value={menu.week}
          disabled={busy}
          onChange={(e) => weekChange(e.target.value)}
        />
      </label>
      <p>
        {menu.dirty
          ? "Có thay đổi chưa lưu."
          : "Chọn bữa để thêm món hoặc điều chỉnh khẩu phần."}
      </p>
      {incoming && (
        <p>
          Chọn ô bữa để thêm món vừa xem.{" "}
          <button onClick={() => setParams({}, { replace: true })}>
            Hủy chọn món
          </button>
        </p>
      )}
      {menu.error && <p role="alert">{menu.error}</p>}
      {notice && <p role="status">{notice}</p>}
      {menu.status === "loading" ? (
        <p>Đang đọc tuần…</p>
      ) : menu.status === "loadError" ? (
        <button onClick={reload}>Thử lại</button>
      ) : (
        <>
          <fieldset disabled={busy} className="week-grid">
            {days.map((dayName, day) => (
              <section key={day} className="week-day">
                <h2>{dayName}</h2>
                {Object.entries(slots).map(([slot, label]) => {
                  const items =
                    menu.meals.find((m) => m.day === day && m.slot === slot)
                      ?.items ?? [];
                  function edit(next) {
                    report("");
                    dispatch(actions.edit({ day, slot, items: next }));
                  }
                  return (
                    <div key={slot} className="week-cell">
                      <h3>{label}</h3>
                      {items.map((i, n) => (
                        <div key={i.recipeId}>
                          <strong>{i.snapshot.title}</strong>
                          {!i.available && (
                            <p>Món đã ẩn/xóa · bỏ qua khi đi chợ</p>
                          )}
                          <label>
                            Khẩu phần{" "}
                            <select
                              value={i.servings}
                              onChange={(e) =>
                                edit(
                                  items.map((x, j) =>
                                    n === j
                                      ? {
                                          ...x,
                                          servings: Number(e.target.value),
                                        }
                                      : x,
                                  ),
                                )
                              }
                            >
                              {Array.from({ length: 50 }, (_, j) => (
                                <option key={j} value={j + 1}>
                                  {j + 1}
                                </option>
                              ))}
                            </select>
                          </label>
                          <button
                            onClick={() =>
                              edit(items.filter((_, j) => j !== n))
                            }
                          >
                            Bỏ món
                          </button>
                        </div>
                      ))}
                      <button
                        disabled={items.length >= 5}
                        aria-label={"Thêm món " + dayName + " bữa " + label}
                        onClick={() =>
                          incoming
                            ? add(incoming, day, slot, items)
                            : choose(day + slot)
                        }
                      >
                        + Thêm món
                      </button>
                      {cell === day + slot && (
                        <PickRecipe
                          add={(id) => add(id, day, slot, items)}
                          close={() => choose(null)}
                        />
                      )}
                    </div>
                  );
                })}
              </section>
            ))}
          </fieldset>
          <button
            className="btn"
            onClick={save}
            disabled={busy || !menu.dirty || menu.status === "conflict"}
          >
            {menu.status === "saving" ? "Đang lưu…" : "Lưu thực đơn"}
          </button>
          {menu.status === "conflict" && (
            <button onClick={reload}>Tải bản mới</button>
          )}
          <Checklist key={menu.week + JSON.stringify(list)} {...list} />
        </>
      )}
    </section>
  );
}
function MemberPlanner() {
  const [store] = useState(createMenuStore);
  return (
    <Provider store={store}>
      <Editor />
    </Provider>
  );
}
export function WeeklyMenuPage() {
  const { session, loading } = useAuth(),
    location = useLocation();
  if (loading) return <p className="wrap section">Đang đọc tài khoản…</p>;
  if (!session)
    return (
      <section className="wrap section">
        <h1>Thực đơn tuần</h1>
        <Link
          className="btn"
          to="/dang-nhap"
          state={{ returnTo: location.pathname + location.search }}
        >
          Đăng nhập để lập thực đơn
        </Link>
      </section>
    );
  return <MemberPlanner key={session.user.id} />;
}
