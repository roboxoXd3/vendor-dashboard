import { useState, useRef, useEffect } from "react";
import { FiSend } from "react-icons/fi";
import { BsCheckCircle } from "react-icons/bs";
import { MdAttachFile } from "react-icons/md";
import supportService from "@/services/supportService";
import toast from "react-hot-toast";

export default function SupportChatWindow({
  ticket,
  messages,
  onSendMessage,
  loading,
  sendingMessage,
  realtimeConnected = false,
  onReconnect
}) {
  const [newMsg, setNewMsg] = useState("");
  const bottomRef = useRef(null);


  const sendMessage = async () => {
    if (!newMsg.trim() || !ticket || sendingMessage) return;

    try {
      await onSendMessage(newMsg);
      setNewMsg("");
    } catch (error) {
      toast.error(error.message || "Failed to send message");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (!ticket) {
    return (
      <div className="flex-1 bg-white rounded-md shadow flex items-center justify-center">
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Select a ticket to view the conversation</p>
          <p className="text-sm text-gray-400">or create a new ticket to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white rounded-md shadow flex flex-col max-h-[80vh]">
      {/* Header */}
      <div className="flex justify-between items-start mb-4 border-b border-gray-200 p-4 flex-wrap gap-3">
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h2 className="text-lg font-semibold">{ticket.subject}</h2>
            {/* Realtime Connection Status */}
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                realtimeConnected 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  realtimeConnected ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                {realtimeConnected ? 'Live' : 'Offline'}
              </div>
              {!realtimeConnected && onReconnect && (
                <button
                  onClick={onReconnect}
                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                  title="Reconnect to live updates"
                >
                  Reconnect
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-4 items-center flex-wrap mt-2">
            <p className="text-sm text-gray-600">#{ticket.id.slice(-8)}</p>
            <span
              className={`text-xs font-medium px-2 py-1 rounded-xl ${
                supportService.getStatusColor(ticket.status)
              }`}
            >
              {supportService.formatStatus(ticket.status)}
            </span>
            <span
              className={`text-xs px-2 py-1 rounded-xl ${
                supportService.getPriorityColor(ticket.priority)
              }`}
            >
              {supportService.formatPriority(ticket.priority)}
            </span>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-xl">
              {supportService.formatCategory(ticket.category)}
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Created: {new Date(ticket.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4 pr-2 mb-4 hide-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <div className="ml-2 text-sm text-gray-500">Loading messages...</div>
            </div>
            <div className="mt-4 text-xs text-gray-400">
              If this takes too long, check the console for errors
            </div>
          </div>
        ) : messages.length > 0 ? (
          messages.map((msg, idx) => (
            <div
              key={msg.id || idx}
              className={`flex ${
                msg.from === "vendor" ? "justify-end" : "justify-start"
              }`}
            >
              <div className="max-w-[85%] md:max-w-[65%]">
                <div
                  className={`rounded-lg px-4 py-3 text-sm ${
                    msg.from === "vendor"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
                <div
                  className={`text-[10px] text-gray-500 mt-1 ${
                    msg.from === "vendor" ? "text-right" : "text-left"
                  }`}
                >
                  {msg.from === "vendor" ? "You" : "Support"} • {msg.time}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No messages yet.</p>
            <p className="text-sm text-gray-400 mt-1">Start the conversation by sending a message.</p>
          </div>
        )}
        
        {sendingMessage && (
          <div className="flex justify-end">
            <div className="max-w-[85%] md:max-w-[65%]">
              <div className="bg-blue-600 text-white rounded-lg px-4 py-3 text-sm opacity-70">
                <p className="whitespace-pre-wrap">{newMsg}</p>
              </div>
              <div className="text-[10px] text-gray-500 mt-1 text-right">
                Sending...
              </div>
            </div>
          </div>
        )}
        
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {ticket.status !== 'closed' ? (
        <div className="border-t border-gray-200 pt-4 p-4 flex flex-wrap gap-3 items-end">
          <textarea
            name="message"
            rows={3}
            placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
            value={newMsg}
            onChange={(e) => setNewMsg(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 min-w-[200px] w-full md:w-auto px-4 py-2 text-sm rounded-md outline-none bg-gray-100 resize-none focus:ring-2 focus:ring-blue-500"
            disabled={sendingMessage}
          />
          <div className="flex gap-2 items-center">
            <button
              onClick={sendMessage}
              disabled={!newMsg.trim() || sendingMessage}
              className="flex items-center gap-1 text-white text-sm px-4 py-2 rounded cursor-pointer bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FiSend className="text-lg" /> 
              {sendingMessage ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      ) : (
        <div className="border-t border-gray-200 p-4">
          <div className="text-center text-gray-500 text-sm">
            This ticket has been closed. No new messages can be sent.
          </div>
        </div>
      )}
    </div>
  );
}
