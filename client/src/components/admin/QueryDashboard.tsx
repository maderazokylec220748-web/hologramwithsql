import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { MessageSquare, Clock, TrendingUp, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Query } from "@shared/schema";

export function QueryDashboard() {
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();
  
  const { data: queries, isLoading } = useQuery<Query[]>({
    queryKey: ["/api/admin/queries"],
    staleTime: 0, // Always consider data stale
    refetchInterval: 5000, // Refetch every 5 seconds as backup
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });

  // WebSocket connection for real-time updates
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected for admin dashboard');
      setIsConnected(true);
      // Subscribe to admin updates
      ws.send(JSON.stringify({ type: 'admin_subscribe' }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'new_query') {
          console.log('New query received:', data.query);
          // Invalidate queries to refetch the latest data
          queryClient.invalidateQueries({ queryKey: ["/api/admin/queries"] });
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [queryClient]);

  const totalQueries = queries?.length || 0;
  const avgResponseTime = queries?.length
    ? Math.round(queries.reduce((acc, q) => acc + (q.responseTime || 0), 0) / queries.length)
    : 0;
  const todayQueries = queries?.filter(
    (q) => new Date(q.createdAt).toDateString() === new Date().toDateString()
  ).length || 0;

  const getCategoryColor = (category: string | null) => {
    if (!category) return "bg-muted text-muted-foreground";
    const colors: Record<string, string> = {
      admissions: "bg-[hsl(48,100%,50%)] text-[hsl(0,75%,25%)]",
      academic: "bg-[hsl(0,75%,35%)] text-[hsl(45,30%,98%)]",
      campus: "bg-[hsl(48,80%,45%)] text-[hsl(0,75%,25%)]",
      scholarships: "bg-[hsl(0,70%,30%)] text-[hsl(45,30%,98%)]",
    };
    return colors[category.toLowerCase()] || "bg-muted text-muted-foreground";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex gap-2">
          {[0, 0.2, 0.4].map((delay, i) => (
            <motion.div
              key={i}
              animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.4, repeat: Infinity, delay }}
              className="w-3 h-3 rounded-full bg-[hsl(48,100%,50%)]"
            />
          ))}
        </div>
      </div>
    );
  }

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/queries"] });
  };

  return (
    <div className="space-y-6">
      {/* Header with refresh button and connection status */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">Query Dashboard</h2>
          <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            {isConnected ? 'Live' : 'Disconnected'}
          </div>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-[hsl(48,100%,50%)]">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Queries</CardTitle>
            <MessageSquare className="h-4 w-4 text-[hsl(48,100%,50%)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[hsl(48,100%,50%)]">{totalQueries}</div>
            <p className="text-xs text-muted-foreground mt-1">All time interactions</p>
          </CardContent>
        </Card>

        <Card className="border-[hsl(48,100%,50%)]">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-[hsl(0,75%,35%)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[hsl(0,75%,35%)]">{avgResponseTime}ms</div>
            <p className="text-xs text-muted-foreground mt-1">AI processing speed</p>
          </CardContent>
        </Card>

        <Card className="border-[hsl(48,100%,50%)]">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Activity</CardTitle>
            <TrendingUp className="h-4 w-4 text-[hsl(48,100%,50%)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[hsl(48,100%,50%)]">{todayQueries}</div>
            <p className="text-xs text-muted-foreground mt-1">Queries received today</p>
          </CardContent>
        </Card>
      </div>

      {/* Queries Table */}
      <Card className="border-[hsl(48,100%,50%)]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Queries</CardTitle>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-xs text-muted-foreground">
                {isConnected ? 'Live updates' : 'Disconnected'}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>User Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Question</TableHead>
                  <TableHead>Response Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queries?.map((query) => (
                  <TableRow key={query.id} className="hover-elevate" data-testid={`row-query-${query.id}`}>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(query.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {query.userType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {query.category && (
                        <Badge className={getCategoryColor(query.category)}>
                          {query.category}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-md truncate" title={query.question}>
                      {query.question}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {query.responseTime}ms
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
