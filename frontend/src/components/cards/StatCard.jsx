// components/stats/StatsCards.jsx
import React from "react";
import clsx from "clsx";

const colorMap = {
  blue: "bg-blue-100 text-blue-800",
  green: "bg-green-100 text-green-800",
  orange: "bg-orange-100 text-orange-800",
  purple: "bg-purple-100 text-purple-800",
};

export const StatCard = ({ label, value, color = "blue" }) => {
  return (
    <div className={clsx("p-4 rounded-lg shadow border", colorMap[color])}>
      <div className="text-sm font-medium">{label}</div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
};

export default StatCard;
