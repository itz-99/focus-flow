import { Link, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Brain, Timer, Trophy, Shield, Sparkles, ArrowRight, Star, Flame } from "lucide-react";
import heroImg from "@/assets/landing-hero.jpg";
import focusImg from "@/assets/landing-feature-focus.jpg";
import rewardsImg from "@/assets/landing-feature-rewards.jpg";

const Landing = () => {
  const { user, loading } = useAuth();

  useEffect(() => {
    document.title = "FocusTrack — Beat phone distraction, earn rewards";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "FocusTrack helps students beat phone distraction with focus sessions, streak badges, and a parent-approved rewards system.");
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
          <Link to="/auth">
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-hero">
        <div className="container grid gap-10 py-16 md:grid-cols-2 md:items-center md:py-24">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-primary shadow-soft">
              <Sparkles className="h-3.5 w-3.5" /> Built for students
            </span>
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl lg:text-6xl">
              Beat phone distraction.<br />
              <span className="bg-gradient-primary bg-clip-text text-transparent">Earn real rewards.</span>
            </h1>
            <p className="max-w-lg text-lg text-muted-foreground">
              Run focus sessions, build streaks, and collect points your parents can turn into real rewards. Stay in flow — we handle the rest.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link to="/auth">
                <Button size="lg" className="bg-gradient-primary shadow-elevated">
                  Get started <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <a href="#features">
                <Button size="lg" variant="outline">See how it works</Button>
              </a>
            </div>
            <div className="flex items-center gap-6 pt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Shield className="h-4 w-4 text-primary" /> Anti-cheat timer</span>
              <span className="flex items-center gap-1.5"><Star className="h-4 w-4 text-primary" /> Points & rewards</span>
              <span className="flex items-center gap-1.5"><Flame className="h-4 w-4 text-primary" /> Streak badges</span>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-primary opacity-10 blur-2xl" />
            <img
              src={heroImg}
              alt="Student focused on studying with laptop and books"
              width={1536}
              height={1024}
              className="relative w-full rounded-3xl border border-border shadow-elevated"
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container py-20">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Everything you need to focus</h2>
          <p className="mt-3 text-muted-foreground">Three simple tools that actually change how you study.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <FeatureCard
            icon={Timer}
            title="Anti-cheat focus timer"
            desc="Pick 25, 45, or 60 min. Switch tabs and we'll know — fail too many times and the session ends."
            image={focusImg}
          />
          <FeatureCard
            icon={Star}
            title="Earn points, get rewards"
            desc="Every successful session = 10 points. Cash them out with a parent-approved PIN whenever you want."
            image={rewardsImg}
          />
          <FeatureCard
            icon={Trophy}
            title="Badges & leaderboards"
            desc="Bronze, silver, and gold streak badges. Compete with friends on the weekly leaderboard."
          />
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gradient-soft">
        <div className="container py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">How it works</h2>
          </div>
          <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-3">
            {[
              { n: "1", t: "Start a session", d: "Pick a duration and start. Stay on the tab — no peeking at your phone." },
              { n: "2", t: "Earn 10 points", d: "Finish strong and points land in your wallet automatically." },
              { n: "3", t: "Withdraw with parent PIN", d: "Trade points for real rewards. A 4-digit PIN keeps it honest." },
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

      {/* CTA */}
      <section className="container py-20">
        <div className="overflow-hidden rounded-3xl border border-border bg-gradient-primary p-10 text-center shadow-elevated md:p-16">
          <h2 className="text-3xl font-semibold tracking-tight text-primary-foreground md:text-4xl">
            Ready to focus?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-primary-foreground/90">
            Join FocusTrack and turn study time into rewards.
          </p>
          <Link to="/auth">
            <Button size="lg" variant="secondary" className="mt-6 shadow-soft">
              Get started — it's free <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="container flex flex-col items-center justify-between gap-2 py-6 text-sm text-muted-foreground md:flex-row">
          <p>© {new Date().getFullYear()} FocusTrack</p>
          <p>Less distraction. More flow.</p>
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