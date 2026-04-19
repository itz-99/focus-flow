
CREATE TYPE public.session_status AS ENUM ('active', 'success', 'failed');
CREATE TYPE public.distraction_reason AS ENUM ('social_media', 'gaming', 'chatting', 'other');
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles readable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes IN (25, 45, 60)),
  status public.session_status NOT NULL DEFAULT 'active',
  tab_switches INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sessions_user_start ON public.sessions(user_id, start_time DESC);
CREATE INDEX idx_sessions_status ON public.sessions(status);
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own sessions" ON public.sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own sessions" ON public.sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own sessions" ON public.sessions FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.distractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason public.distraction_reason NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_distractions_user ON public.distractions(user_id, created_at DESC);
ALTER TABLE public.distractions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own distractions" ON public.distractions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own distractions" ON public.distractions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_minutes INTEGER NOT NULL DEFAULT 60 CHECK (daily_minutes BETWEEN 5 AND 600),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own goal" ON public.goals FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own goal" ON public.goals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own goal" ON public.goals FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_goals_updated BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE uname TEXT;
BEGIN
  uname := COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1));
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = uname) LOOP
    uname := uname || floor(random()*1000)::TEXT;
  END LOOP;
  INSERT INTO public.profiles (id, username) VALUES (NEW.id, uname);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  INSERT INTO public.goals (user_id, daily_minutes) VALUES (NEW.id, 60);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.get_leaderboard()
RETURNS TABLE(username TEXT, weekly_minutes INTEGER, current_streak INTEGER)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH weekly AS (
    SELECT s.user_id, COALESCE(SUM(EXTRACT(EPOCH FROM (s.end_time - s.start_time))/60), 0)::INTEGER AS minutes
    FROM public.sessions s
    WHERE s.status = 'success' AND s.start_time >= date_trunc('week', now())
    GROUP BY s.user_id
  ),
  success_days AS (
    SELECT s.user_id, DATE(s.start_time) AS day
    FROM public.sessions s
    WHERE s.status = 'success'
    GROUP BY s.user_id, DATE(s.start_time)
  ),
  streaks AS (
    SELECT user_id, COUNT(*)::INTEGER AS streak
    FROM (
      SELECT user_id, day, day - (ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY day))::INTEGER AS grp
      FROM success_days
    ) t
    WHERE day >= CURRENT_DATE - INTERVAL '60 days'
    GROUP BY user_id, grp
    HAVING MAX(day) = CURRENT_DATE OR MAX(day) = CURRENT_DATE - 1
  )
  SELECT p.username, COALESCE(w.minutes, 0)::INTEGER, COALESCE(MAX(st.streak), 0)::INTEGER
  FROM public.profiles p
  LEFT JOIN weekly w ON w.user_id = p.id
  LEFT JOIN streaks st ON st.user_id = p.id
  GROUP BY p.username, w.minutes
  ORDER BY COALESCE(w.minutes, 0) DESC, MAX(st.streak) DESC NULLS LAST
  LIMIT 20;
END;
$$;
