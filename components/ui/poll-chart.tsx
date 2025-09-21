"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PollChartProps {
  options: string[];
  voteCounts: number[];
  totalVotes: number;
  userVote?: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];

export default function PollChart({ options, voteCounts, totalVotes, userVote }: PollChartProps) {
  const chartData = options.map((option, index) => ({
    name: option.length > 20 ? `${option.substring(0, 20)}...` : option,
    fullName: option,
    votes: voteCounts[index] || 0,
    percentage: totalVotes > 0 ? ((voteCounts[index] || 0) / totalVotes * 100).toFixed(1) : '0',
    isUserChoice: userVote === index,
  }));

  const pieData = chartData.map((item, index) => ({
    ...item,
    fill: COLORS[index % COLORS.length],
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{data.fullName}</p>
          <p className="text-blue-600">
            Votes: {data.votes} ({data.percentage}%)
          </p>
          {data.isUserChoice && (
            <p className="text-green-600 text-sm">✓ Your choice</p>
          )}
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{data.fullName}</p>
          <p className="text-blue-600">
            Votes: {data.votes} ({data.percentage}%)
          </p>
          {data.isUserChoice && (
            <p className="text-green-600 text-sm">✓ Your choice</p>
          )}
        </div>
      );
    }
    return null;
  };

  if (totalVotes === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Poll Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            No votes yet. Be the first to vote!
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Poll Results ({totalVotes} vote{totalVotes !== 1 ? 's' : ''})</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="bar" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bar">Bar Chart</TabsTrigger>
            <TabsTrigger value="pie">Pie Chart</TabsTrigger>
          </TabsList>
          
          <TabsContent value="bar" className="mt-4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="votes" 
                  fill="#8884d8"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
          
          <TabsContent value="pie" className="mt-4">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="votes"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>

        {/* Results Table */}
        <div className="mt-6">
          <h4 className="font-medium mb-3">Detailed Results</h4>
          <div className="space-y-2">
            {chartData.map((item, index) => (
              <div 
                key={index} 
                className={`flex justify-between items-center p-3 rounded-lg border ${
                  item.isUserChoice ? 'bg-green-50 border-green-200' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="font-medium">{item.fullName}</span>
                  {item.isUserChoice && (
                    <span className="text-green-600 text-sm">✓ Your choice</span>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-medium">{item.votes} votes</div>
                  <div className="text-sm text-gray-500">{item.percentage}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
