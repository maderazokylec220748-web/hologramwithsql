import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { TrendingUp, Clock, MessageSquare, ThumbsUp } from "lucide-react";

interface AnalyticsStats {
  totalQueries: number;
  avgResponseTime: number;
  popularQuestions: Array<{ question: string; count: number }>;
  categoryBreakdown: Record<string, number>;
  peakHours: Record<number, number>;
  userTypeDistribution: Record<string, number>;
  totalFeedback?: { positive: number; negative: number };
  recentEvents?: Array<{ eventType: string; eventData: any; createdAt: Date }>;
}

const COLORS = ['#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

export function AnalyticsDashboard() {
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [showCalendar, setShowCalendar] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (dateRange.from) params.append('startDate', dateRange.from.toISOString());
      if (dateRange.to) params.append('endDate', dateRange.to.toISOString());
      
      // Force cache busting for desktop app
      params.append('_t', Date.now().toString());
      
      const response = await fetch(`/api/admin/analytics?${params}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    
    // Auto-refresh every 30 seconds to keep desktop app in sync
    const interval = setInterval(() => {
      fetchAnalytics();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [dateRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Loading analytics...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">No analytics data available</div>
      </div>
    );
  }

  // Transform data for charts
  const categoryData = Object.entries(stats.categoryBreakdown).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  const peakHoursData = Object.entries(stats.peakHours)
    .map(([hour, count]) => ({
      hour: `${hour}:00`,
      queries: count,
    }))
    .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

  const userTypeData = Object.entries(stats.userTypeDistribution).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">View usage trends and statistics</p>
        </div>
        <div className="relative">
          <Button
            variant="outline"
            onClick={() => setShowCalendar(!showCalendar)}
          >
            {dateRange.from ? (
              dateRange.to ? (
                `${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`
              ) : (
                dateRange.from.toLocaleDateString()
              )
            ) : (
              "Select Date Range"
            )}
          </Button>
          {showCalendar && (
            <div className="absolute right-0 top-12 z-50 bg-white border rounded-lg shadow-lg p-4">
              <Calendar
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => {
                  setDateRange({ from: range?.from, to: range?.to });
                  if (range?.from && range?.to) {
                    setShowCalendar(false);
                  }
                }}
              />
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setDateRange({});
                    setShowCalendar(false);
                  }}
                >
                  Clear
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowCalendar(false)}
                >
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Questions</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.popularQuestions.length}</div>
            <p className="text-xs text-muted-foreground">Different questions asked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Popular Category</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {Object.keys(stats.categoryBreakdown).length > 0 ? (
              <>
                <div className="text-2xl font-bold capitalize">
                  {Object.entries(stats.categoryBreakdown).sort(([,a], [,b]) => b - a)[0][0]}
                </div>
                <p className="text-xs text-muted-foreground">
                  {Object.entries(stats.categoryBreakdown).sort(([,a], [,b]) => b - a)[0][1]} queries
                </p>
              </>
            ) : (
              <div className="text-2xl font-bold">-</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Peak Hour</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {Object.keys(stats.peakHours).length > 0 ? (
              <>
                <div className="text-2xl font-bold">
                  {Object.entries(stats.peakHours).sort(([,a], [,b]) => b - a)[0][0]}:00
                </div>
                <p className="text-xs text-muted-foreground">
                  {Object.entries(stats.peakHours).sort(([,a], [,b]) => b - a)[0][1]} queries
                </p>
              </>
            ) : (
              <div className="text-2xl font-bold">-</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Satisfaction</CardTitle>
            <ThumbsUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {stats.totalFeedback && (stats.totalFeedback.positive + stats.totalFeedback.negative) > 0 ? (
              <>
                <div className="text-2xl font-bold">
                  {Math.round((stats.totalFeedback.positive / (stats.totalFeedback.positive + stats.totalFeedback.negative)) * 100)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalFeedback.positive} positive, {stats.totalFeedback.negative} negative
                </p>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">No feedback yet</div>
                <p className="text-xs text-muted-foreground">Ask users for feedback</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Popular Questions */}
      <Card>
        <CardHeader>
          <CardTitle>Most Asked Questions</CardTitle>
          <CardDescription>Top 10 questions by frequency</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.popularQuestions.length > 0 ? (
            <div className="space-y-4">
              {stats.popularQuestions.map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.question}</p>
                    <p className="text-xs text-muted-foreground">Asked {item.count} times</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No questions asked yet</p>
          )}
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Category Distribution</CardTitle>
            <CardDescription>Questions by category</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8">No category data available</p>
            )}
          </CardContent>
        </Card>

        {/* User Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>User Type Distribution</CardTitle>
            <CardDescription>Questions by user type</CardDescription>
          </CardHeader>
          <CardContent>
            {userTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={userTypeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8">No user type data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Peak Hours Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Peak Usage Hours</CardTitle>
          <CardDescription>Number of queries by hour of day</CardDescription>
        </CardHeader>
        <CardContent>
          {peakHoursData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={peakHoursData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="queries" stroke="#f59e0b" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-center py-8">No peak hours data available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
