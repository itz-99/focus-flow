import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Trophy, Flame } from "lucide-react";

interface Row { username: string; weekly_minutes: number; current_streak: number; }

const LeaderboardPage = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { document.title = "FocusTrack — Leaderboard"; }, []);

  useEffect(() => {
    supabase.rpc("get_leaderboard").then(({ data, error }) => {
      if (!error && data) setRows(data as Row[]);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Leaderboard</h1>
        <p className="text-muted-foreground">Top focusers this week.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        {rows.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">No data yet — be the first!</div>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((r, i) => (
              <li key={r.username + i} className="flex items-center gap-4 p-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold ${
                  i === 0 ? "bg-gradient-primary text-primary-foreground" :
                  i < 3 ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  {i === 0 ? <Trophy className="h-5 w-5" /> : i + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{r.username}</p>
                  <p className="text-xs text-muted-foreground">{r.weekly_minutes} min this week</p>
                </div>
                {r.current_streak > 0 && (
                  <div className="flex items-center gap-1 rounded-full bg-warning/15 px-3 py-1 text-xs font-medium text-warning">
                    <Flame className="h-3 w-3" /> {r.current_streak}d
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;
