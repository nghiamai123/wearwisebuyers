"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

export function Overview() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

  useEffect(() => {
    const fetchRevenue = async () => {
      try {
        const userData = sessionStorage.getItem("user");
        if (!userData) {
          notify("User information not found!", "error");
          setIsLoading(false);
          return;
        }

        const user = JSON.parse(userData);
        const userId = user.id;
        const response = await fetch(
          `${BASE_URL}/api/supplier/revenue/${userId}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }
        const result = await response.json();
        const chartData = result.revenue.map((item) => ({
          name: item.name,
          total: item.total,
          month_year: item.month_year,
        }));
        setData(chartData);
      } catch (error) {
        console.error("Error fetching revenue data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRevenue();
  }, []);

  return (
    <ResponsiveContainer width="100%" height={400}>
      {isLoading ? (
        <p className="text-center text-gray-500">Loading data...</p>
      ) : data.length > 0 && data.some((item) => item.total > 0) ? (
        <BarChart
          data={data}
          barSize={60}
          barGap={20}
          barCategoryGap={40}
          margin={{ left: 50, top: 50, bottom: 15 }}
        >
          <XAxis
            dataKey="name"
            label={{
              value: "Month",
              position: "insideBottom",
              offset: -15,
              style: { fontWeight: "bold", fontSize: 16 },
            }}
            stroke="#888888"
            fontSize={16}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            width={100}
            label={{
              value: "Revenue (VND)",
              position: "top",
              offset: 30,
              style: { fontWeight: "bold", fontSize: 16 },
            }}
            stroke="#888888"
            fontSize={16}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) =>
              `${(value * 1000).toLocaleString("vi-VN")}`
            }
          />
          <Tooltip
            formatter={(value) => [
              `${parseFloat(value)
                .toFixed(3)
                .replace(/\B(?=(\d{3})+(?!\d))/g, ".")} VND`,
              "Revenue",
            ]}
            labelFormatter={(label, payload) => {
              if (payload.length > 0) {
                const monthYear = payload[0].payload.month_year;
                return `Month: ${label} (${monthYear})`;
              }
              return `Month: ${label}`;
            }}
            contentStyle={{
              fontSize: "14px",
              padding: "5px",
              borderRadius: "8px",
            }}
          />
          <Bar dataKey="total" fill="#3182CE" radius={[4, 4, 0, 0]} />
        </BarChart>
      ) : (
        <p className="text-center text-gray-500">
          No data available to display
        </p>
      )}
    </ResponsiveContainer>
  );
}
