import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageLayout } from "@/components/layouts/PageLayout";
import { useAuth } from "@/contexts/AuthContext";
import {
  useLoyaltyPoints,
  useLoyaltyTransactions,
  useInitializeLoyalty,
  TIER_THRESHOLDS,
  TIER_BENEFITS,
  getNextTier,
  getPointsToNextTier,
  pointsToDiscount,
} from "@/hooks/useLoyalty";
import { Progress } from "@/components/ui/progress";
import { Award, Gift, Star, TrendingUp, ArrowUp, ArrowDown, Sparkles } from "lucide-react";
import { format } from "date-fns";

const tierColors = {
  bronze: "from-amber-600 to-amber-800",
  silver: "from-gray-400 to-gray-600",
  gold: "from-yellow-400 to-yellow-600",
  platinum: "from-purple-400 to-purple-600",
};

const tierIcons = {
  bronze: "🥉",
  silver: "🥈",
  gold: "🥇",
  platinum: "💎",
};

export default function Loyalty() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { data: loyaltyPoints, isLoading } = useLoyaltyPoints();
  const { data: transactions = [] } = useLoyaltyTransactions();
  const initLoyalty = useInitializeLoyalty();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && !loyaltyPoints && !isLoading) {
      initLoyalty.mutate();
    }
  }, [user, loyaltyPoints, isLoading]);

  if (authLoading || isLoading) {
    return (
      <PageLayout>
        <div className="container mx-auto px-6 py-16 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </PageLayout>
    );
  }

  const points = loyaltyPoints?.points || 0;
  const lifetimePoints = loyaltyPoints?.lifetime_points || 0;
  const tier = loyaltyPoints?.tier || "bronze";
  const nextTier = getNextTier(tier);
  const pointsToNext = getPointsToNextTier(lifetimePoints, tier);
  const benefits = TIER_BENEFITS[tier];
  const discountValue = pointsToDiscount(points);

  const progressToNextTier = nextTier
    ? ((lifetimePoints - TIER_THRESHOLDS[tier]) / (TIER_THRESHOLDS[nextTier] - TIER_THRESHOLDS[tier])) * 100
    : 100;

  return (
    <PageLayout>
      <div className="container mx-auto px-6 py-16">
        <div className="mb-8">
          <h1 className="font-display text-4xl font-medium">Loyalty Rewards</h1>
          <p className="mt-2 text-muted-foreground">Earn points on every purchase and unlock exclusive benefits</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Points Card */}
          <div className="lg:col-span-2">
            <div className={`rounded-2xl bg-gradient-to-br ${tierColors[tier]} p-8 text-white`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80">Available Points</p>
                  <p className="font-display text-5xl font-bold">{points.toLocaleString()}</p>
                  <p className="mt-1 text-sm opacity-80">
                    Worth ₹{discountValue.toFixed(2)} in discounts
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-6xl">{tierIcons[tier]}</div>
                  <p className="mt-2 font-display text-xl font-medium capitalize">{tier} Member</p>
                </div>
              </div>

              {nextTier && (
                <div className="mt-8">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="opacity-80">Progress to {nextTier}</span>
                    <span>{pointsToNext.toLocaleString()} points to go</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/20">
                    <div
                      className="h-full rounded-full bg-white"
                      style={{ width: `${Math.min(progressToNextTier, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Benefits */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-border bg-card p-6">
                <TrendingUp className="h-8 w-8 text-primary" />
                <h3 className="mt-4 font-display text-lg font-medium">Points Multiplier</h3>
                <p className="mt-1 text-3xl font-bold">{benefits.pointsMultiplier}x</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Earn {benefits.pointsMultiplier} points per ₹1 spent
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-6">
                <Gift className="h-8 w-8 text-primary" />
                <h3 className="mt-4 font-display text-lg font-medium">Member Discount</h3>
                <p className="mt-1 text-3xl font-bold">{benefits.discount}%</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Off all purchases as a {tier} member
                </p>
              </div>
            </div>

            {/* Transaction History */}
            <div className="mt-8">
              <h2 className="font-display text-xl font-medium mb-4">Points History</h2>
              {transactions.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-8 text-center">
                  <Star className="mx-auto h-10 w-10 text-muted-foreground" />
                  <p className="mt-4 text-muted-foreground">No transactions yet</p>
                  <p className="text-sm text-muted-foreground">Start shopping to earn points!</p>
                </div>
              ) : (
                <div className="rounded-lg border border-border divide-y divide-border">
                  {transactions.slice(0, 10).map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4">
                        <div className={`rounded-full p-2 ${tx.points > 0 ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                          {tx.points > 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="font-medium capitalize">{tx.type.replace("_", " ")}</p>
                          <p className="text-sm text-muted-foreground">{tx.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${tx.points > 0 ? "text-green-600" : "text-red-600"}`}>
                          {tx.points > 0 ? "+" : ""}{tx.points}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(tx.created_at), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tier Info Sidebar */}
          <div className="space-y-6">
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="font-display text-lg font-medium mb-4">Membership Tiers</h3>
              <div className="space-y-4">
                {(["bronze", "silver", "gold", "platinum"] as const).map((t) => (
                  <div
                    key={t}
                    className={`flex items-center gap-3 rounded-lg p-3 ${
                      t === tier ? "bg-primary/10 border border-primary" : "bg-muted/50"
                    }`}
                  >
                    <span className="text-2xl">{tierIcons[t]}</span>
                    <div className="flex-1">
                      <p className="font-medium capitalize">{t}</p>
                      <p className="text-xs text-muted-foreground">
                        {TIER_THRESHOLDS[t].toLocaleString()}+ points
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <p>{TIER_BENEFITS[t].pointsMultiplier}x</p>
                      <p className="text-muted-foreground">{TIER_BENEFITS[t].discount}% off</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="font-display text-lg font-medium">How to Earn</h3>
              </div>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center justify-between">
                  <span>Make a purchase</span>
                  <span className="font-medium">1 pt/₹1</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Write a review</span>
                  <span className="font-medium">50 pts</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Refer a friend</span>
                  <span className="font-medium">200 pts</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Birthday bonus</span>
                  <span className="font-medium">100 pts</span>
                </li>
              </ul>
            </div>

            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Award className="h-5 w-5 text-primary" />
                <h3 className="font-display text-lg font-medium">Redeem Points</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Use your points at checkout for instant discounts. 100 points = ₹1 off.
              </p>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Your points are worth</p>
                <p className="font-display text-2xl font-bold">₹{discountValue.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
