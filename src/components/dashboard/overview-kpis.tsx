import { ArrowUpRight, Calendar, DollarSign, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { cn } from "~/lib/utils";

const kpis = [
  {
    title: "Monthly Recurring Revenue",
    value: "$2,450",
    change: "+12.5%",
    trend: "up",
    icon: DollarSign,
    color: "from-green-500 to-emerald-600",
    bgColor: "from-green-50 to-emerald-50",
    borderColor: "border-green-200",
  },
  {
    title: "Active Subscribers",
    value: "78",
    change: "+6 this month",
    trend: "up",
    icon: Users,
    color: "from-blue-500 to-cyan-600",
    bgColor: "from-blue-50 to-cyan-50",
    borderColor: "border-blue-200",
  },
  {
    title: "Next Payout",
    value: "$1,890",
    change: "Dec 15, 2024",
    trend: "neutral",
    icon: Calendar,
    color: "from-purple-500 to-violet-600",
    bgColor: "from-purple-50 to-violet-50",
    borderColor: "border-purple-200",
  },
];

export function OverviewKPIs() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {kpis.map((kpi, index) => {
        const Icon = kpi.icon;
        return (
          <Card
            key={kpi.title}
            className={cn(
              "group hover:-translate-y-1 relative overflow-hidden border-0 bg-gradient-to-br transition-all duration-300 hover:shadow-black/5 hover:shadow-lg",
              kpi.bgColor,
              kpi.borderColor,
              "slide-in-from-bottom-4 animate-in duration-500",
            )}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent" />
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="font-medium text-gray-700 text-sm">
                {kpi.title}
              </CardTitle>
              <div
                className={cn(
                  "rounded-lg bg-gradient-to-br p-2",
                  kpi.color,
                  "shadow-sm",
                )}
              >
                <Icon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="mb-2 font-bold text-3xl text-gray-900 transition-transform duration-200 group-hover:scale-105">
                {kpi.value}
              </div>
              <div className="flex items-center gap-2 text-sm">
                {kpi.trend === "up" && (
                  <div className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-green-700">
                    <ArrowUpRight className="h-3 w-3" />
                    <span className="font-medium">{kpi.change}</span>
                  </div>
                )}
                {kpi.trend === "neutral" && (
                  <span className="font-medium text-gray-600">
                    {kpi.change}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
