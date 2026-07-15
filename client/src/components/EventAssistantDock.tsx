import { Sparkles } from 'lucide-react';
import EventChat from './EventChat.js';

type Props = {
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
};

export default function EventAssistantDock({ isChatOpen, setIsChatOpen }: Props) {
  return (
    <>
      {isChatOpen && (
        <div className="chatbot-dock">
          <EventChat onClose={() => setIsChatOpen(false)} />
        </div>
      )}
      <button
        id="event-chat-launcher"
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="chatbot-launcher"
        aria-label={isChatOpen ? 'Tutup asisten Event Kuy' : 'Buka asisten Event Kuy'}
      >
        <Sparkles className="h-5 w-5" />
        <span>Event Assistant</span>
      </button>
    </>
  );
}
