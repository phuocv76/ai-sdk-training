export const previewDetailLine = (key: string, label: string, value: string) => (
  <p key={key}>
    <span className="font-medium text-[var(--foreground)]/80">{label}</span>{' '}
    <span className="break-words">{value}</span>
  </p>
);
