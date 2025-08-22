"use client";

import { FiStar, FiMessageSquare, FiEye, FiTrendingUp } from "react-icons/fi";

export default function ReviewsPageCards({ stats, isLoading }) {
  const cards = [
    {
      title: "Total Reviews",
      value: stats?.total || 0,
      icon: FiMessageSquare,
      color: "blue",
      description: "All time reviews"
    },
    {
      title: "Average Rating",
      value: stats?.averageRating || "0.0",
      icon: FiStar,
      color: "yellow",
      description: "Overall rating",
      suffix: "/5.0"
    },
    {
      title: "Needs Response",
      value: stats?.needingResponse || 0,
      icon: FiEye,
      color: "orange",
      description: "Awaiting your response"
    },
    {
      title: "Response Rate",
      value: stats?.total > 0 ? Math.round(((stats.total - (stats.needingResponse || 0)) / stats.total) * 100) : 0,
      icon: FiTrendingUp,
      color: "green",
      description: "Reviews responded to",
      suffix: "%"
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: "bg-blue-50 text-blue-600 border-blue-200",
      yellow: "bg-yellow-50 text-yellow-600 border-yellow-200",
      orange: "bg-orange-50 text-orange-600 border-orange-200",
      green: "bg-green-50 text-green-600 border-green-200"
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

            {/* Rating breakdown for average rating card */}
            {card.title === "Average Rating" && stats?.byRating && (
              <div className="mt-4 space-y-1">
                {[5, 4, 3, 2, 1].map((rating) => (
                  <div key={rating} className="flex items-center text-xs">
                    <span className="w-3 text-gray-500">{rating}</span>
                    <FiStar className="w-3 h-3 text-yellow-400 mx-1" />
                    <div className="flex-1 bg-gray-200 rounded-full h-1.5 mx-2">
                      <div
                        className="bg-yellow-400 h-1.5 rounded-full"
                        style={{
                          width: stats.total > 0 
                            ? `${((stats.byRating[rating] || 0) / stats.total) * 100}%` 
                            : '0%'
                        }}
                      ></div>
                    </div>
                    <span className="w-6 text-gray-500 text-right">
                      {stats.byRating[rating] || 0}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
