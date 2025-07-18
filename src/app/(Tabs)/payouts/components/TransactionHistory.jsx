"use client";
import { useState } from "react";

export default function TransactionHistory({ transactions }) {
  const ITEMS_PER_PAGE = 5;
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedType, setSelectedType] = useState("All");

  const filteredTransactions =
    selectedType === "All"
      ? transactions
      : transactions.filter((trx) => trx.type === selectedType);

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = filteredTransactions.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  function handlePrevious() {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  }

  function handleNext() {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  }

  function handleFilterChange(e) {
    setSelectedType(e.target.value);
    setCurrentPage(1);
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex flex-wrap items-center justify-between mb-4 gap-3">
        <h2 className="text-sm font-semibold text-gray-700">
          Transaction History
        </h2>
        <select
          value={selectedType}
          onChange={handleFilterChange}
          className="text-sm border border-gray-300 rounded px-3 py-2 bg-gray-100 outline-0 focus:ring-0 cursor-pointer"
        >
          <option value="All">All Transactions</option>
          <option value="Withdrawal">Withdrawal</option>
          <option value="Earning">Earning</option>
          <option value="Refund">Refund</option>
        </select>
      </div>

      {currentItems.length === 0 ? (
        <div className="text-center text-gray-500 text-sm py-8">
          No transactions to display.
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="overflow-x-auto hidden md:block">
            <table className="min-w-[600px] w-full text-sm text-left">
              <thead className="text-xs text-gray-500 border-b border-[#E5E7EB]">
                <tr>
                  <th className="px-3 py-3">Transaction ID</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Date</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((trx, i) => (
                  <tr key={i} className="border-b border-[#E5E7EB]">
                    <td className="p-3">#{trx.id}</td>
                    <td className="py-3">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          trx.type === "Withdrawal"
                            ? "bg-blue-100 text-blue-700"
                            : trx.type === "Earning"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {trx.type}
                      </span>
                    </td>
                    <td className="py-3 text-gray-500">{trx.description}</td>
                    <td className="py-3 text-gray-500">{trx.date}</td>
                    <td
                      className={`py-3 font-semibold ${
                        trx.amount < 0 ? "text-red-500" : "text-green-600"
                      }`}
                    >
                      {trx.amount < 0
                        ? `-$${Math.abs(trx.amount).toFixed(2)}`
                        : `+$${trx.amount.toFixed(2)}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {currentItems.map((trx, i) => (
              <div
                key={i}
                className="border border-[#E5E7EB] rounded-lg p-4 shadow-sm bg-white"
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-md font-semibold text-gray-600">
                    #{trx.id}
                  </h3>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      trx.type === "Withdrawal"
                        ? "bg-blue-100 text-blue-700"
                        : trx.type === "Earning"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {trx.type}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-1">
                  <strong className="text-black">Desc:</strong>{" "}
                  {trx.description}
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  <strong className="text-black">Date:</strong> {trx.date}
                </p>
                <p
                  className={`text-sm font-normal ${
                    trx.amount < 0 ? "text-red-500" : "text-green-600"
                  }`}
                >
                  <span>
                    <strong className="text-black">Amount: </strong>
                    <strong>
                      {trx.amount < 0
                        ? `-$${Math.abs(trx.amount).toFixed(2)}`
                        : `+$${trx.amount.toFixed(2)}`}
                    </strong>
                  </span>
                </p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Pagination */}
      <div className="text-xs text-gray-500 mt-4 flex flex-wrap items-center justify-between gap-3">
        <span>
          {filteredTransactions.length === 0
            ? "No transactions found"
            : `Showing ${startIndex + 1}–${Math.min(
                startIndex + ITEMS_PER_PAGE,
                filteredTransactions.length
              )} of ${filteredTransactions.length} transactions`}
        </span>
        <div className="flex gap-2">
          <button
            onClick={handlePrevious}
            disabled={currentPage === 1}
            className={`px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm ${
              currentPage === 1
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-700 hover:bg-gray-50 cursor-pointer"
            }`}
          >
            Previous
          </button>
          <button
            onClick={handleNext}
            disabled={currentPage === totalPages || totalPages === 0}
            className={`px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm ${
              currentPage === totalPages || totalPages === 0
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-700 hover:bg-gray-50 cursor-pointer"
            }`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
