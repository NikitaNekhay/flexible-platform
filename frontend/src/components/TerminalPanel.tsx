import { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';

interface TerminalPanelProps {
  logs: string[];
}

export function TerminalPanel({ logs }: TerminalPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const writtenCountRef = useRef(0);

  // Initialize terminal
  useEffect(() => {
    if (!containerRef.current) return;

    const styles = getComputedStyle(document.documentElement);
    const bg = styles.getPropertyValue('--mantine-color-dark-7').trim() || '#1A1B1E';
    const fg = styles.getPropertyValue('--mantine-color-dark-0').trim() || '#C1C2C5';

    const terminal = new Terminal({
      cursorBlink: false,
      disableStdin: true,
      fontSize: 13,
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      theme: {
        background: bg,
        foreground: fg,
        cursor: fg,
      },
      scrollback: 10000,
      convertEol: true,
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);

    terminal.open(containerRef.current);
    fitAddon.fit();

    terminalRef.current = terminal;
    fitAddonRef.current = fitAddon;
    writtenCountRef.current = 0;

    const handleResize = () => fitAddon.fit();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      terminal.dispose();
      terminalRef.current = null;
      fitAddonRef.current = null;
    };
  }, []);

  // Write new log lines incrementally
  useEffect(() => {
    const terminal = terminalRef.current;
    if (!terminal) return;

    const newLines = logs.slice(writtenCountRef.current);
    for (const line of newLines) {
      terminal.writeln(line);
    }
    writtenCountRef.current = logs.length;
  }, [logs]);

  return <div ref={containerRef} className="xterm-container" role="log" aria-label="Execution output" />;
}
