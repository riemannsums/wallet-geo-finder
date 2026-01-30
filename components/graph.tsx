import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

export const description = "Transactions by hour of day"

interface ChartBarDefaultProps {
  data: { hour: string; transactions: number }[]
}

export function ChartBarDefault({ data }: ChartBarDefaultProps) {
  const sortedChartData = [...data].sort((a, b) => {
    const hourA = parseInt(a.hour.split(":")[0])
    const hourB = parseInt(b.hour.split(":")[0])
    return hourA - hourB
  })

  const totalTransactions = sortedChartData.reduce(
    (sum, d) => sum + d.transactions,
    0
  )

  const chartConfig = {
    transactions: { label: "Transactions", color: "var(--chart-1)" },
  } satisfies ChartConfig

  const peakHours = [...sortedChartData]
    .sort((a, b) => b.transactions - a.transactions)
    .slice(0, 1)
    .map((d) => d.hour.replace(":00", ""))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transactions v.s time (UTC)</CardTitle>
        <CardDescription>
          Analyzed your last {totalTransactions} transactions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={sortedChartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="hour"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="transactions" fill="red" radius={8} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 text-muted-foreground leading-none font-medium">
          Most active at {peakHours.join(", ").padStart(2, "0")}:00 (UTC)
        </div>
      </CardFooter>
    </Card>
  )
}
