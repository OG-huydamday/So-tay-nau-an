export function notFound(req, res) {
  res.status(404).json({ message: `Không tìm thấy ${req.method} ${req.originalUrl}` });
}

export function errorHandler(error, _req, res, _next) {
  console.error(error);
  if (error.code === 11000) return res.status(409).json({ message: 'Dữ liệu đã tồn tại.', field: Object.keys(error.keyPattern || {})[0] });
  if (error.name === 'ValidationError') return res.status(400).json({ message: 'Dữ liệu chưa hợp lệ.', details: error.errors });
  res.status(error.status || 500).json({ message: error.message || 'Có lỗi xảy ra ở máy chủ.' });
}

