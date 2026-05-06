import type { ReactNode } from "react";

/**
 * Renders `**segments**` as bold; leaves plain text unchanged.
 * Used where assistant copy uses Markdown bold but the shell is not a Markdown renderer.
 */
export const renderInlineMarkdownBold = (text: string): ReactNode => {
  const re = /\*\*(.+?)\*\*/g;
  const nodes: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(text.slice(last, match.index));
    }
    nodes.push(
      <strong key={`ib-${key++}`} className="font-semibold">
        {match[1]}
      </strong>,
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) {
    nodes.push(text.slice(last));
  }
  if (nodes.length === 0) return text;
  if (nodes.length === 1) return nodes[0];
  return <>{nodes}</>;
};
