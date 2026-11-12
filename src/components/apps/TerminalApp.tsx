'use client';
import { useEffect, useRef, useState } from 'react';
import { parseCommand } from '@/lib/terminal';
import { useWindowStore } from '@/stores/windowStore';
type Line = { command?: string; text: string };
export function TerminalApp() {
  const [lines, setLines] = useState<Line[]>([{ text: 'DongOS shell · v1.0\nA small terminal for curious people. Type help to get started.' }]);
  const [input, setInput] = useState(''); const [history, setHistory] = useState<string[]>([]); const [cursor, setCursor] = useState(-1);
  const end = useRef<HTMLDivElement>(null); const open = useWindowStore(s => s.open);
  useEffect(() => { end.current?.scrollIntoView({ block: 'nearest' }); }, [lines]);
  return <div className="terminal-app" onClick={e => { if (e.target === e.currentTarget) e.currentTarget.querySelector('input')?.focus(); }}><div className="terminal-output" aria-live="polite">{lines.map((line, i) => <div key={i}>{line.command && <p><span>visitor@dongos</span> <b>~ $</b> {line.command}</p>}<pre>{line.text}</pre></div>)}</div><form onSubmit={e => { e.preventDefault(); if (!input.trim()) return; const result = parseCommand(input); setHistory(h => [...h, input]); setCursor(-1); if (result.type === 'clear') setLines([]); else { if (result.type === 'open') open(result.app); setLines(l => [...l, { command: input, text: result.type === 'open' ? `Opening ${result.app}…` : result.text }]); } setInput(''); }}><label htmlFor="terminal-input"><span>visitor@dongos</span> <b>~ $</b></label><input id="terminal-input" aria-label="Terminal command" autoComplete="off" autoCapitalize="off" spellCheck={false} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'ArrowUp') { e.preventDefault(); const next = cursor === -1 ? history.length - 1 : Math.max(0, cursor - 1); setCursor(next); setInput(history[next] ?? ''); } if (e.key === 'ArrowDown') { e.preventDefault(); const next = cursor + 1; setCursor(next >= history.length ? -1 : next); setInput(history[next] ?? ''); } }} /></form><div ref={end} /></div>;
}
