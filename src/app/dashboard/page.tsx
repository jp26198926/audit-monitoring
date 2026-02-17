"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import Card from "@/components/ui/Card";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { dashboardApi } from "@/lib/api";
import toast from "react-hot-toast";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface DashboardStats {
  totalAudits: number;
  totalFindings: number;
  totalVessels: number;
  overdueFindings: number;
}

interface ChartData {
  auditsByStatus: Array<{ status: string; count: number }>;
  findingsBySeverity: Array<{ severity: string; count: number }>;
}

const SEVERITY_COLORS: Record<string, string> = {
  Major: "#DC2626",
  Minor: "#F59E0B",
  Observation: "#10B981",
};

const STATUS_COLORS: Record<string, string> = {
  Planned: "#6366F1",
  Ongoing: "#3B82F6",
  Completed: "#10B981",
  Closed: "#6B7280",
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [charts, setCharts] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, chartsData] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getCharts(),
      ]);

      // Map backend response to frontend structure
      const mappedStats = {
        totalVessels: 0, // Backend doesn't provide this yet
        totalAudits: (statsData as any)?.audits?.total_ytd || 0,
        totalFindings: (statsData as any)?.findings?.total || 0,
        overdueFindings: (statsData as any)?.findings?.overdue || 0,
      };

      const mappedCharts = {
        auditsByStatus: ((chartsData as any)?.audits_by_party || []).map(
          (item: any) => ({
            status: item.party_name,
            count: item.count,
          }),
        ),
        findingsBySeverity: (
          (chartsData as any)?.findings_by_category || []
        ).map((item: any) => ({
          severity: item.category,
          count: item.count,
        })),
      };

      setStats(mappedStats);
      setCharts(mappedCharts);
    } catch (error: any) {
      toast.error(error.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <LoadingSpinner />
        </AppLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="space-y-6">
          {/* Page Header */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Overview of audits and findings
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <div>
                <div className="text-sm font-medium text-gray-500">
                  Total Vessels
                </div>
                <div className="mt-2 text-3xl font-bold text-gray-900">
                  {stats?.totalVessels || 0}
                </div>
              </div>
            </Card>

            <Card>
              <div>
                <div className="text-sm font-medium text-gray-500">
                  Total Audits
                </div>
                <div className="mt-2 text-3xl font-bold text-blue-600">
                  {stats?.totalAudits || 0}
                </div>
              </div>
            </Card>

            <Card>
              <div>
                <div className="text-sm font-medium text-gray-500">
                  Total Findings
                </div>
                <div className="mt-2 text-3xl font-bold text-orange-600">
                  {stats?.totalFindings || 0}
                </div>
              </div>
            </Card>

            <Card>
              <div>
                <div className="text-sm font-medium text-gray-500">
                  Overdue Findings
                </div>
                <div className="mt-2 text-3xl font-bold text-red-600">
                  {stats?.overdueFindings || 0}
                </div>
              </div>
            </Card>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Audits by Party */}
            <Card title="Audits by Party">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={charts?.auditsByStatus || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#3B82F6" radius={[8, 8, 0, 0]}>
                    {(charts?.auditsByStatus || []).map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={STATUS_COLORS[entry.status] || "#3B82F6"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Findings by Category */}
            <Card title="Findings by Category">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={charts?.findingsBySeverity || []}
                    dataKey="count"
                    nameKey="severity"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {(charts?.findingsBySeverity || []).map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={SEVERITY_COLORS[entry.severity] || "#6B7280"}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
