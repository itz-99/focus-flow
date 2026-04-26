import { Link, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Brain, Timer, Trophy, Shield, Sparkles, ArrowRight, Star, Flame, CheckCircle2 } from "lucide-react";
import heroImg from "@/assets/landing-hero.jpg";
import focusImg from "@/assets/landing-feature-focus.jpg";
import rewardsImg from "@/assets/landing-feature-rewards.jpg";
import streaksImg from "@/assets/landing-feature-streaks.jpg";

const Landing = () => {
  const { user, loading } = useAuth();

  useEffect(() => {
    document.title = "FocusTrack — Study deeper. Get rewarded.";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "FocusTrack turns study time into real rewards. Run distraction-proof focus sessions, build streaks, and cash points in with a parent PIN.");
  }, []);

  if (loading) return null;
  if (user) return <Navigate to="/app" replace />;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-soft">
              <Brain className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold tracking-tight">FocusTrack</span>
          </div>
          <div className="flex items-center gap-2">
            <a href="#features" className="hidden text-sm text-muted-foreground hover:text-foreground sm:block">Features</a>
            <a href="#how" className="hidden text-sm text-muted-foreground hover:text-foreground sm:block">How it works</a>
            <Link to="/auth">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero" aria-hidden />
        <div className="container grid gap-10 py-16 md:grid-cols-2 md:items-center md:py-24">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-primary shadow-soft">
              <Sparkles className="h-3.5 w-3.5" /> Made for students who actually want to focus
            </span>
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl lg:text-6xl">
              Study deeper.<br />
              <span className="bg-gradient-primary bg-clip-text text-transparent">Get paid for it.</span>
            </h1>
            <p className="max-w-lg text-lg text-muted-foreground">
              FocusTrack locks in your study time and turns it into points your parents can swap for real-world rewards. No more pretending — just put in the work and watch it pay off.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link to="/auth">
                <Button size="lg" className="bg-gradient-primary shadow-elevated">
                  Start your first session <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <a href="#features">
                <Button size="lg" variant="outline">See the features</Button>
              </a>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-primary" /> Free to use</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-primary" /> No credit card</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-primary" /> Parent-approved</span>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-primary opacity-10 blur-2xl" />
            <img
              src={heroImg}
              alt="Teenage student writing notes beside a laptop in soft natural light"
              width={1920}
              height={1080}
              className="relative w-full rounded-3xl border border-border shadow-elevated"
            />
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-y border-border bg-card/50">
        <div className="container grid grid-cols-2 gap-6 py-8 text-center md:grid-cols-4">
          {[
            { v: "10 pts", l: "Per finished session" },
            { v: "25–60 min", l: "Pick your focus length" },
            { v: "3 / 7 / 30", l: "Streak badge milestones" },
            { v: "1 PIN", l: "Parent-approved cashout" },
          ].map(s => (
            <div key={s.l}>
              <p className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{s.v}</p>
              <p className="mt-1 text-xs text-muted-foreground md:text-sm">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container py-20">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Three tools. One real habit.</h2>
          <p className="mt-3 text-muted-foreground">No gimmicks — just the parts that actually keep you off your phone.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <FeatureCard
            icon={Timer}
            title="Distraction-proof timer"
            desc="Pick 25, 45, or 60 minutes. Leave the tab and we catch it instantly. Three slips and the session is gone."
            image={focusImg}
          />
          <FeatureCard
            icon={Star}
            title="Real rewards, not stickers"
            desc="Finish a session, bank 10 points. Trade them in for whatever you and your parent agreed on — money, gear, screen time."
            image={rewardsImg}
          />
          <FeatureCard
            icon={Flame}
            title="Streaks that mean it"
            desc="Hit 3, 7, and 30 days in a row to unlock bronze, silver, and gold badges. Climb the weekly leaderboard with your friends."
            image={streaksImg}
          />
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-gradient-soft">
        <div className="container py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">From "just five more minutes" to focused</h2>
            <p className="mt-3 text-muted-foreground">Three steps. Less than a minute to set up.</p>
          </div>
          <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-3">
            {[
              { n: "1", t: "Press start", d: "Choose how long you want to focus. Phone goes face down, timer starts ticking." },
              { n: "2", t: "Bank the points", d: "Make it to the end without bailing and 10 points drop straight into your balance." },
              { n: "3", t: "Cash them in", d: "When you're ready, your parent enters a 4-digit PIN and you collect your reward." },
            ].map(s => (
              <div key={s.n} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-lg font-semibold text-accent-foreground">
                  {s.n}
                </div>
                <h3 className="text-lg font-semibold">{s.t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust row */}
      <section className="container py-20">
        <div className="grid gap-8 rounded-3xl border border-border bg-card p-8 shadow-soft md:grid-cols-3 md:p-12">
          {[
            { icon: Shield, t: "Tamper-proof", d: "Points are awarded server-side. You can't fake a session." },
            { icon: Trophy, t: "Built to motivate", d: "Streaks, badges, and a leaderboard keep you coming back." },
            { icon: Sparkles, t: "Parents in the loop", d: "A simple PIN means rewards stay honest and agreed-upon." },
          ].map(({ icon: Icon, t, d }) => (
            <div key={t} className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">{t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container py-20">
        <div className="overflow-hidden rounded-3xl border border-border bg-card p-10 text-center shadow-soft md:p-16">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Your next study session could pay for pizza.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            Sign up, start a timer, finish strong. That's it.
          </p>
          <Link to="/auth">
            <Button size="lg" className="mt-6 bg-gradient-primary shadow-elevated">
              Create my free account <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="container flex flex-col items-center justify-between gap-2 py-6 text-sm text-muted-foreground md:flex-row">
          <p>© {new Date().getFullYear()} FocusTrack</p>
          <p>Study deeper. Get paid for it.</p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({
  icon: Icon, title, desc, image,
}: { icon: typeof Timer; title: string; desc: string; image?: string }) => (
  <div className="group rounded-2xl border border-border bg-card p-6 shadow-soft transition-base hover:shadow-elevated">
    {image && (
      <div className="mb-5 overflow-hidden rounded-xl bg-accent">
        <img src={image} alt="" loading="lazy" width={1024} height={1024} className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-105" />
      </div>
    )}
    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
      <Icon className="h-5 w-5" />
    </div>
    <h3 className="text-lg font-semibold">{title}</h3>
    <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
  </div>
);

export default Landing;