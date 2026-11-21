export function notFound(req, res) {
  res.status(404).json({ code: 'NOT_FOUND', message: 'Không tìm thấy đường dẫn.' });
}

export function errorHandler(error, _req, res, _next) {
  if (error.code === 11000) return res.status(409).json({ code: 'CONFLICT', message: 'Dữ liệu đã tồn tại.' });
  if (error.type === 'entity.too.large') return res.status(413).json({ code: 'PAYLOAD_TOO_LARGE', message: 'Dữ liệu vượt quá giới hạn.' });
  if (error.name === 'ValidationError' || error.status === 400) {
    return res.status(400).json({ code: 'INVALID_INPUT', message: 'Dữ liệu chưa hợp lệ.' });
  }
  console.error('API request failed', error.name);
  res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra ở máy chủ.' });
}

