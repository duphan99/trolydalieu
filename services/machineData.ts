export interface MachineInfo {
  name: string;
  url: string;
  description: string;
  keywords: string[]; // Keywords to match against diagnosis
}

// Data extracted from https://osakaco.com/
export const OSAKACO_MACHINES: MachineInfo[] = [
  {
    name: "Laser CO2 Fractional KELO",
    url: "https://osakaco.com/san-pham/laser-co2-fractional-kelo/",
    description: "Công nghệ laser vi điểm để tái tạo da, điều trị sẹo rỗ, sẹo mụn, trẻ hóa da và thu nhỏ lỗ chân lông.",
    keywords: ["sẹo", "rỗ", "lỗ chân lông", "trẻ hóa", "nếp nhăn", "rạn da"],
  },
  {
    name: "Máy Laser Picotech",
    url: "https://osakaco.com/san-pham/may-laser-picotech/",
    description: "Laser xung pico giây giúp xóa xăm, điều trị nám, tàn nhang, bớt sắc tố và trẻ hóa da hiệu quả, ít tổn thương.",
    keywords: ["xóa xăm", "nám", "tàn nhang", "sắc tố", "bớt", "đồi mồi", "trẻ hóa"],
  },
  {
    name: "Máy Triệt Lông OPT SKIN PRO",
    url: "https://osakaco.com/san-pham/may-triet-long-opt-skin-pro/",
    description: "Công nghệ triệt lông nhanh OPT SHR giúp loại bỏ lông vĩnh viễn, an toàn trên nhiều vùng cơ thể, kết hợp trẻ hóa da.",
    keywords: ["triệt lông", "viêm nang lông"],
  },
  {
    name: "Máy Nâng Cơ HIFU 3D PRO-MAX",
    url: "https://osakaco.com/san-pham/may-nang-co-hifu-3d-pro-max/",
    description: "Sử dụng sóng siêu âm hội tụ cường độ cao (HIFU) để nâng cơ, săn chắc da, xóa nếp nhăn vùng mặt và cơ thể.",
    keywords: ["nâng cơ", "chảy xệ", "nếp nhăn", "săn chắc", "lão hóa"],
  },
  {
    name: "Máy Giảm Béo HIFU FU4.5-10S",
    url: "https://osakaco.com/san-pham/may-giam-beo-hifu-fu4-5-10s/",
    description: "Công nghệ HIFU tập trung năng lượng phá hủy các tế bào mỡ dưới da, giúp giảm béo và tạo đường nét cơ thể.",
    keywords: ["giảm béo", "mỡ thừa", "thon gọn"],
  },
  {
    name: "Máy Điện Di Nóng Lạnh ION PRO",
    url: "https://osakaco.com/san-pham/may-dien-di-nong-lanh-ion-pro/",
    description: "Giúp đưa dưỡng chất sâu vào da, làm dịu da sau các liệu trình laser, peel, và tăng cường hiệu quả sản phẩm.",
    keywords: ["dưỡng chất", "làm dịu", "phục hồi", "điện di"],
  },
  {
    name: "Máy Phân Tích Da A-ONE PRO",
    url: "https://osakaco.com/san-pham/may-phan-tich-da-a-one-pro/",
    description: "Phân tích chuyên sâu các chỉ số của da như độ ẩm, dầu, nếp nhăn, sắc tố để đưa ra chẩn đoán chính xác.",
    keywords: ["phân tích da", "soi da", "chẩn đoán"],
  },
  {
    name: "Máy Aqua Peel PRO FACIAL",
    url: "https://osakaco.com/san-pham/may-aqua-peel-pro-facial/",
    description: "Làm sạch sâu, tẩy tế bào chết, hút mụn cám, bã nhờn và cung cấp độ ẩm cho da bằng áp lực nước.",
    keywords: ["làm sạch sâu", "mụn cám", "bã nhờn", "tẩy tế bào chết", "peel", "mụn đầu đen"],
  }
];
