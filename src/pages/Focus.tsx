import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Play, Square, AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const DURATIONS = [25, 45, 60] as const;
type Duration = typeof DURATIONS[number];
type Reason = "social_media" | "gaming" | "chatting" | "other";

const AWAY_FAIL_MS = 10_000;
const MAX_SWITCHES = 3;

const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

const FocusPage = () => {
  const { user } = useAuth();
  const [duration, setDuration] = useState<Duration>(25);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [remaining, setRemaining] = useState<number>(0);
  const [switches, setSwitches] = useState(0);
  const [busy, setBusy] = useState(false);
  const [showFailModal, setShowFailModal] = useState(false);
  const [reason, setReason] = useState<Reason>("social_media");
  const [failedSessionId, setFailedSessionId] = useState<string | null>(null);

  // refs to avoid stale closures inside event listeners
  const sessionIdRef = useRef<string | null>(null);
  const switchesRef = useRef(0);
  const awayAtRef = useRef<number | null>(null);
  const tickRef = useRef<number | null>(null);

  useEffect(() => { document.title = "FocusTrack — Focus session"; }, []);
  useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);
  useEffect(() => { switchesRef.current = switches; }, [switches]);

  const stopTicker = () => {
    if (tickRef.current) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
  };

  const failSession = async (sid: string) => {
    stopTicker();
    setSessionId(null);
    setStartedAt(null);
    setRemaining(0);
    awayAtRef.current = null;
    // Persist failure (status update; reason captured via modal)
    await supabase.from("sessions").update({
      status: "failed",
      end_time: new Date().toISOString(),
      tab_switches: switchesRef.current,
    }).eq("id", sid);
    setFailedSessionId(sid);
    setShowFailModal(true);
    toast.error("Session failed", { description: "Tell us what distracted you." });
  };

  const completeSession = async (sid: string) => {
    stopTicker();
    setSessionId(null);
    setStartedAt(null);
    setRemaining(0);
    await supabase.from("sessions").update({
      status: "success",
      end_time: new Date().toISOString(),
      tab_switches: switchesRef.current,
    }).eq("id", sid);
    // Award 10 points
    const { data: newBalance, error } = await supabase.rpc("award_session_points", { _points: 10 });
    if (error) {
      toast.success("🎉 Session complete!", { description: `${duration} min of focus.` });
    } else {
      toast.success("🎉 +10 points earned!", {
        description: `${duration} min of focus · Balance: ${newBalance} pts`,
      });
    }
  };

  // Visibility / blur listeners — only active during a session
  useEffect(() => {
    if (!sessionId) return;

    const onHidden = () => {
      awayAtRef.current = Date.now();
    };
    const onVisible = () => {
      const sid = sessionIdRef.current;
      if (!sid || awayAtRef.current == null) return;
      const awayMs = Date.now() - awayAtRef.current;
      awayAtRef.current = null;
      const newCount = switchesRef.current + 1;
      setSwitches(newCount);
      if (awayMs > AWAY_FAIL_MS) {
        failSession(sid);
        return;
      }
      if (newCount >= MAX_SWITCHES) {
        failSession(sid);
        return;
      }
      toast.warning(`Tab switch detected (${newCount}/${MAX_SWITCHES})`);
    };

    const onVis = () => {
      if (document.hidden) onHidden();
      else onVisible();
    };

    window.addEventListener("blur", onHidden);
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVis);

    return () => {
      window.removeEventListener("blur", onHidden);
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [sessionId]);

  const startSession = async () => {
    if (!user) return;
    setBusy(true);
    const { data, error } = await supabase
      .from("sessions")
      .insert({ user_id: user.id, duration_minutes: duration, status: "active" })
      .select()
      .single();
    setBusy(false);
    if (error || !data) {
      toast.error(error?.message ?? "Failed to start session");
      return;
    }
    const start = new Date(data.start_time).getTime();
    setSessionId(data.id);
    setStartedAt(start);
    setSwitches(0);
    switchesRef.current = 0;
    awayAtRef.current = null;

    // Accurate timer based on Date.now() deltas
    const totalMs = duration * 60 * 1000;
    const updateRemaining = () => {
      const elapsed = Date.now() - start;
      const left = Math.max(0, Math.ceil((totalMs - elapsed) / 1000));
      setRemaining(left);
      if (left <= 0) {
        completeSession(data.id);
      }
    };
    updateRemaining();
    tickRef.current = window.setInterval(updateRemaining, 250);
  };

  const cancelSession = async () => {
    if (!sessionId) return;
    failSession(sessionId);
  };

  const submitReason = async () => {
    if (!user || !failedSessionId) return;
    setBusy(true);
    const { error } = await supabase.from("distractions").insert({
      session_id: failedSessionId,
      user_id: user.id,
      reason,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setShowFailModal(false);
    setFailedSessionId(null);
    toast.success("Logged. Try again when ready.");
  };

  const totalSecs = duration * 60;
  const progress = sessionId ? ((totalSecs - remaining) / totalSecs) * 100 : 0;
  const circumference = 2 * Math.PI * 120;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold">Focus session</h1>
        <p className="text-muted-foreground">Stay on this tab. Leaving for more than 10s fails the session.</p>
      </div>

      {!sessionId && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <p className="mb-4 text-sm font-medium text-muted-foreground">Choose duration</p>
          <div className="grid grid-cols-3 gap-3">
            {DURATIONS.map(d => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={`rounded-xl border p-4 text-center transition-base ${
                  duration === d
                    ? "border-primary bg-accent text-accent-foreground shadow-glow"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <div className="text-2xl font-semibold">{d}</div>
                <div className="text-xs text-muted-foreground">minutes</div>
              </button>
            ))}
          </div>
          <Button onClick={startSession} disabled={busy} size="lg" className="mt-6 w-full bg-gradient-primary">
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
            Start focusing
          </Button>
        </div>
      )}

      {sessionId && (
        <div className="rounded-2xl border border-border bg-card p-8 shadow-elevated">
          <div className="flex flex-col items-center">
            <div className="relative">
              <svg width="280" height="280" className="-rotate-90">
                <circle cx="140" cy="140" r="120" stroke="hsl(var(--muted))" strokeWidth="12" fill="none" />
                <circle
                  cx="140" cy="140" r="120"
                  stroke="url(#g)"
                  strokeWidth="12"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference - (progress / 100) * circumference}
                  style={{ transition: "stroke-dashoffset 250ms linear" }}
                />
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" />
                    <stop offset="100%" stopColor="hsl(var(--primary-glow))" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-5xl font-semibold tabular-nums tracking-tight">{formatTime(remaining)}</div>
                <div className="mt-2 text-sm text-muted-foreground">{duration} min session</div>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2 text-sm">
              <AlertTriangle className={`h-4 w-4 ${switches > 0 ? "text-warning" : "text-muted-foreground"}`} />
              <span className={switches > 0 ? "text-warning" : "text-muted-foreground"}>
                Tab switches: {switches} / {MAX_SWITCHES}
              </span>
            </div>

            <Button variant="outline" onClick={cancelSession} className="mt-6">
              <Square className="mr-2 h-4 w-4" /> Give up
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
          <p>
            Anti-cheat is on: timer is server-anchored to your start time, so changing your device clock won't help. Switch tabs and we'll know.
          </p>
        </div>
      </div>

      <Dialog open={showFailModal} onOpenChange={setShowFailModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>What distracted you?</DialogTitle>
            <DialogDescription>Tracking this helps you spot patterns.</DialogDescription>
          </DialogHeader>
          <RadioGroup value={reason} onValueChange={v => setReason(v as Reason)} className="space-y-2 py-2">
            {[
              { v: "social_media", l: "Social media" },
              { v: "gaming", l: "Gaming" },
              { v: "chatting", l: "Chatting / messaging" },
              { v: "other", l: "Other" },
            ].map(o => (
              <div key={o.v} className="flex items-center gap-3 rounded-lg border border-border p-3">
                <RadioGroupItem value={o.v} id={o.v} />
                <Label htmlFor={o.v} className="flex-1 cursor-pointer">{o.l}</Label>
              </div>
            ))}
          </RadioGroup>
          <DialogFooter>
            <Button onClick={submitReason} disabled={busy} className="w-full">
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FocusPage;
