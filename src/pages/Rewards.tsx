import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Star, Wallet, Lock, History, ShieldCheck } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

interface Withdrawal {
  id: string;
  amount: number;
  note: string | null;
  created_at: string;
}

const RewardsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [balance, setBalance] = useState(0);
  const [hasPin, setHasPin] = useState(false);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);

  // PIN setup
  const [pinOpen, setPinOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");

  // Withdraw flow
  const [wOpen, setWOpen] = useState(false);
  const [wAmount, setWAmount] = useState("");
  const [wNote, setWNote] = useState("");
  const [wPin, setWPin] = useState("");

  useEffect(() => { document.title = "FocusTrack — Rewards"; }, []);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [p, w] = await Promise.all([
      supabase.from("profiles").select("points_balance,parent_pin_hash").eq("id", user.id).maybeSingle(),
      supabase.from("withdrawals").select("id,amount,note,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
    ]);
    setBalance(p.data?.points_balance ?? 0);
    setHasPin(Boolean(p.data?.parent_pin_hash));
    setWithdrawals((w.data ?? []) as Withdrawal[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const savePin = async () => {
    if (!/^\d{4}$/.test(pin)) { toast.error("PIN must be 4 digits"); return; }
    if (pin !== pinConfirm) { toast.error("PINs don't match"); return; }
    setBusy(true);
    const { error } = await supabase.rpc("set_parent_pin", { _pin: pin });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Parent PIN saved");
    setPin(""); setPinConfirm(""); setPinOpen(false);
    load();
  };

  const withdraw = async () => {
    const amount = parseInt(wAmount, 10);
    if (!amount || amount <= 0) { toast.error("Enter a valid amount"); return; }
    if (amount > balance) { toast.error("Not enough points"); return; }
    if (!/^\d{4}$/.test(wPin)) { toast.error("PIN must be 4 digits"); return; }
    setBusy(true);
    const { data, error } = await supabase.rpc("withdraw_points", {
      _amount: amount, _pin: wPin, _note: wNote || null,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Withdrew ${amount} points`);
    setBalance(data as number);
    setWAmount(""); setWNote(""); setWPin(""); setWOpen(false);
    load();
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Rewards</h1>
        <p className="text-muted-foreground">Earn 10 points per completed session. Cash out with a parent PIN.</p>
      </div>

      {/* Balance card */}
      <div className="overflow-hidden rounded-2xl border border-border bg-gradient-primary p-8 text-primary-foreground shadow-elevated">
        <div className="flex items-center gap-3 text-sm font-medium opacity-90">
          <Wallet className="h-4 w-4" /> Current balance
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <Star className="h-8 w-8 fill-current" />
          <span className="text-5xl font-semibold tabular-nums tracking-tight">{balance}</span>
          <span className="text-lg opacity-90">points</span>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Dialog open={wOpen} onOpenChange={setWOpen}>
            <DialogTrigger asChild>
              <Button size="lg" variant="secondary" disabled={!hasPin || balance <= 0} className="shadow-soft">
                <Wallet className="mr-2 h-4 w-4" /> Withdraw
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Withdraw points</DialogTitle>
                <DialogDescription>Enter how many points to cash out and your parent PIN.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <Label htmlFor="w-amt">Amount</Label>
                  <Input id="w-amt" type="number" min={1} max={balance} value={wAmount} onChange={e => setWAmount(e.target.value)} placeholder={`Max ${balance}`} />
                </div>
                <div>
                  <Label htmlFor="w-note">Note (optional)</Label>
                  <Input id="w-note" value={wNote} onChange={e => setWNote(e.target.value)} placeholder="e.g. movie ticket" maxLength={100} />
                </div>
                <div>
                  <Label htmlFor="w-pin">Parent PIN</Label>
                  <Input id="w-pin" type="password" inputMode="numeric" maxLength={4} value={wPin} onChange={e => setWPin(e.target.value.replace(/\D/g, ""))} placeholder="4 digits" />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={withdraw} disabled={busy} className="w-full">
                  {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirm withdrawal
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={pinOpen} onOpenChange={setPinOpen}>
            <DialogTrigger asChild>
              <Button size="lg" variant="outline" className="border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20">
                <Lock className="mr-2 h-4 w-4" /> {hasPin ? "Change PIN" : "Set parent PIN"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{hasPin ? "Change parent PIN" : "Set parent PIN"}</DialogTitle>
                <DialogDescription>Ask a parent to choose a 4-digit PIN. They'll enter it to approve withdrawals.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <Label htmlFor="pin1">New PIN</Label>
                  <Input id="pin1" type="password" inputMode="numeric" maxLength={4} value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ""))} />
                </div>
                <div>
                  <Label htmlFor="pin2">Confirm PIN</Label>
                  <Input id="pin2" type="password" inputMode="numeric" maxLength={4} value={pinConfirm} onChange={e => setPinConfirm(e.target.value.replace(/\D/g, ""))} />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={savePin} disabled={busy} className="w-full">
                  {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save PIN
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        {!hasPin && (
          <p className="mt-4 flex items-center gap-2 text-sm opacity-90">
            <ShieldCheck className="h-4 w-4" /> Set a parent PIN to enable withdrawals.
          </p>
        )}
      </div>

      {/* History */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="mb-4 flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Withdrawal history</h2>
        </div>
        {withdrawals.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No withdrawals yet. Keep stacking points!</p>
        ) : (
          <ul className="divide-y divide-border">
            {withdrawals.map(w => (
              <li key={w.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">−{w.amount} points</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(w.created_at).toLocaleDateString()} · {new Date(w.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    {w.note ? ` · ${w.note}` : ""}
                  </p>
                </div>
                <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">withdrawn</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default RewardsPage;