"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { colors } from "@/constant/themes";
import { ChefHat, Mail, Lock } from "lucide-react";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading) return;

    setError("");
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError("Invalid email or password. Please try again.");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError("System error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: colors.bg }}
    >
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl neu-card mb-5"
          >
            <ChefHat className="w-8 h-8" style={{ color: colors.olive }} />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: colors.textDark }}>
            Welcome Back
          </h1>
          <p className="text-sm mt-1" style={{ color: colors.muted }}>
            Sign in to manage your menu
          </p>
        </div>

        {/* Login Card */}
        <div className="p-8 rounded-2xl neu-card">
          {error && (
            <div
              className="mb-6 p-4 rounded-xl flex items-start gap-3"
              style={{ background: "#FEF2F2" }}
            >
              <span className="text-rose-500 text-lg">⚠️</span>
              <div>
                <p className="text-sm font-semibold text-rose-700">
                  Authentication Failed
                </p>
                <p className="text-sm text-rose-600">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: colors.textDark }}
              >
                Email Address
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: colors.muted }}
                />
                <input
                  type="email"
                  required
                  value={email}
                  disabled={loading}
                  onChange={(e) => setEmail(e.target.value)}
                  className="neu-input w-full pl-10 pr-4 py-3 rounded-xl text-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ color: colors.textDark }}
                  placeholder="admin@restaurant.com"
                />
              </div>
            </div>

            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: colors.textDark }}
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: colors.muted }}
                />
                <input
                  type="password"
                  required
                  value={password}
                  disabled={loading}
                  onChange={(e) => setPassword(e.target.value)}
                  className="neu-input w-full pl-10 pr-4 py-3 rounded-xl text-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ color: colors.textDark }}
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-base transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
              style={{
                background: `linear-gradient(135deg, ${colors.sage}, ${colors.olive})`,
                color: "white",
                boxShadow: `0 4px 16px ${colors.olive}40`,
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>

            <div className="text-center pt-1">
              <p className="text-xs" style={{ color: colors.muted }}>
                Secure admin access only
              </p>
            </div>
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: colors.muted }}>
          © 2024 Restaurant Admin Panel. All rights reserved.
        </p>
      </div>
    </div>
  );
}
