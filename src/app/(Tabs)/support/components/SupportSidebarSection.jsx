"use client";

import { useState } from "react";
import { FaCalendarTimes } from "react-icons/fa";

export default function SupportSidebarSection({
  tickets,
  activeIndex,
  setActiveIndex,
}) {
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.subject.toLowerCase().includes(searchText.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchText.toLowerCase());

    const matchesStatus =
      statusFilter === "All Status" || ticket.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="w-full lg:w-[350px] bg-white p-4 overflow-y-auto shadow rounded-md max-h-[50vh] md:max-h-[80vh] hide-scrollbar">
      <input
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        className="w-full px-4 py-2 mb-4 text-sm rounded-md bg-gray-100 outline-none focus:ring-0 placeholder:text-gray-400"
        placeholder="Search by subject or ticket ID..."
      />

      <div className="flex gap-3 items-center text-sm mb-3 flex-wrap">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-black rounded-md bg-gray-100 outline-none focus:ring-0 px-3 py-2 text-sm cursor-pointer"
        >
          <option>All Status</option>
          <option>Open</option>
          <option>Resolved</option>
        </select>
        <button className="text-black rounded-md bg-gray-100 outline-none focus:ring-0 px-3 py-2 text-sm flex items-center gap-2 cursor-pointer">
          <FaCalendarTimes />
          Date Range
        </button>
      </div>

      {filteredTickets.length > 0 ? (
        filteredTickets.map((ticket, index) => {
          const originalIndex = tickets.indexOf(ticket);
          return (
            <div
              key={ticket.id}
              className={`p-3 flex flex-col gap-3 border-1 border-gray-200 rounded-lg mb-2 cursor-pointer ${
                originalIndex === activeIndex
                  ? "bg-blue-50 border-l-4 border-gray-200"
                  : "hover:bg-blue-50"
              }`}
              onClick={() => setActiveIndex(originalIndex)}
            >
              <div className="flex justify-between items-center">
                <p className="text-md font-medium text-black">
                  {ticket.subject}
                </p>
                <p
                  className={`ml-2 text-xs font-semibold py-1 px-2 rounded-xl ${
                    ticket.status === "Open"
                      ? "text-yellow-600 bg-yellow-100"
                      : "text-green-600 bg-green-100"
                  }`}
                >
                  {ticket.status}
                </p>
              </div>
              <div className="text-xs text-gray-500 flex justify-between items-center">
                <p>{ticket.id}</p>
                <p>{ticket.time}</p>
              </div>
            </div>
          );
        })
      ) : (
        <p className="text-sm text-gray-500">No tickets found.</p>
      )}
    </div>
  );
}
