import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const {
    signIn,
    signUp,
    signInWithGoogle,
    user,
  } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;
        toast.success("Signed in successfully!");
        navigate("/");
      } else {
        const { error } = await signUp(email, password);
        if (error) throw error;
        toast.success("Account created successfully!");
        navigate("/");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) throw error;
      // Popup flow: session is set, navigate to dashboard.
      // (The user effect above also covers this.)
      setGoogleLoading(false);
      navigate("/", { replace: true });
    } catch (error: any) {
      toast.error(error.message || "An error occurred with Google sign in");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="font-display text-3xl md:text-4xl text-foreground tracking-tight">
            Invoice Generator
          </h1>
          <p className="text-muted-foreground mt-2 text-xs md:text-sm tracking-wider">
            Dark invoicing app for freelancers
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-card border border-border p-6 md:p-8">
          <h2 className="font-display text-xl md:text-2xl text-foreground mb-6 md:mb-8">
            {isLogin ? "SIGN IN" : "CREATE ACCOUNT"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] md:text-xs text-muted-foreground tracking-wide">
                EMAIL ADDRESS
              </Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-10 md:h-12 bg-background border-border text-foreground text-sm"
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] md:text-xs text-muted-foreground tracking-wide">
                PASSWORD
              </Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-10 md:h-12 bg-background border-border text-foreground text-sm"
                placeholder="••••••••"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 md:h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs md:text-sm tracking-wide"
            >
              {loading ? "LOADING..." : isLogin ? "SIGN IN" : "CREATE ACCOUNT"}
            </Button>
          </form>

          <div className="relative my-5 md:my-6">
            <Separator className="bg-border" />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-4 text-[10px] md:text-xs text-muted-foreground tracking-wide">
              OR
            </span>
          </div>

          <Button
            type="button"
            variant="outline"
            disabled={googleLoading}
            onClick={handleGoogleSignIn}
            className="w-full h-10 md:h-12 border-border bg-background hover:bg-accent text-foreground font-medium text-xs md:text-sm tracking-wide"
          >
            <svg className="mr-2 h-4 w-4 md:h-5 md:w-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {googleLoading ? "CONNECTING..." : isLogin ? "SIGN IN WITH GOOGLE" : "SIGN UP WITH GOOGLE"}
          </Button>

          <div className="mt-5 md:mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-muted-foreground hover:text-foreground transition-colors text-[10px] md:text-xs"
            >
              {isLogin ? "DON'T HAVE AN ACCOUNT? SIGN UP" : "ALREADY HAVE AN ACCOUNT? SIGN IN"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
