import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Mail } from "lucide-react";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            toast.error("Please enter your email address");
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) throw error;

            setEmailSent(true);
            toast.success("Password reset email sent!");
        } catch (error: any) {
            toast.error(error.message || "Failed to send reset email");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8 bg-card p-8 rounded-xl shadow-sm border border-border">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-foreground">
                        Forgot your password?
                    </h2>
                    <p className="mt-2 text-center text-sm text-muted-foreground">
                        Enter your email address and we'll send you a link to reset your password.
                    </p>
                </div>

                {emailSent ? (
                    <div className="rounded-md bg-emerald-50 p-4 border border-emerald-200">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <Mail className="h-5 w-5 text-emerald-400" aria-hidden="true" />
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-emerald-800">Email sent</h3>
                                <div className="mt-2 text-sm text-emerald-700">
                                    <p>
                                        We've sent an email to <strong>{email}</strong> with a link to reset your password. Please check your inbox and spam folder.
                                    </p>
                                </div>
                                <div className="mt-4">
                                    <Button
                                        variant="outline"
                                        className="w-full sm:w-auto text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                                        onClick={() => setEmailSent(false)}
                                    >
                                        Try another email
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="email" className="sr-only">
                                    Email address
                                </Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    placeholder="Email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full"
                                />
                            </div>
                        </div>

                        <div>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? "Sending link..." : "Send reset link"}
                            </Button>
                        </div>
                    </form>
                )}

                <div className="text-center mt-6">
                    <Link
                        to="/login"
                        className="flex items-center justify-center text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to login
                    </Link>
                </div>
            </div>
        </div>
    );
}
