import type { AppId } from '@/types';
type Command = { type: 'open'; app: AppId } | { type: 'clear' } | { type: 'text' | 'unknown'; text: string };
export function parseCommand(input: string): Command {
  const command = input.trim().toLowerCase();
  if (command === 'clear') return { type: 'clear' };
  if (['about', 'skills', 'projects', 'contact'].includes(command)) return { type: 'open', app: command as AppId };
  if (command === 'help') return { type: 'text', text: 'Available commands:\n  about      Meet the person behind the screen\n  skills     Explore the toolbox\n  projects   Browse projects\n  contact    Say hello\n  clear      Clear the terminal\n  help       Show this guide\n\nTip: ↑ and ↓ browse your command history.' };
  return { type: 'unknown', text: `Command not found: ${input.trim()}. Type help for available commands.` };
}
