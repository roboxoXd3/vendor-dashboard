import { useState, useRef, useEffect } from "react";
import { FiSend } from "react-icons/fi";
import { BsCheckCircle } from "react-icons/bs";
import { MdAttachFile } from "react-icons/md";

export default function SupportChatWindow({
  ticket,
  onSendMessage,
  onMarkResolved,
}) {
  const [newMsg, setNewMsg] = useState("");
  const bottomRef = useRef(null);

  const sendMessage = () => {
    if (!newMsg.trim()) return;

    const message = {
      from: "user",
      text: newMsg,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    onSendMessage(message);
    setNewMsg("");
  };

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [ticket.messages]);

  return (
    <div className="flex-1 bg-white rounded-md shadow flex flex-col max-h-[80vh]">
      {/* Header */}
      <div className="flex justify-between items-start mb-4 border-b border-gray-200 p-4 flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold">{ticket.subject}</h2>
          <div className="flex gap-4 items-center flex-wrap">
            <p className="text-sm text-gray-600">{ticket.id}</p>
            <span
              className={`text-xs font-medium px-2 py-1 rounded-xl ${
                ticket.status === "Open"
                  ? "bg-yellow-100 text-yellow-600"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {ticket.status}
            </span>
          </div>
        </div>
        {ticket.status === "Open" && (
          <button
            onClick={onMarkResolved}
            className="flex items-center text-sm px-3 py-1.5 rounded text-[var(--color-theme)] bg-[var(--color-theme-light)]"
          >
            <BsCheckCircle className="mr-1" />
            Mark as Resolved
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4 pr-2 mb-4 hide-scrollbar">
        {ticket.messages?.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${
              msg.from === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div className="max-w-[85%] md:max-w-[55%]">
              <div
                className={`rounded-md px-4 py-2 text-sm ${
                  msg.from === "user"
                    ? "bg-[var(--color-theme)] text-white"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                <p>{msg.text}</p>
              </div>
              <div
                className={`text-[10px] text-gray-600 mt-1 ${
                  msg.from === "user" ? "text-right" : "text-left"
                }`}
              >
                {msg.time}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 pt-4 p-4 flex flex-wrap gap-3 items-center">
        <textarea
          name="message"
          rows={3}
          placeholder="Type your message..."
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          className="flex-1 min-w-[200px] w-full md:w-auto px-4 py-2 text-sm rounded-md outline-none bg-gray-100 resize-none"
        />
        <div className="flex gap-2 items-center">
          <button className="text-xl rotate-45 cursor-pointer">
            <MdAttachFile />
          </button>
          <button
            onClick={sendMessage}
            className="flex items-center gap-1 text-white text-sm px-4 py-2 rounded cursor-pointer bg-[var(--color-theme)]"
          >
            <FiSend className="text-lg" /> Send
          </button>
        </div>
      </div>
    </div>
  );
}
