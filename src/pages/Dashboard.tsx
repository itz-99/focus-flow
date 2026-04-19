import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, Timer, Flame, Target, TrendingUp, AlertOctagon, Trophy } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip,
  PieChart, Pie, Cell,
} from "recharts";

interface SessionRow {
  id: string;
  start_time: string;
  end_time: string | null;
  duration_minutes: number;
  status: "active" | "success" | "failed";
}
interface DistractionRow { reason: string; created_at: string; }

const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
const startOfWeek = (d: Date) => {
  const x = startOfDay(d);
  const day = (x.getDay() + 6) % 7; // Monday-start
  x.setDate(x.getDate() - day);
  return x;
};
const minutesBetween = (a: string, b: string) => Math.max(0, (new Date(b).getTime() - new Date(a).getTime()) / 60000);

const REASON_LABEL: Record<string, string> = {
  social_media: "Social media",
  gaming: "Gaming",
  chatting: "Chatting",
  other: "Other",
};

const DashboardPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [distractions, setDistractions] = useState<DistractionRow[]>([]);
  const [goalMinutes, setGoalMinutes] = useState(60);
  const [username, setUsername] = useState<string>("");

  useEffect(() => { document.title = "FocusTrack — Dashboard"; }, []);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const since = new Date(); since.setDate(since.getDate() - 30);
      const [s, d, g, p] = await Promise.all([
        supabase.from("sessions").select("id,start_time,end_time,duration_minutes,status").eq("user_id", user.id).gte("start_time", since.toISOString()).order("start_time", { ascending: false }),
        supabase.from("distractions").select("reason,created_at").eq("user_id", user.id).gte("created_at", since.toISOString()),
        supabase.from("goals").select("daily_minutes").eq("user_id", user.id).maybeSingle(),
        supabase.from("profiles").select("username").eq("id", user.id).maybeSingle(),
      ]);
      setSessions((s.data ?? []) as SessionRow[]);
      setDistractions((d.data ?? []) as DistractionRow[]);
      if (g.data) setGoalMinutes(g.data.daily_minutes);
      if (p.data) setUsername(p.data.username);
      setLoading(false);
    };
    load();
  }, [user]);

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  const today = startOfDay(new Date());
  const weekStart = startOfWeek(new Date());
  const successful = sessions.filter(s => s.status === "success" && s.end_time);
  const failed = sessions.filter(s => s.status === "failed");

  const todayMin = Math.round(successful.filter(s => new Date(s.start_time) >= today).reduce((a, s) => a + minutesBetween(s.start_time, s.end_time!), 0));
  const weekMin = Math.round(successful.filter(s => new Date(s.start_time) >= weekStart).reduce((a, s) => a + minutesBetween(s.start_time, s.end_time!), 0));

  const totalCompleted = sessions.filter(s => s.status !== "active").length;
  const successRate = totalCompleted ? Math.round((successful.length / totalCompleted) * 100) : 0;

  // Streak
  const successDays = new Set(successful.map(s => startOfDay(new Date(s.start_time)).toISOString()));
  let streak = 0;
  const cursor = new Date(today);
  while (successDays.has(cursor.toISOString())) { streak++; cursor.setDate(cursor.getDate() - 1); }

  // Top distraction
  const counts: Record<string, number> = {};
  distractions.forEach(d => { counts[d.reason] = (counts[d.reason] ?? 0) + 1; });
  const topDistraction = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];

  // Weekly chart (last 7 days)
  const days: { day: string; minutes: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const next = new Date(d); next.setDate(next.getDate() + 1);
    const mins = Math.round(successful
      .filter(s => { const t = new Date(s.start_time); return t >= d && t < next; })
      .reduce((a, s) => a + minutesBetween(s.start_time, s.end_time!), 0));
    days.push({ day: d.toLocaleDateString(undefined, { weekday: "short" }), minutes: mins });
  }

  const pie = [
    { name: "Success", value: successful.length, color: "hsl(var(--success))" },
    { name: "Failed", value: failed.length, color: "hsl(var(--destructive))" },
  ];

  const goalPct = Math.min(100, Math.round((todayMin / goalMinutes) * 100));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Welcome back{username ? `, ${username}` : ""}</h1>
        <p className="text-muted-foreground">Here's how your focus is trending.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Timer} label="Today" value={`${todayMin}m`} sub={`Goal: ${goalMinutes}m`} />
        <StatCard icon={TrendingUp} label="This week" value={`${weekMin}m`} sub={`${successful.length} sessions`} />
        <StatCard icon={Trophy} label="Success rate" value={`${successRate}%`} sub={`${successful.length}/${totalCompleted || 0}`} />
        <StatCard icon={Flame} label="Streak" value={`${streak}`} sub={streak === 1 ? "day" : "days"} />
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Daily goal</p>
            <p className="text-2xl font-semibold">{todayMin} / {goalMinutes} min</p>
          </div>
          {goalPct >= 100 ? (
            <span className="rounded-full bg-success/15 px-3 py-1 text-sm font-medium text-success">Achieved 🎉</span>
          ) : (
            <Link to="/goals"><Button variant="outline" size="sm"><Target className="mr-2 h-4 w-4" />Adjust</Button></Link>
          )}
        </div>
        <Progress value={goalPct} className="h-2" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <p className="mb-4 text-sm font-medium text-muted-foreground">Last 7 days</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={days}>
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Bar dataKey="minutes" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <p className="mb-4 text-sm font-medium text-muted-foreground">Success vs failure</p>
          {pie.every(p => p.value === 0) ? (
            <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">No sessions yet</div>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pie} dataKey="value" innerRadius={50} outerRadius={80} paddingAngle={3}>
                    {pie.map((p, i) => <Cell key={i} fill={p.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="mt-3 flex justify-center gap-4 text-sm">
            <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-success" /> {successful.length} success</span>
            <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-destructive" /> {failed.length} failed</span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/15">
            <AlertOctagon className="h-5 w-5 text-warning" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Most common distraction (30 days)</p>
            <p className="text-lg font-semibold">
              {topDistraction ? `${REASON_LABEL[topDistraction[0]] ?? topDistraction[0]} · ${topDistraction[1]}×` : "Nothing yet — keep it up"}
            </p>
          </div>
        </div>
      </div>

      <Link to="/focus">
        <Button size="lg" className="w-full bg-gradient-primary md:w-auto">
          <Timer className="mr-2 h-4 w-4" /> Start a focus session
        </Button>
      </Link>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, sub }: { icon: typeof Timer; label: string; value: string; sub: string }) => (
  <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </div>
    <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
    <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
  </div>
);

export default DashboardPage;
