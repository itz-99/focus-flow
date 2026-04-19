import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Target } from "lucide-react";

const GoalsPage = () => {
  const { user } = useAuth();
  const [minutes, setMinutes] = useState(60);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { document.title = "FocusTrack — Goals"; }, []);

  useEffect(() => {
    if (!user) return;
    supabase.from("goals").select("daily_minutes").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data) setMinutes(data.daily_minutes);
        setLoading(false);
      });
  }, [user]);

  const save = async () => {
    if (!user) return;
    if (minutes < 5 || minutes > 600) {
      toast.error("Goal must be between 5 and 600 minutes");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("goals").upsert({
      user_id: user.id,
      daily_minutes: minutes,
    }, { onConflict: "user_id" });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Goal updated");
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Daily goal</h1>
        <p className="text-muted-foreground">How many focused minutes do you want to hit each day?</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <Label htmlFor="goal" className="mb-2 flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" /> Minutes per day
        </Label>
        <Input
          id="goal"
          type="number"
          min={5}
          max={600}
          value={minutes}
          onChange={e => setMinutes(parseInt(e.target.value) || 0)}
        />
        <div className="mt-4 grid grid-cols-4 gap-2">
          {[30, 60, 90, 120].map(v => (
            <button key={v} onClick={() => setMinutes(v)} className="rounded-lg border border-border py-2 text-sm transition-base hover:border-primary hover:bg-accent">
              {v}m
            </button>
          ))}
        </div>
        <Button onClick={save} disabled={saving} className="mt-6 w-full bg-gradient-primary">
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save goal
        </Button>
      </div>
    </div>
  );
};

export default GoalsPage;
