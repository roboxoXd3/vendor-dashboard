"use client";

import { useState } from "react";
import ticketsData from "./data/tickets.json";
import SupportSidebarSection from "./components/SupportSidebarSection";
import SupportChatWindow from "./components/SupportChatWindow";

export default function SupportPage() {
  const [tickets, setTickets] = useState(ticketsData);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleSendMessage = (message) => {
    const updated = [...tickets];
    updated[activeIndex].messages.push(message);
    setTickets(updated);
  };

  const handleMarkResolved = () => {
    const updated = [...tickets];
    updated[activeIndex].status = "Resolved";
    setTickets(updated);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 p-4 max-w-7xl mx-auto w-full">
      <div className="w-full lg:w-1/3">
        <SupportSidebarSection
          tickets={tickets}
          activeIndex={activeIndex}
          setActiveIndex={setActiveIndex}
        />
      </div>

      <div className="w-full lg:w-2/3">
        <SupportChatWindow
          ticket={tickets[activeIndex]}
          onSendMessage={handleSendMessage}
          onMarkResolved={handleMarkResolved}
        />
      </div>
    </div>
  );
}
