import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { MODULES } from "@/utils/modules";
import type { ModuleKey } from "@/utils/types";
import logoSrc from "@/assets/logo.png";

const CREDENTIALS: Record<ModuleKey, { email: string; password: string }> = {
  "strategic-objectives": { email: "strategic@gmail.com", password: "strategic254." },
  "performance-contracts": { email: "pc@gmail.com", password: "pc254." },
  projects: { email: "project@gmail.com", password: "project254." },
};

interface LoginFormProps {
  moduleKey: ModuleKey;
}

export function LoginForm({ moduleKey }: LoginFormProps) {
  const mod = MODULES[moduleKey];
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter both your email and password.");
      return;
    }

    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 500));

    const creds = CREDENTIALS[moduleKey];
    if (
      email.trim().toLowerCase() !== creds.email.toLowerCase() ||
      password !== creds.password
    ) {
      setError("Invalid email or password. Please check your credentials.");
      setSubmitting(false);
      return;
    }

    login({ email: email.trim(), moduleKey: mod.key });
    navigate(mod.dashboard);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col md:flex-row min-h-420px">
          <div className="flex flex-col items-center justify-center p-10 md:w-2/5 bg-white border-b md:border-b-0 md:border-r border-gray-100">
            <img src={logoSrc} alt="KALRO" className="h-24 w-24 object-contain mb-5" />
            <h2 className="text-lg font-bold text-slate-800 text-center">KALRO {mod.label}</h2>
            <p className="mt-2 text-sm text-slate-500 text-center leading-relaxed">{mod.description}</p>
          </div>

          <div className="flex flex-col justify-center p-8 md:p-10 md:w-3/5">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Welcome Back</h2>
              <p className="mt-1 text-sm text-slate-500">Sign in to continue to your dashboard</p>
            </div>

            {error && (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@gmail.com"
                  autoComplete="email"
                  className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/15"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 pr-10 text-sm outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded text-slate-400 hover:bg-slate-100"
                    aria-label={showPw ? "Hide password" : "Show password"}
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-800 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-900 active:bg-emerald-950 disabled:opacity-60"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                {submitting ? "Signing in…" : "Sign In"}
              </button>
            </form>

            <p className="mt-5 text-center text-xs text-slate-400">Protected system • Authorized users only</p>
            <div className="mt-4 flex justify-center">
              <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-700 transition">
                <ArrowLeft className="h-3 w-3" />
                Choose a different system
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
