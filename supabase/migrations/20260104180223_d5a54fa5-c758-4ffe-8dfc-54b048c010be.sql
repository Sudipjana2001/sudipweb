-- Push notification subscriptions
CREATE TABLE public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own subscriptions"
ON public.push_subscriptions FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Delivery SLA tracking
CREATE TABLE public.delivery_sla (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  promised_delivery_date TIMESTAMPTZ NOT NULL,
  actual_delivery_date TIMESTAMPTZ,
  sla_met BOOLEAN,
  delay_hours NUMERIC,
  delay_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.delivery_sla ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage SLA data"
ON public.delivery_sla FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own SLA data"
ON public.delivery_sla FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = delivery_sla.order_id 
    AND orders.user_id = auth.uid()
  )
);

-- Influencer profiles for gallery
CREATE TABLE public.influencer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  handle TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  bio TEXT,
  instagram_url TEXT,
  tiktok_url TEXT,
  youtube_url TEXT,
  follower_count INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.influencer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active influencers"
ON public.influencer_profiles FOR SELECT
USING (is_active = true);

CREATE POLICY "Users can manage their own influencer profile"
ON public.influencer_profiles FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all influencer profiles"
ON public.influencer_profiles FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Campaign tracking
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  campaign_type TEXT NOT NULL, -- 'email', 'push', 'social', 'influencer'
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'active', 'paused', 'completed'
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  budget NUMERIC,
  target_audience JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage campaigns"
ON public.campaigns FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Campaign performance metrics
CREATE TABLE public.campaign_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  metric_date DATE NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue NUMERIC DEFAULT 0,
  cost NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, metric_date)
);

ALTER TABLE public.campaign_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage campaign metrics"
ON public.campaign_metrics FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Rate limiting table
CREATE TABLE public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL, -- IP address or user ID
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(identifier, endpoint, window_start)
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can manage rate limits"
ON public.rate_limits FOR ALL
USING (true)
WITH CHECK (true);

-- Image moderation logs
CREATE TABLE public.image_moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_post_id UUID REFERENCES public.pet_gallery(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  moderation_result JSONB,
  is_approved BOOLEAN,
  rejection_reason TEXT,
  moderated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.image_moderation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view moderation logs"
ON public.image_moderation_logs FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Add influencer_id to pet_gallery for tagging
ALTER TABLE public.pet_gallery ADD COLUMN IF NOT EXISTS influencer_id UUID REFERENCES public.influencer_profiles(id);

-- Triggers for updated_at
CREATE TRIGGER update_delivery_sla_updated_at
BEFORE UPDATE ON public.delivery_sla
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_influencer_profiles_updated_at
BEFORE UPDATE ON public.influencer_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at
BEFORE UPDATE ON public.campaigns
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();