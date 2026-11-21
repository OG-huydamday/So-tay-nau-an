// Chuẩn hóa chuỗi dùng chung cho tìm kiếm và nguyên liệu.

// NFC + chữ thường + gộp khoảng trắng. Giữ nguyên dấu tiếng Việt.
export function normalizeText(value) {
  return String(value ?? '').normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase();
}

// Bỏ dấu tiếng Việt (đ -> d) để tìm kiếm không dấu.
export function foldText(value) {
  return normalizeText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}

export function slugify(value) {
  return foldText(value).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// Dùng khi đưa chuỗi người dùng nhập vào $regex.
export function escapeRegex(value) {
  return String(value ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
