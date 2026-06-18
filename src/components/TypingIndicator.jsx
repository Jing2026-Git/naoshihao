export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-1">
      <span className="typing-dot w-1.5 h-1.5 rounded-full bg-text-tertiary" />
      <span className="typing-dot w-1.5 h-1.5 rounded-full bg-text-tertiary" />
      <span className="typing-dot w-1.5 h-1.5 rounded-full bg-text-tertiary" />
    </div>
  );
}
