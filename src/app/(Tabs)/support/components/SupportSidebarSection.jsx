"use client";

import { useState, useEffect } from "react";
import { FaCalendarTimes, FaPlus } from "react-icons/fa";
import supportService from "@/services/supportService";

export default function SupportSidebarSection({
  tickets,
  activeTicketId,
  onTicketSelect,
  onNewTicket,
  loading,
  onFiltersChange
}) {
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const statuses = supportService.getStatuses();
  const priorities = [
    { value: 'all', label: 'All Priority' },
    ...supportService.getPriorities()
  ];

  // Notify parent when filters change
  useEffect(() => {
    if (onFiltersChange) {
      onFiltersChange({
        search: searchText,
        status: statusFilter,
        priority: priorityFilter
      });
    }
  }, [searchText, statusFilter, priorityFilter, onFiltersChange]);

  return (
    <div className="w-full lg:w-[350px] bg-white p-4 overflow-y-auto shadow rounded-md max-h-[50vh] md:max-h-[80vh] hide-scrollbar">
      {/* New Ticket Button */}
      <button
        onClick={onNewTicket}
        className="w-full mb-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
      >
        <FaPlus className="text-sm" />
        New Ticket
      </button>

      {/* Search */}
      <input
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        className="w-full px-4 py-2 mb-4 text-sm rounded-md bg-gray-100 outline-none focus:ring-0 placeholder:text-gray-400"
        placeholder="Search by subject or ticket ID..."
      />

      {/* Filters */}
      <div className="flex gap-3 items-center text-sm mb-3 flex-wrap">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-black rounded-md bg-gray-100 outline-none focus:ring-0 px-3 py-2 text-sm cursor-pointer"
        >
          {statuses.map(status => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
        
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="text-black rounded-md bg-gray-100 outline-none focus:ring-0 px-3 py-2 text-sm cursor-pointer"
        >
          {priorities.map(priority => (
            <option key={priority.value} value={priority.value}>
              {priority.label}
            </option>
          ))}
        </select>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Tickets List */}
      {!loading && tickets.length > 0 ? (
        tickets.map((ticket) => (
          <div
            key={ticket.id}
            className={`p-3 flex flex-col gap-3 border-1 border-gray-200 rounded-lg mb-2 cursor-pointer transition-colors ${
              ticket.id === activeTicketId
                ? "bg-blue-50 border-l-4 border-blue-500"
                : "hover:bg-blue-50"
            }`}
            onClick={() => onTicketSelect(ticket)}
          >
            <div className="flex justify-between items-start">
              <p className="text-sm font-medium text-black flex-1 pr-2">
                {ticket.subject}
              </p>
              <div className="flex flex-col gap-1 items-end">
                <span
                  className={`text-xs font-semibold py-1 px-2 rounded-xl ${
                    supportService.getStatusColor(ticket.status)
                  }`}
                >
                  {supportService.formatStatus(ticket.status)}
                </span>
                <span
                  className={`text-xs py-1 px-2 rounded-xl ${
                    supportService.getPriorityColor(ticket.priority)
                  }`}
                >
                  {supportService.formatPriority(ticket.priority)}
                </span>
              </div>
            </div>
            <div className="text-xs text-gray-500 flex justify-between items-center">
              <p>#{ticket.id.slice(-8)}</p>
              <div className="flex items-center gap-2">
                {ticket.message_count > 0 && (
                  <span className="bg-gray-200 text-gray-600 px-2 py-1 rounded-full text-xs">
                    {ticket.message_count} msg{ticket.message_count !== 1 ? 's' : ''}
                  </span>
                )}
                <p>{ticket.time_ago}</p>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              {supportService.formatCategory(ticket.category)}
            </div>
          </div>
        ))
      ) : !loading ? (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500 mb-2">No tickets found.</p>
          <button
            onClick={onNewTicket}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Create your first ticket
          </button>
        </div>
      ) : null}
    </div>
  );
}
