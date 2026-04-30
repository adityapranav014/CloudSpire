import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts"

/* 
  Mock chart imitating a GitHub style contribution graph heatmap 
  Used for visualizing optimization/cost history across a year
*/

export function HeatmapCalendar({ data, label = "Savings History" }) {
  // Simplified version using an AreaChart with step curve to emulate a heatmap trend
  return (
    <div style={{ width: "100%", height: "200px" }}>
       <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} 
          />
          <YAxis hide />
          <RechartsTooltip 
             contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
             labelStyle={{ color: "hsl(var(--muted-foreground))" }}
             formatter={(value) => [`$${value}`, label]}
          />
          <Area 
            type="step" 
            dataKey="total" 
            stroke="hsl(var(--primary))" 
            fillOpacity={1} 
            fill="url(#colorTotal)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
