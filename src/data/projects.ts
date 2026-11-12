export type Category = 'Website' | 'CRM' | 'AI' | 'Game' | 'Experiments';
export type Project = {
  id: string;
  title: string;
  category: Category;
  description: string;
  stack: string[];
  features: string[];
  role: string;
  demo?: string;
  repository?: string;
  art: string;
  sample: boolean;
};

export const projects: Project[] = [
  {
    id: 'workspace',
    title: 'Personal Workspace',
    category: 'Website',
    description: 'Không gian làm việc diorama 3D kết hợp hệ điều hành giả lập phong cách isometric cozy workspace.',
    stack: ['Next.js', 'Three.js', 'React Three Fiber', 'Blender', 'GSAP', 'Zustand'],
    features: [
      'Mô hình 3D Blender tùy biến với bể cá cảnh thủy sinh, case PC quạt xoay và ánh sáng thực tế',
      'Camera zoom transition bằng GSAP chuyển mượt từ không gian phòng 3D vào hệ điều hành',
      'Quản lý đa cửa sổ độc lập (drag, resize, minimize, maximize) với Zustand',
      'Hỗ trợ chế độ truy cập trực tiếp /os siêu nhẹ không cần WebGL và tương thích hoàn toàn mobile',
    ],
    role: 'Creator & Lead Developer — 3D modeling, lighting, camera transitions, OS window manager',
    demo: '/os',
    repository: 'https://github.com',
    art: 'workspace',
    sample: false,
  },
  {
    id: 'studio-crm',
    title: 'Apex Flow — Intelligent CRM & Workspace',
    category: 'CRM',
    description: 'Hệ thống quản lý quan hệ khách hàng và luồng dự án tinh gọn dành cho các creative studio và freelancer.',
    stack: ['React', 'TypeScript', 'Tailwind CSS', 'Node.js', 'PostgreSQL'],
    features: [
      'Kanban board kéo thả realtime và pipeline theo dõi hợp đồng trực quan',
      'Tự động hóa báo cáo doanh thu và tiến độ công việc với biểu đồ tương tác',
      'Phân quyền chi tiết (RBAC) và tích hợp webhook đồng bộ thông báo',
    ],
    role: 'Full-Stack Architecture & UI/UX Design',
    demo: 'https://github.com',
    repository: 'https://github.com',
    art: 'crm',
    sample: false,
  },
  {
    id: 'thought-garden',
    title: 'Thought Garden — AI Knowledge Graph',
    category: 'AI',
    description: 'Trợ lý tri thức cá nhân biến ghi chú và tài liệu thành đồ thị kiến thức (Knowledge Graph) có khả năng hỏi đáp ngữ nghĩa.',
    stack: ['Next.js', 'Python', 'FastAPI', 'LangChain', 'Vector DB'],
    features: [
      'Trích xuất thực thể và liên kết tự động giữa các ý tưởng bằng LLM embedding',
      'Tìm kiếm tương đồng ngữ nghĩa (semantic search) siêu tốc dưới 50ms',
      'Giao diện trực quan hóa node-network tương tác 2D/3D mượt mà',
    ],
    role: 'AI Integration & Frontend Design',
    demo: 'https://github.com',
    repository: 'https://github.com',
    art: 'ai',
    sample: false,
  },
  {
    id: 'creative-lab',
    title: 'Interactive Canvas & Shader Playground',
    category: 'Experiments',
    description: 'Tập hợp các thử nghiệm đồ họa toán học, procedural generation, particle systems và custom GLSL shaders.',
    stack: ['WebGL', 'GLSL Shaders', 'Three.js', 'Canvas API'],
    features: [
      'Hệ thống mô phỏng hạt (particle physics) với lực hấp dẫn và tương tác chuột',
      'Custom raymarching và noise shaders render các khối fractal siêu thực',
      'Hỗ trợ xuất ảnh độ phân giải cao 4K trực tiếp từ WebGL buffer',
    ],
    role: 'Creative Coding & Math Exploration',
    demo: 'https://github.com',
    repository: 'https://github.com',
    art: 'experiment',
    sample: false,
  },
];

export const categories = ['All', 'Website', 'CRM', 'AI', 'Game', 'Experiments'] as const;
