import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../p3/auth";
import { AdminShell, adminFetch } from "./AdminShell";

const STATUS_LABELS = {
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Bị từ chối",
  draft: "Bản nháp",
};

const VISIBILITY_LABELS = {
  visible: "Đang hiện",
  hidden: "Đã ẩn",
};

function formatIngredient(item) {
  if (item.quantityType === "to-taste") {
    return item.note ? `${item.name}: vừa đủ (${item.note})` : `${item.name}: vừa đủ`;
  }
  const base = `${item.name}: ${item.quantity} ${item.unit}`;
  return item.note ? `${base} (${item.note})` : base;
}

export function AdminModerationPage() {
  const { session } = useAuth();
  const isAdmin = session?.user?.role === "admin";

  const [statusFilter, setStatusFilter] = useState("pending");
  const [visibilityFilter, setVisibilityFilter] = useState("");
  const [page, setPage] = useState(1);
  const [listData, setListData] = useState({ items: [], total: 0, limit: 24 });
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState("");
  const [reloadTick, setReloadTick] = useState(0);

  const [selectedId, setSelectedId] = useState("");
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [viewMode, setViewMode] = useState("draft");

  const [rejectReason, setRejectReason] = useState("");
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [conflictError, setConflictError] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    const controller = new globalThis.AbortController();
    setListLoading(true);
    setListError("");

    const params = new globalThis.URLSearchParams({
      status: statusFilter,
      page: String(page),
      limit: "24",
    });
    if (visibilityFilter) params.set("visibility", visibilityFilter);

    adminFetch(`/api/admin/recipes?${params}`, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) {
          setListData(data);
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted && err.name !== "AbortError") {
          setListError(err.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setListLoading(false);
      });

    return () => controller.abort();
  }, [isAdmin, statusFilter, visibilityFilter, page, reloadTick]);

  useEffect(() => {
    if (!isAdmin || !selectedId) return;
    const controller = new globalThis.AbortController();
    setDetailLoading(true);
    setDetailError("");
    setActionError("");
    setConflictError(false);

    adminFetch(`/api/admin/recipes/${encodeURIComponent(selectedId)}`, {
      signal: controller.signal,
    })
      .then((data) => {
        if (controller.signal.aborted) return;
        setDetail(data);
        setViewMode(data.draft ? "draft" : "published");
        setShowRejectBox(false);
        setRejectReason("");
      })
      .catch((err) => {
        if (!controller.signal.aborted && err.name !== "AbortError") {
          setDetailError(err.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setDetailLoading(false);
      });

    return () => controller.abort();
  }, [isAdmin, selectedId, reloadTick]);

  function openRecipe(id) {
    setActionMessage("");
    setActionError("");
    setConflictError(false);
    if (id === selectedId) {
      setReloadTick((n) => n + 1);
    } else {
      setSelectedId(id);
    }
  }

  async function handleReview(action) {
    if (!detail || actionBusy) return;
    setActionError("");
    setActionMessage("");
    setConflictError(false);

    let trimmedReason;
    if (action === "reject") {
      trimmedReason = rejectReason.trim();
      if (!trimmedReason) {
        setActionError("Cần nhập lý do từ chối trước khi gửi.");
        return;
      }
      if (trimmedReason.length > 500) {
        setActionError("Lý do từ chối tối đa 500 ký tự.");
        return;
      }
    }

    setActionBusy(true);
    try {
      const payload =
        action === "approve"
          ? { action: "approve", version: detail.draftVersion }
          : { action: "reject", version: detail.draftVersion, reason: trimmedReason };
      const updated = await adminFetch(
        `/api/admin/recipes/${encodeURIComponent(detail.id)}/review`,
        { method: "POST", body: payload },
      );
      setActionMessage(
        updated.moderationStatus === "approved"
          ? "Đã duyệt công khai công thức."
          : "Đã từ chối bản gửi duyệt và lưu lý do.",
      );
      setShowRejectBox(false);
      setRejectReason("");
      setReloadTick((n) => n + 1);
    } catch (err) {
      setActionError(err.message);
      setConflictError(err.status === 409);
    } finally {
      setActionBusy(false);
    }
  }

  async function handleVisibilityToggle() {
    if (!detail || actionBusy) return;
    const nextVisibility = detail.visibility === "visible" ? "hidden" : "visible";
    setActionBusy(true);
    setActionError("");
    setActionMessage("");
    setConflictError(false);
    try {
      const updated = await adminFetch(
        `/api/admin/recipes/${encodeURIComponent(detail.id)}/visibility`,
        { method: "PATCH", body: { visibility: nextVisibility } },
      );
      setDetail((prev) => (prev ? { ...prev, visibility: updated.visibility } : prev));
      setListData((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          item.id === updated.id ? { ...item, visibility: updated.visibility } : item,
        ),
      }));
      setActionMessage(
        updated.visibility === "hidden"
          ? "Đã ẩn công thức khỏi trang công khai."
          : "Đã hiện lại công thức trên trang công khai.",
      );
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionBusy(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil((listData.total || 0) / (listData.limit || 24)));
  const shownContent =
    viewMode === "published"
      ? detail?.published || detail?.draft
      : detail?.draft || detail?.published;

  return (
    <AdminShell title="Duyệt & Quản lý Công thức">
      <div className="admin-toolbar">
        <label>
          <span>Trạng thái duyệt:</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="pending">Chờ duyệt</option>
            <option value="approved">Đã duyệt</option>
            <option value="rejected">Bị từ chối</option>
            <option value="draft">Bản nháp</option>
          </select>
        </label>

        <label>
          <span>Hiển thị:</span>
          <select
            value={visibilityFilter}
            onChange={(e) => {
              setVisibilityFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả</option>
            <option value="visible">Đang hiện</option>
            <option value="hidden">Đã ẩn</option>
          </select>
        </label>

        <button
          type="button"
          className="admin-btn"
          onClick={() => setReloadTick((n) => n + 1)}
        >
          Làm mới
        </button>
      </div>

      {listLoading && <p role="status">Đang tải danh sách công thức…</p>}
      {listError && (
        <p role="alert" className="error">
          {listError}{" "}
          <button type="button" onClick={() => setReloadTick((n) => n + 1)}>
            Thử lại
          </button>
        </p>
      )}

      <div className="mod-layout">
        {!listLoading && listData.items.length === 0 && (
          <p>Không có công thức nào phù hợp bộ lọc.</p>
        )}

        {!listLoading && listData.items.length > 0 && (
          <div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Công thức</th>
                    <th>Tác giả</th>
                    <th>Trạng thái</th>
                    <th>Phiên bản</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {listData.items.map((item) => (
                    <tr
                      key={item.id}
                      className={selectedId === item.id ? "mod-selected-row" : undefined}
                    >
                      <td>
                        <strong>{item.title}</strong>
                        {item.summary && <p className="mod-meta">{item.summary}</p>}
                        {item.rejectReason && (
                          <p className="mod-meta">Lý do từ chối: {item.rejectReason}</p>
                        )}
                      </td>
                      <td>
                        <strong>{item.author?.name || "Thành viên"}</strong>
                        <br />
                        <small>{item.author?.email || "—"}</small>
                      </td>
                      <td>
                        <div className="mod-badges">
                          <span className={`mod-badge ${item.moderationStatus}`}>
                            {STATUS_LABELS[item.moderationStatus] || item.moderationStatus}
                          </span>
                          <span className={`mod-badge ${item.visibility}`}>
                            {VISIBILITY_LABELS[item.visibility] || item.visibility}
                          </span>
                        </div>
                      </td>
                      <td>
                        Nháp v{item.draftVersion}
                        {item.publishedVersion > 0 && (
                          <>
                            <br />
                            <small>Công khai v{item.publishedVersion}</small>
                          </>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="admin-btn"
                          onClick={() => openRecipe(item.id)}
                        >
                          {item.moderationStatus === "pending" ? "Xem & duyệt" : "Chi tiết"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="mod-pager">
                <button
                  type="button"
                  className="admin-btn"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  ← Trang trước
                </button>
                <span>
                  Trang {page} / {totalPages} ({listData.total} món)
                </span>
                <button
                  type="button"
                  className="admin-btn"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Trang sau →
                </button>
              </div>
            )}
          </div>
        )}

        {detailLoading && <p role="status">Đang tải chi tiết công thức…</p>}
        {detailError && (
          <p role="alert" className="error">
            {detailError}
          </p>
        )}

        {!detailLoading && detail && (
          <article className="mod-detail" aria-label="Chi tiết kiểm duyệt công thức">
            <div className="mod-detail-head">
              <div>
                <h2>{shownContent?.title || "Chưa có tiêu đề"}</h2>
                <p className="mod-meta">
                  Tác giả: {detail.author?.name || "Thành viên"} (
                  {detail.author?.email || "—"}) · Nháp v{detail.draftVersion}
                  {detail.publishedVersion > 0 ? ` · Đã duyệt v${detail.publishedVersion}` : ""}
                </p>
              </div>
              <div className="mod-badges">
                <span className={`mod-badge ${detail.moderationStatus}`}>
                  {STATUS_LABELS[detail.moderationStatus] || detail.moderationStatus}
                </span>
                <span className={`mod-badge ${detail.visibility}`}>
                  {VISIBILITY_LABELS[detail.visibility] || detail.visibility}
                </span>
              </div>
            </div>

            {detail.draft && detail.published && (
              <p className="mod-notice">
                Công thức này đã có bản công khai. Duyệt bản nháp mới sẽ thay thế nội dung công
                khai hiện tại.
              </p>
            )}

            {detail.rejectReason && (
              <p className="mod-meta">
                <strong>Lý do từ chối gần nhất:</strong> {detail.rejectReason}
              </p>
            )}

            {actionMessage && (
              <p role="status" className="mod-success">
                {actionMessage}
              </p>
            )}

            {actionError && (
              <div role="alert" className="error">
                {actionError}{" "}
                {conflictError && (
                  <button
                    type="button"
                    className="admin-btn"
                    onClick={() => setReloadTick((n) => n + 1)}
                  >
                    Tải lại bản mới
                  </button>
                )}
              </div>
            )}

            {detail.draft && detail.published && (
              <div className="mod-content-tabs" role="group" aria-label="Chọn bản xem">
                <button
                  type="button"
                  aria-pressed={viewMode === "draft"}
                  onClick={() => setViewMode("draft")}
                >
                  Bản nháp / chờ duyệt (v{detail.draftVersion})
                </button>
                <button
                  type="button"
                  aria-pressed={viewMode === "published"}
                  onClick={() => setViewMode("published")}
                >
                  Bản đang công khai (v{detail.publishedVersion})
                </button>
              </div>
            )}

            {shownContent && (
              <>
                {shownContent.image && (
                  <img className="mod-cover" src={shownContent.image} alt={shownContent.title} />
                )}
                {shownContent.summary && <p>{shownContent.summary}</p>}
                <ul className="mod-specs">
                  <li>Loại món: {shownContent.category?.name || "Chưa chọn"}</li>
                  <li>Độ khó: {shownContent.difficulty || "—"}</li>
                  <li>Khẩu phần: {shownContent.servings ?? "—"}</li>
                  <li>Thời gian: {shownContent.totalMinutes || 0} phút</li>
                </ul>

                <div className="mod-columns">
                  <section>
                    <h3>Nguyên liệu ({shownContent.ingredients?.length || 0})</h3>
                    {shownContent.ingredients?.length ? (
                      <ul>
                        {shownContent.ingredients.map((item, idx) => (
                          <li key={`${item.name}-${idx}`}>{formatIngredient(item)}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mod-meta">Chưa có nguyên liệu.</p>
                    )}
                  </section>

                  <section>
                    <h3>Các bước ({shownContent.steps?.length || 0})</h3>
                    {shownContent.steps?.length ? (
                      <ol>
                        {shownContent.steps.map((step) => (
                          <li key={step.order}>
                            <span>{step.text}</span>
                            {step.timerMinutes > 0 && (
                              <small> ({step.timerMinutes} phút)</small>
                            )}
                            {step.image && (
                              <img
                                className="mod-step-img"
                                src={step.image}
                                alt={`Bước ${step.order}`}
                              />
                            )}
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className="mod-meta">Chưa có bước thực hiện.</p>
                    )}
                  </section>
                </div>
              </>
            )}

            <div className="mod-actions">
              <div className="mod-action-row">
                {detail.moderationStatus === "pending" && (
                  <>
                    <button
                      type="button"
                      className="mod-btn-primary"
                      disabled={actionBusy}
                      onClick={() => handleReview("approve")}
                    >
                      {actionBusy ? "Đang xử lý…" : `Duyệt công khai (v${detail.draftVersion})`}
                    </button>
                    <button
                      type="button"
                      className="mod-btn-danger"
                      disabled={actionBusy}
                      onClick={() => {
                        setShowRejectBox((v) => !v);
                        setActionError("");
                      }}
                    >
                      Từ chối…
                    </button>
                  </>
                )}

                <button
                  type="button"
                  className="admin-btn"
                  disabled={actionBusy}
                  onClick={handleVisibilityToggle}
                >
                  {detail.visibility === "visible" ? "Ẩn khỏi công khai" : "Hiện lại công khai"}
                </button>

                {detail.published && detail.visibility === "visible" && (
                  <Link className="admin-btn" to={`/cong-thuc/${detail.id}`}>
                    Xem trang công khai →
                  </Link>
                )}
              </div>

              {detail.moderationStatus === "pending" && showRejectBox && (
                <div className="mod-reject-box">
                  <label htmlFor="reject-reason-input">
                    Lý do từ chối (gửi về tác giả, tối đa 500 ký tự):
                  </label>
                  <textarea
                    id="reject-reason-input"
                    rows={3}
                    maxLength={500}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Ví dụ: Ảnh chưa rõ món ăn hoặc thiếu định lượng nguyên liệu."
                  />
                  <div className="mod-action-row">
                    <button
                      type="button"
                      className="mod-btn-danger"
                      disabled={actionBusy}
                      onClick={() => handleReview("reject")}
                    >
                      {actionBusy ? "Đang gửi…" : "Xác nhận từ chối"}
                    </button>
                    <button
                      type="button"
                      className="admin-btn"
                      disabled={actionBusy}
                      onClick={() => setShowRejectBox(false)}
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              )}
            </div>
          </article>
        )}
      </div>
    </AdminShell>
  );
}
