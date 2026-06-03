"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MOBILITY_OPTIONS, MOOD_OPTIONS, moodEmoji } from "@/lib/constants";

const TEAL = "#0d9488";

export type ChartPoint = {
  label: string;
  pain: number;
  mobility: number;
  mood: number;
};

const MOOD_COLORS: Record<number, string> = {
  1: "#dc2626",
  2: "#f97316",
  3: "#eab308",
  4: "#84cc16",
  5: "#0d9488",
};

export function RecoveryCharts({ data }: { data: ChartPoint[] }) {
  const mobilityTicks = MOBILITY_OPTIONS.map((m) => m.score);

  return (
    <div className="space-y-4">
      {/* Dolore */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Dolore nel tempo</CardTitle>
          <CardDescription>Scala 0–10</CardDescription>
        </CardHeader>
        <CardContent className="h-56 pl-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} width={28} />
              <Tooltip
                formatter={(v: number) => [`${v}/10`, "Dolore"]}
                labelStyle={{ color: "#334155" }}
              />
              <Line
                type="monotone"
                dataKey="pain"
                stroke={TEAL}
                strokeWidth={2.5}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Mobilità */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Progresso mobilità</CardTitle>
          <CardDescription>Da “a letto” a “normale”</CardDescription>
        </CardHeader>
        <CardContent className="h-56 pl-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis
                domain={[1, 4]}
                ticks={mobilityTicks}
                width={28}
                tick={{ fontSize: 12 }}
                tickFormatter={(v: number) =>
                  String(MOBILITY_OPTIONS.find((m) => m.score === v)?.score ?? v)
                }
              />
              <Tooltip
                formatter={(v: number) => [
                  MOBILITY_OPTIONS.find((m) => m.score === v)?.label ?? v,
                  "Mobilità",
                ]}
              />
              <Line
                type="monotone"
                dataKey="mobility"
                stroke="#0ea5e9"
                strokeWidth={2.5}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Umore */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Andamento umore</CardTitle>
          <CardDescription>Un punto per giorno</CardDescription>
        </CardHeader>
        <CardContent className="h-44 pl-0">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 8, right: 16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="label"
                type="category"
                allowDuplicatedCategory={false}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                dataKey="mood"
                domain={[0.5, 5.5]}
                ticks={[1, 2, 3, 4, 5]}
                width={32}
                tick={{ fontSize: 14 }}
                tickFormatter={(v: number) => moodEmoji(v)}
              />
              <ZAxis range={[120, 120]} />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                formatter={(v: number) => [
                  `${moodEmoji(v)} ${MOOD_OPTIONS.find((m) => m.value === v)?.label ?? ""}`,
                  "Umore",
                ]}
              />
              <Scatter
                data={data}
                shape={(props: { cx?: number; cy?: number; payload?: ChartPoint }) => {
                  const { cx, cy, payload } = props;
                  if (cx == null || cy == null || !payload) return <g />;
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={7}
                      fill={MOOD_COLORS[payload.mood] ?? TEAL}
                      stroke="#fff"
                      strokeWidth={2}
                    />
                  );
                }}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
