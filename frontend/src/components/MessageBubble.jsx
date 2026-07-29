export default function MessageBubble({ role, text, kind }) {
  const isUser = role === 'user';
  // A hint belongs to the question above it rather than being its own remark,
  // so it sits in the avatar's column instead of repeating the avatar.
  const showAvatar = !isUser && kind !== 'hint';
  return (
    <div className={`bubble-row ${isUser ? 'bubble-row--user' : 'bubble-row--bot'}`}>
      {showAvatar && <div className="avatar avatar--bot">B</div>}
      {kind === 'hint' && <div className="avatar-spacer" aria-hidden="true" />}
      <div className={`bubble bubble--${isUser ? 'user' : 'bot'} ${kind ? `bubble--${kind}` : ''}`}>
        {text.split('\n').map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>
    </div>
  );
}
