export interface ExperienceItem {
  role: string;
  company: string;
  period: string;
  achievements: string[];
}

export const experience: ExperienceItem[] = [
  {
    role: 'Senior Full-Stack & Creative Engineer',
    company: 'Independent / Studio Tech Labs',
    period: '2024 — Hiện tại',
    achievements: [
      'Thiết kế và phát triển các sản phẩm web tương tác cao, kết hợp Three.js, React Three Fiber và Next.js tối ưu hiệu năng 60fps trên đa nền tảng.',
      'Xây dựng hệ thống design tokens, micro-interactions và kiến trúc frontend hiện đại phục vụ hàng ngàn người dùng hoạt động hàng ngày.',
      'Tích hợp các mô hình AI/LLM vào luồng tự động hóa quy trình nghiệp vụ và phân tích dữ liệu theo thời gian thực.',
    ],
  },
  {
    role: 'Full-Stack Developer',
    company: 'NextGen Digital Solutions',
    period: '2022 — 2024',
    achievements: [
      'Phát triển các ứng dụng SaaS và CRM nội bộ bằng TypeScript, React, Node.js và PostgreSQL.',
      'Tối ưu hóa thời gian tải trang (LCP, CLS, FID) giảm 45% và tái cấu trúc API endpoints tăng 2.5x throughput.',
      'Cố vấn kỹ thuật và hướng dẫn đồng đội về Clean Code, automated testing (Vitest, Playwright) và CI/CD deployment.',
    ],
  },
  {
    role: 'Frontend & UI Engineer',
    company: 'Creative Media Agency',
    period: '2020 — 2022',
    achievements: [
      'Xây dựng hơn 15+ landing pages và web app thương mại điện tử với animations mượt mà bằng GSAP và CSS hiện đại.',
      'Hợp tác chặt chẽ cùng team Design (Figma, Blender) để biến bản vẽ thành giao diện responsive pixel-perfect.',
    ],
  },
];
