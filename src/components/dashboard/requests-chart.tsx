'use client';

import { useAppContext } from '@/contexts/app-context';
import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart';
import { DocumentRequest } from '@/lib/types';

const chartConfig = {
  requests: {
    label: 'Requests',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

export function RequestsChart() {
  const { documentRequests } = useAppContext();

  const { chartData, yearRange } = useMemo(() => {
    if (!documentRequests || documentRequests.length === 0) {
      return { chartData: [], yearRange: new Date().getFullYear().toString() };
    }

    const monthlyCounts: { [key: number]: number } = {};
    let minYear = new Date().getFullYear();
    let maxYear = new Date().getFullYear();

    documentRequests.forEach((req: DocumentRequest) => {
      const date = new Date(req.requestDate);
      const year = date.getFullYear();
      const month = date.getMonth();

      minYear = Math.min(minYear, year);
      maxYear = Math.max(maxYear, year);

      monthlyCounts[month] = (monthlyCounts[month] || 0) + 1;
    });

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const data = monthNames.map((month, index) => ({
      month: month,
      requests: monthlyCounts[index] || 0,
    }));

    const yearDisplay = minYear === maxYear ? minYear.toString() : `${minYear} - ${maxYear}`;

    return { chartData: data, yearRange: yearDisplay };
  }, [documentRequests]);

  return (
    <Card className="fade-in transition-all hover:shadow-lg h-full">
      <CardHeader>
        <CardTitle>Document Requests Overview</CardTitle>
        <CardDescription>Monthly document requests - {yearRange}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="requests" fill="var(--color-requests)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
