import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../p3/auth";
import "./reviews.css";

function getCsrfToken() {
  const match = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith("csrf="));
  return match ? match.slice("csrf=".length) : "";
}

export function RecipeReviews({ recipeId, initialAverage = 0, initialCount = 0 }) {
  const { session, loading: authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadTick, setReloadTick] = useState(0);

  const [ratingAverage, setRatingAverage] = useState(initialAverage || 0);
  const [ratingCount, setRatingCount] = useState(initialCount || 0);

  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  useEffect(() => {
    setRatingAverage(initialAverage || 0);
    setRatingCount(initialCount || 0);
    setPage(1);
    setSubmitError("");
    setSubmitSuccess("");
  }, [recipeId, initialAverage, initialCount]);

  useEffect(() => {
    const controller = new globalThis.AbortController();
    setLoading(true);
    setLoadError("");

    globalThis
      .fetch(`/api/recipes/${encodeURIComponent(recipeId)}/reviews?page=${page}&limit=10`, {
        credentials: "same-origin",
        signal: controller.signal,
      })
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok || !data) {
          throw new Error(data?.message || "Chưa tải được danh sách đánh giá.");
        }
        if (!controller.signal.aborted) {
          setItems(data.items || []);
          setTotal(data.total || 0);
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted && err.name !== "AbortError") {
          setLoadError(err.message || "Chưa tải được danh sách đánh giá.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [recipeId, page, reloadTick]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting || authLoading) return;
    setSubmitError("");
    setSubmitSuccess("");

    if (!session) {
      navigate("/dang-nhap", {
        state: { returnTo: location.pathname + location.search },
      });
      return;
    }

    const trimmed = comment.trim();
    if (!trimmed) {
      setSubmitError("Vui lòng nhập bình luận trước khi gửi đánh giá.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await globalThis.fetch(
        `/api/recipes/${encodeURIComponent(recipeId)}/reviews`,
        {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": getCsrfToken(),
          },
          body: JSON.stringify({ stars, comment: trimmed }),
        },
      );
      const data = await res.json().catch(() => null);
      if (res.status === 401) {
        navigate("/dang-nhap", {
          state: { returnTo: location.pathname + location.search },
        });
        return;
      }
      if (!res.ok || !data) {
        throw new Error(data?.message || "Chưa thể gửi đánh giá. Vui lòng thử lại.");
      }

      setRatingAverage(data.ratingAverage);
      setRatingCount(data.ratingCount);
      setComment("");
      setSubmitSuccess("Cảm ơn bạn đã gửi đánh giá!");
      if (page === 1) {
        setItems((prev) => [data.review, ...prev]);
        setTotal((prev) => prev + 1);
      } else {
        setPage(1);
      }
    } catch (err) {
      setSubmitError(err.message || "Chưa thể kết nối máy chủ. Nội dung của bạn vẫn được giữ lại.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="reviews-section" aria-labelledby="reviews-heading">
      <div className="reviews-summary">
        <h2 id="reviews-heading">Đánh giá &amp; Bình luận</h2>
        <span className="rating-pill" aria-live="polite">
          {ratingCount > 0
            ? `★ ${ratingAverage} / 5 (${ratingCount} đánh giá)`
            : "Chưa có đánh giá"}
        </span>
      </div>

      {!authLoading &&
        (session ? (
          <form className="review-form" onSubmit={handleSubmit} noValidate>
            <h3>Viết đánh giá của bạn</h3>
            <fieldset className="star-group">
              <legend>Chọn số sao</legend>
              {[5, 4, 3, 2, 1].map((value) => (
                <button
                  key={value}
                  type="button"
                  className="star-btn"
                  aria-pressed={stars === value}
                  onClick={() => setStars(value)}
                >
                  {value} ★
                </button>
              ))}
            </fieldset>

            <div>
              <label htmlFor="review-comment">Bình luận</label>
              <textarea
                id="review-comment"
                rows={3}
                maxLength={1000}
                placeholder="Chia sẻ cảm nhận hoặc mẹo nấu của bạn…"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>

            {submitError && (
              <p role="alert" className="error">
                {submitError}
              </p>
            )}
            {submitSuccess && (
              <p role="status" className="review-success">
                {submitSuccess}
              </p>
            )}

            <button type="submit" className="submit-btn" disabled={submitting}>
              {submitting ? "Đang gửi…" : "Gửi đánh giá"}
            </button>
          </form>
        ) : (
          <p className="review-login-prompt">
            Bạn cần{" "}
            <Link
              to="/dang-nhap"
              state={{ returnTo: location.pathname + location.search }}
            >
              đăng nhập
            </Link>{" "}
            để gửi sao và bình luận cho món ăn này.
          </p>
        ))}

      {loading && <p role="status">Đang tải bình luận…</p>}
      {loadError && (
        <p role="alert" className="error">
          {loadError}{" "}
          <button
            type="button"
            onClick={() => setReloadTick((n) => n + 1)}
          >
            Thử lại
          </button>
        </p>
      )}

      {!loading && !loadError && items.length === 0 && (
        <p>Chưa có bình luận nào. Hãy là người đầu tiên đánh giá món này!</p>
      )}

      {!loading && !loadError && items.length > 0 && (
        <>
          <ul className="review-list">
            {items.map((item) => (
              <li key={item.id} className="review-card">
                <div className="review-card-head">
                  <strong>{item.user?.name || "Thành viên"}</strong>
                  <span className="review-stars" aria-label={`${item.stars} trên 5 sao`}>
                    {"★".repeat(item.stars)}
                    {"☆".repeat(5 - item.stars)}
                  </span>
                </div>
                <p className="review-comment">{item.comment}</p>
                {item.createdAt && (
                  <span className="review-date">
                    {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                  </span>
                )}
              </li>
            ))}
          </ul>

          {(page > 1 || total > page * 10) && (
            <div className="review-pager">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Trước
              </button>
              <span>Trang {page}</span>
              <button
                type="button"
                disabled={page * 10 >= total}
                onClick={() => setPage((p) => p + 1)}
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
