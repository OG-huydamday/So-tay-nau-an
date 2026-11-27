import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../p3/auth";
import "./reviews.css";

function getCsrfToken() {
  const match = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith("csrf="));
  return match ? match.slice("csrf=".length) : "";
}

export function AdminReviewsPage() {
  const { session, loading: authLoading } = useAuth();
  const location = useLocation();
  const [tab, setTab] = useState("reviews");

  // State cho bình luận
  const [statusFilter, setStatusFilter] = useState("");
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState("");
  const [togglingId, setTogglingId] = useState(null);

  // State cho xếp hạng
  const [topRecipes, setTopRecipes] = useState([]);
  const [topLoading, setTopLoading] = useState(false);
  const [topError, setTopError] = useState("");
  const [reloadTick, setReloadTick] = useState(0);

  const isAdmin = session?.user?.role === "admin";

  useEffect(() => {
    if (!isAdmin || tab !== "reviews") return;
    const controller = new globalThis.AbortController();
    setReviewsLoading(true);
    setReviewsError("");

    const params = new globalThis.URLSearchParams({ page: "1", limit: "24" });
    if (statusFilter) params.set("commentStatus", statusFilter);

    globalThis
      .fetch(`/api/admin/reviews?${params}`, {
        credentials: "same-origin",
        signal: controller.signal,
      })
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok || !data) throw new Error(data?.message || "Chưa tải được bình luận.");
        if (!controller.signal.aborted) setReviews(data.items || []);
      })
      .catch((err) => {
        if (!controller.signal.aborted && err.name !== "AbortError") {
          setReviewsError(err.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setReviewsLoading(false);
      });

    return () => controller.abort();
  }, [isAdmin, tab, statusFilter, reloadTick]);

  useEffect(() => {
    if (!isAdmin || tab !== "top") return;
    const controller = new globalThis.AbortController();
    setTopLoading(true);
    setTopError("");

    globalThis
      .fetch("/api/admin/stats/top-recipes?page=1&limit=20", {
        credentials: "same-origin",
        signal: controller.signal,
      })
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok || !data) throw new Error(data?.message || "Chưa tải được bảng xếp hạng.");
        if (!controller.signal.aborted) setTopRecipes(data.items || []);
      })
      .catch((err) => {
        if (!controller.signal.aborted && err.name !== "AbortError") {
          setTopError(err.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setTopLoading(false);
      });

    return () => controller.abort();
  }, [isAdmin, tab, reloadTick]);

  async function toggleCommentStatus(review) {
    if (togglingId) return;
    const nextStatus = review.commentStatus === "visible" ? "hidden" : "visible";
    setTogglingId(review.id);
    setReviewsError("");

    try {
      const res = await globalThis.fetch(
        `/api/admin/reviews/${encodeURIComponent(review.id)}/comment-status`,
        {
          method: "PATCH",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": getCsrfToken(),
          },
          body: JSON.stringify({ commentStatus: nextStatus }),
        },
      );
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) throw new Error(data?.message || "Không thể cập nhật trạng thái.");

      setReviews((prev) =>
        prev.map((item) =>
          item.id === review.id ? { ...item, commentStatus: data.commentStatus } : item,
        ),
      );
    } catch (err) {
      setReviewsError(err.message);
    } finally {
      setTogglingId(null);
    }
  }

  if (authLoading) {
    return (
      <section className="wrap section">
        <p role="status">Đang kiểm tra quyền truy cập…</p>
      </section>
    );
  }

  if (!session) {
    return (
      <section className="wrap section">
        <h1>Quản trị Đánh giá &amp; Xếp hạng</h1>
        <p>
          Bạn cần{" "}
          <Link to="/dang-nhap" state={{ returnTo: location.pathname }}>
            đăng nhập
          </Link>{" "}
          bằng tài khoản quản trị viên.
        </p>
      </section>
    );
  }

  if (!isAdmin) {
    return (
      <section className="wrap section">
        <h1>Không có quyền truy cập</h1>
        <p role="alert" className="error">
          Chỉ quản trị viên mới được phép kiểm duyệt bình luận và xem thống kê quản trị.
        </p>
        <Link className="btn" to="/">
          ← Về trang chủ
        </Link>
      </section>
    );
  }

  return (
    <section className="wrap section admin-reviews">
      <h1>Quản trị Đánh giá &amp; Xếp hạng</h1>
      <div className="admin-tabs" role="group" aria-label="Chọn mục quản trị">
        <button
          type="button"
          aria-pressed={tab === "reviews"}
          onClick={() => setTab("reviews")}
        >
          Kiểm duyệt bình luận
        </button>
        <button
          type="button"
          aria-pressed={tab === "top"}
          onClick={() => setTab("top")}
        >
          Bảng xếp hạng công thức
        </button>
      </div>

      {tab === "reviews" && (
        <div>
          <div className="admin-filter-row">
            <label htmlFor="comment-status-filter">Trạng thái bình luận:</label>
            <select
              id="comment-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Tất cả</option>
              <option value="visible">Đang hiển thị</option>
              <option value="hidden">Đã ẩn</option>
            </select>
          </div>

          {reviewsLoading && <p role="status">Đang tải danh sách bình luận…</p>}
          {reviewsError && (
            <p role="alert" className="error">
              {reviewsError}{" "}
              <button type="button" onClick={() => setReloadTick((n) => n + 1)}>
                Thử lại
              </button>
            </p>
          )}

          {!reviewsLoading && reviews.length === 0 && (
            <p>Không có bình luận nào phù hợp bộ lọc.</p>
          )}

          {!reviewsLoading && reviews.length > 0 && (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Công thức</th>
                    <th>Người đánh giá</th>
                    <th>Sao &amp; Bình luận</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((item) => (
                    <tr key={item.id}>
                      <td>
                        {item.recipe ? (
                          <Link to={`/cong-thuc/${item.recipe.id}`}>
                            {item.recipe.title}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        <strong>{item.user?.name || "Thành viên"}</strong>
                        <br />
                        <small>{item.user?.email}</small>
                      </td>
                      <td>
                        <div className="review-stars">{"★".repeat(item.stars)}</div>
                        <p className="review-comment">{item.comment}</p>
                      </td>
                      <td>
                        <span className={`status-badge ${item.commentStatus}`}>
                          {item.commentStatus === "visible" ? "Đang hiện" : "Đã ẩn"}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="toggle-status-btn"
                          disabled={togglingId === item.id}
                          onClick={() => toggleCommentStatus(item)}
                        >
                          {togglingId === item.id
                            ? "Đang lưu…"
                            : item.commentStatus === "visible"
                              ? "Ẩn bình luận"
                              : "Hiện lại"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "top" && (
        <div>
          {topLoading && <p role="status">Đang tải bảng xếp hạng…</p>}
          {topError && (
            <p role="alert" className="error">
              {topError}{" "}
              <button type="button" onClick={() => setReloadTick((n) => n + 1)}>
                Thử lại
              </button>
            </p>
          )}

          {!topLoading && topRecipes.length === 0 && (
            <p>Chưa có công thức công khai nào nhận được đánh giá.</p>
          )}

          {!topLoading && topRecipes.length > 0 && (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Hạng</th>
                    <th>Tên công thức</th>
                    <th>Loại món</th>
                    <th>Điểm trung bình</th>
                    <th>Số lượt</th>
                  </tr>
                </thead>
                <tbody>
                  {topRecipes.map((recipe, idx) => (
                    <tr key={recipe.id}>
                      <td>#{idx + 1}</td>
                      <td>
                        <Link to={`/cong-thuc/${recipe.id}`}>{recipe.title}</Link>
                      </td>
                      <td>{recipe.category?.name || "—"}</td>
                      <td>
                        <span className="review-stars">★ {recipe.ratingAverage}</span>
                      </td>
                      <td>{recipe.ratingCount} lượt</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
