export default function MessageBubble({ role, text, kind }) {
  const isUser = role === 'user';
  return (
    <div className={`bubble-row ${isUser ? 'bubble-row--user' : 'bubble-row--bot'}`}>
      {!isUser && <div className="avatar avatar--bot">B</div>}
      <div className={`bubble bubble--${isUser ? 'user' : 'bot'} ${kind ? `bubble--${kind}` : ''}`}>
        {text.split('\n').map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>
    </div>
  );
}
