// Hằng số dùng chung cho module công thức. UI chọn đơn vị và độ khó từ cùng danh sách này.
export const DIFFICULTIES = ['Dễ', 'Vừa', 'Khó'];

export const UNITS = [
  'g', 'kg', 'ml', 'l',
  'quả', 'củ', 'miếng', 'lát', 'nhánh', 'tép', 'bó', 'gói', 'lon',
  'muỗng cà phê', 'muỗng canh', 'chén',
];

// Trạng thái của bản nháp: draft -> pending -> approved | rejected
export const MODERATION_STATUSES = ['draft', 'pending', 'approved', 'rejected'];

// Quyết định hiển thị của admin
export const VISIBILITIES = ['visible', 'hidden'];

export const QUANTITY_TYPES = ['exact', 'to-taste'];
