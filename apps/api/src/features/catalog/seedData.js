// Dữ liệu minh họa cho môi trường phát triển và demo. Ảnh để trống, UI hiển thị ảnh thay thế.
// Chỉ số đánh giá không seed ở đây: P1 tạo Review thật rồi mới có điểm.

const ing = (name, quantity, unit) => ({ name, quantity, unit });
const toTaste = (name) => ({ name, quantityType: 'to-taste' });
const steps = (...texts) => texts.map((text, index) => ({ order: index + 1, text }));

export const seedCategories = [
  { name: 'Món chính', slug: 'mon-chinh', icon: '🍛' },
  { name: 'Canh - Súp', slug: 'canh-sup', icon: '🍲' },
  { name: 'Món chay', slug: 'mon-chay', icon: '🥬' },
  { name: 'Món nhanh', slug: 'mon-nhanh', icon: '⚡' },
  { name: 'Tráng miệng', slug: 'trang-mieng', icon: '🍮' },
];

const eggTomato = {
  title: 'Trứng chiên cà chua',
  summary: 'Món trứng đơn giản cho bữa tối.',
  categorySlug: 'mon-chinh',
  prepMinutes: 5,
  cookMinutes: 10,
  difficulty: 'Dễ',
  servings: 2,
  ingredients: [
    ing('Trứng', 2, 'quả'), ing('Cà chua', 2, 'quả'), ing('Hành lá', 1, 'nhánh'),
    ing('Dầu ăn', 1, 'muỗng canh'), toTaste('Muối'),
  ],
  steps: steps(
    'Đánh trứng với chút muối, thái cà chua thành miếng vừa ăn.',
    'Phi thơm dầu, xào cà chua đến khi mềm rồi đổ trứng vào.',
    'Đảo nhẹ đến khi trứng chín, rắc hành lá và tắt bếp.',
  ),
  tags: ['trứng', 'nhanh'],
};

const waterSpinach = {
  title: 'Rau muống xào tỏi',
  summary: 'Rau muống xào lửa lớn, giòn và thơm mùi tỏi.',
  categorySlug: 'mon-nhanh',
  prepMinutes: 5,
  cookMinutes: 5,
  difficulty: 'Dễ',
  servings: 2,
  ingredients: [
    ing('Rau muống', 300, 'g'), ing('Tỏi', 3, 'tép'), ing('Dầu ăn', 1, 'muỗng canh'), toTaste('Muối'),
  ],
  steps: steps(
    'Nhặt rau muống, rửa sạch và để ráo nước. Băm nhỏ tỏi.',
    'Phi thơm tỏi, cho rau vào xào lửa lớn khoảng 2 phút.',
    'Nêm muối vừa ăn, đảo đều rồi dọn ra đĩa ngay.',
  ),
  tags: ['rau', 'nhanh'],
};

const fishSoup = {
  title: 'Canh chua cá',
  summary: 'Canh chua thanh vị me, ăn nóng với cơm trắng.',
  categorySlug: 'canh-sup',
  prepMinutes: 15,
  cookMinutes: 20,
  difficulty: 'Vừa',
  servings: 4,
  ingredients: [
    ing('Cá lóc', 400, 'g'), ing('Cà chua', 2, 'quả'), ing('Dứa', 100, 'g'),
    ing('Me', 1, 'muỗng canh'), ing('Nước', 1, 'l'), toTaste('Muối'),
  ],
  steps: steps(
    'Làm sạch cá, cắt khúc và ướp với chút muối.',
    'Đun nước với me, cho dứa và cà chua vào nấu sôi.',
    'Thả cá vào nấu chín, nêm nếm lại rồi tắt bếp.',
  ),
  tags: ['canh', 'cá'],
};

