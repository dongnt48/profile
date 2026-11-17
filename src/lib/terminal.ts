import type { AppId } from '@/types';
import type { Language } from '@/data/profile';
type Command = { type: 'open'; app: AppId } | { type: 'clear' } | { type: 'text' | 'unknown'; text: string };
export function parseCommand(input: string, language: Language = 'en'): Command {
  const command = input.trim().toLowerCase();
  if (command === 'clear') return { type: 'clear' };
  if (['about', 'skills', 'projects', 'contact'].includes(command)) return { type: 'open', app: command as AppId };
  if (command === 'help') return { type: 'text', text: language === 'en' ? 'Available commands:\n  about      Professional summary\n  skills     Technical skills\n  projects   Key projects\n  contact    Contact\n  clear      Clear the terminal\n  help       Show this guide\n\n↑ / ↓: command history.' : 'Các lệnh có sẵn:\n  about      Tóm tắt chuyên môn\n  skills     Kỹ năng chuyên môn\n  projects   Dự án trọng điểm\n  contact    Liên hệ\n  clear      Xóa màn hình\n  help       Hiển thị hướng dẫn\n\n↑ / ↓: lịch sử lệnh.' };
  return { type: 'unknown', text: language === 'en' ? `Command not found: ${input.trim()}. Type help for available commands.` : `Không tìm thấy lệnh: ${input.trim()}. Nhập help để xem hướng dẫn.` };
}
