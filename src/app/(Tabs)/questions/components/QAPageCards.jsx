"use client";

import { FiHelpCircle, FiMessageCircle, FiCheckCircle, FiTrendingUp } from "react-icons/fi";

export default function QAPageCards({ stats, isLoading }) {
  const cards = [
    {
      title: "Total Questions",
      value: stats?.total || 0,
      icon: FiHelpCircle,
      color: "blue",
      description: "All time questions"
    },
    {
      title: "Needs Answer",
      value: stats?.needingAnswer || 0,
      icon: FiMessageCircle,
      color: "orange",
      description: "Awaiting your response"
    },
    {
      title: "Answered",
      value: stats?.byStatus?.answered || 0,
      icon: FiCheckCircle,
      color: "green",
      description: "Questions answered"
    },
    {
      title: "Answer Rate",
      value: stats?.answerRate || "0.0",
      icon: FiTrendingUp,
      color: "purple",
      description: "Response percentage",
      suffix: "%"
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: "bg-blue-50 text-blue-600 border-blue-200",
      orange: "bg-orange-50 text-orange-600 border-orange-200",
      green: "bg-green-50 text-green-600 border-green-200",
      purple: "bg-purple-50 text-purple-600 border-purple-200"
    };
    return colors[color] || colors.blue;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-sm border animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="w-8 h-8 bg-gray-200 rounded"></div>
              <div className="w-16 h-4 bg-gray-200 rounded"></div>
            </div>
            <div className="w-20 h-8 bg-gray-200 rounded mb-2"></div>
            <div className="w-24 h-3 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div key={index} className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg border ${getColorClasses(card.color)}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {card.value}{card.suffix || ''}
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-1">
                {card.title}
              </h3>
              <p className="text-xs text-gray-500">
                {card.description}
              </p>
            </div>

            {/* Status breakdown for total questions card */}
            {card.title === "Total Questions" && stats?.byStatus && (
              <div className="mt-4 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Pending</span>
                  <span className="font-medium">{stats.byStatus.pending || 0}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Answered</span>
                  <span className="font-medium">{stats.byStatus.answered || 0}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Hidden</span>
                  <span className="font-medium">{stats.byStatus.hidden || 0}</span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
