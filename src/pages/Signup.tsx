import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { PageLayout } from "@/components/layouts/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { z } from "zod";

const signupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export default function Signup() {
  const navigate = useNavigate();
  const { signUp, user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validation = signupSchema.safeParse({ name, email, password });
    if (!validation.success) {
      const fieldErrors: { name?: string; email?: string; password?: string } = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0] === "name") fieldErrors.name = err.message;
        if (err.path[0] === "email") fieldErrors.email = err.message;
        if (err.path[0] === "password") fieldErrors.password = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    const { error } = await signUp(email, password, name);

    setIsLoading(false);

    if (error) {
      if (error.message.includes("already registered")) {
        toast.error("Email already registered", {
          description: "Please use a different email or sign in.",
        });
      } else {
        toast.error("Signup failed", {
          description: error.message,
        });
      }
      return;
    }

    toast.success("Account created!", {
      description: "Welcome to the Twinning Club.",
    });
    navigate("/");
  };

  return (
    <PageLayout showNewsletter={false}>
      <div className="container mx-auto px-6 py-16 md:py-24">
        <div className="mx-auto max-w-md">
          <div className="mb-10 text-center">
            <h1 className="mb-3 font-display text-4xl font-medium">Join the Club</h1>
            <p className="font-body text-muted-foreground">
              Create an account to start your twinning journey
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="mb-2 block font-body text-sm font-medium">Full Name</label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className={`h-12 ${errors.name ? "border-destructive" : ""}`}
                required
              />
              {errors.name && (
                <p className="mt-1 text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block font-body text-sm font-medium">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className={`h-12 ${errors.email ? "border-destructive" : ""}`}
                required
              />
              {errors.email && (
                <p className="mt-1 text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block font-body text-sm font-medium">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`h-12 pr-12 ${errors.password ? "border-destructive" : ""}`}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-destructive">{errors.password}</p>
              )}
              <p className="mt-1 font-body text-xs text-muted-foreground">
                Must be at least 8 characters
              </p>
            </div>

            <label className="flex items-start gap-2 font-body text-sm">
              <input type="checkbox" className="mt-1 h-4 w-4 accent-foreground" required />
              <span className="text-muted-foreground">
                I agree to the{" "}
                <Link to="/terms" className="text-foreground underline">Terms of Service</Link>{" "}
                and{" "}
                <Link to="/privacy" className="text-foreground underline">Privacy Policy</Link>
              </span>
            </label>

            <Button type="submit" variant="hero" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Create Account"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <p className="mt-8 text-center font-body text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-foreground underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </PageLayout>
  );
}