export const seedRecipes = [
  // Món công khai
  {
    seedKey: 'trung-chien-ca-chua',
    moderationStatus: 'approved',
    publishedVersion: 1,
    published: eggTomato,
  },
  {
    seedKey: 'rau-muong-xao-toi',
    moderationStatus: 'approved',
    publishedVersion: 1,
    published: waterSpinach,
  },
  {
    seedKey: 'canh-bi-do-thit-bam',
    moderationStatus: 'approved',
    publishedVersion: 1,
    published: {
      title: 'Canh bí đỏ thịt bằm',
      summary: 'Canh ngọt dịu từ bí đỏ, hợp bữa cơm gia đình.',
      categorySlug: 'canh-sup',
      prepMinutes: 10,
      cookMinutes: 20,
      difficulty: 'Dễ',
      servings: 3,
      ingredients: [
        ing('Bí đỏ', 300, 'g'), ing('Thịt heo bằm', 150, 'g'), ing('Hành tím', 1, 'củ'),
        ing('Nước', 800, 'ml'), ing('Hạt nêm', 1, 'muỗng cà phê'),
      ],
      steps: steps(
        'Gọt vỏ bí đỏ, cắt miếng vừa ăn. Băm nhỏ hành tím.',
        'Phi hành, xào thịt bằm cho săn lại.',
        'Đổ nước vào, cho bí đỏ vào nấu mềm khoảng 15 phút rồi nêm hạt nêm.',
      ),
      tags: ['canh', 'bí đỏ'],
    },
  },
  {
    seedKey: 'ga-kho-gung',
    moderationStatus: 'approved',
    publishedVersion: 1,
    published: {
      title: 'Gà kho gừng',
      summary: 'Gà kho đậm đà với gừng, ăn kèm cơm nóng.',
      categorySlug: 'mon-chinh',
      prepMinutes: 15,
      cookMinutes: 35,
      difficulty: 'Vừa',
      servings: 4,
      ingredients: [
        ing('Thịt gà', 500, 'g'), ing('Gừng', 30, 'g'), ing('Hành tím', 2, 'củ'),
        ing('Nước mắm', 2, 'muỗng canh'), ing('Đường', 1, 'muỗng canh'), toTaste('Tiêu'),
      ],
      steps: steps(
        'Chặt gà thành miếng, ướp với nước mắm, đường và hành tím băm trong 15 phút.',
        'Thái gừng sợi, phi thơm rồi cho gà vào xào săn.',
        'Thêm chút nước, kho lửa nhỏ đến khi nước sốt sệt lại.',
      ),
      tags: ['gà', 'kho'],
    },
  },
  {
    seedKey: 'dau-hu-sot-ca-chua',
    moderationStatus: 'approved',
    publishedVersion: 1,
    published: {
      title: 'Đậu hũ sốt cà chua',
      summary: 'Món chay dễ làm, đậu hũ chiên vàng sốt cà chua.',
      categorySlug: 'mon-chay',
      prepMinutes: 10,
      cookMinutes: 15,
      difficulty: 'Dễ',
      servings: 2,
      ingredients: [
        ing('Đậu hũ', 2, 'miếng'), ing('Cà chua', 2, 'quả'), ing('Hành lá', 1, 'nhánh'),
        ing('Nước tương', 1, 'muỗng canh'), ing('Dầu ăn', 1, 'muỗng canh'),
      ],
      steps: steps(
        'Cắt đậu hũ miếng vuông, chiên vàng các mặt.',
        'Xào cà chua với nước tương cho ra sốt.',
        'Cho đậu hũ vào đảo đều, rắc hành lá.',
      ),
      tags: ['chay', 'đậu hũ'],
    },
  },
  {
    seedKey: 'che-chuoi-nuoc-cot-dua',
    moderationStatus: 'approved',
    publishedVersion: 1,
    published: {
      title: 'Chè chuối nước cốt dừa',
      summary: 'Chè chuối ngọt béo, ăn nóng hoặc lạnh đều ngon.',
      categorySlug: 'trang-mieng',
      prepMinutes: 10,
      cookMinutes: 25,
      difficulty: 'Vừa',
      servings: 4,
      ingredients: [
        ing('Chuối', 4, 'quả'), ing('Nước cốt dừa', 200, 'ml'), ing('Đường', 3, 'muỗng canh'),
        ing('Muối', 1, 'muỗng cà phê'),
      ],
      steps: steps(
        'Bóc vỏ chuối, cắt khúc.',
        'Nấu chuối với nước và đường đến khi mềm.',
        'Pha nước cốt dừa với muối, rưới lên chè khi dọn ra.',
      ),
      tags: ['chè', 'tráng miệng'],
    },
  },

  // Món admin đã ẩn: không xuất hiện công khai
  {
    seedKey: 'com-chien-trung',
    moderationStatus: 'approved',
    publishedVersion: 1,
    visibility: 'hidden',
    published: {
      title: 'Cơm chiên trứng',
      summary: 'Cơm nguội chiên với trứng và hành lá.',
      categorySlug: 'mon-nhanh',
      prepMinutes: 5,
      cookMinutes: 10,
      difficulty: 'Dễ',
      servings: 2,
      ingredients: [
        ing('Cơm nguội', 2, 'chén'), ing('Trứng', 2, 'quả'), ing('Hành lá', 1, 'nhánh'),
        ing('Dầu ăn', 1, 'muỗng canh'), ing('Nước tương', 1, 'muỗng cà phê'),
      ],
      steps: steps(
        'Đánh trứng, phi hành, chiên trứng vừa chín.',
        'Cho cơm vào đảo tơi, nêm nước tương.',
      ),
      tags: ['cơm', 'nhanh'],
    },
  },

  // Món tác giả đã xóa: không xuất hiện công khai
  {
    seedKey: 'rau-cai-xao-da-xoa',
    moderationStatus: 'approved',
    publishedVersion: 1,
    deleted: true,
    published: { ...waterSpinach, title: 'Rau cải xào (đã xóa)' },
  },

  // Đã công khai và đang có bản sửa chờ duyệt: khách vẫn thấy bản published
  {
    seedKey: 'canh-chua-ca',
    moderationStatus: 'pending',
    publishedVersion: 1,
    draftVersion: 2,
    published: fishSoup,
    draft: { ...fishSoup, title: 'Canh chua cá lóc', servings: 5 },
  },

  // Món mới đang chờ duyệt: chưa có bản published
  {
    seedKey: 'nam-xao-sa-ot',
    moderationStatus: 'pending',
    draftVersion: 1,
    draft: {
      title: 'Nấm xào sả ớt',
      summary: 'Nấm xào cay thơm mùi sả, dùng cho bữa cơm chay.',
      categorySlug: 'mon-chay',
      prepMinutes: 10,
      cookMinutes: 10,
      difficulty: 'Dễ',
      servings: 2,
      ingredients: [
        ing('Nấm rơm', 250, 'g'), ing('Sả', 2, 'nhánh'), ing('Ớt', 1, 'quả'), ing('Dầu ăn', 1, 'muỗng canh'),
      ],
      steps: steps('Rửa nấm, cắt đôi. Băm sả và ớt.', 'Phi thơm sả ớt, cho nấm vào xào đến khi chín.'),
      tags: ['chay', 'nấm'],
    },
  },

  // Bản nháp bị từ chối và chưa đủ nội dung: dùng để thử luồng sửa và gửi lại
  {
    seedKey: 'goi-cuon-bi-tu-choi',
    moderationStatus: 'rejected',
    draftVersion: 1,
    rejectReason: 'Thiếu nguyên liệu và các bước làm, vui lòng bổ sung rồi gửi lại.',
    draft: { title: 'Gỏi cuốn', summary: 'Gỏi cuốn tôm thịt chấm nước mắm.' },
  },
];
