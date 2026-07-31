import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble.jsx';

export default function ChatWindow({ messages, sending }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  return (
    <div className="chat-window">
      {messages.map((m) => (
        <MessageBubble key={m.id} role={m.role} text={m.text} kind={m.kind} nudge={m.nudge} />
      ))}
      {sending && (
        <div className="bubble-row bubble-row--bot">
          <div className="bubble bubble--bot bubble--typing">Thinking...</div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
