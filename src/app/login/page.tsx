"use client";

import { useFormState, useFormStatus } from "react-dom";
import { loginAction, type AuthActionState } from "@/app/auth/actions";
import Link from "next/link";

const initialState: AuthActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-3 rounded-xl font-bold text-white text-sm tracking-wide transition-all duration-200 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 hover:shadow-lg hover:shadow-pink-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
    >
      {pending ? "Accesso in corso…" : "Accedi →"}
    </button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useFormState(loginAction, initialState);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-rose-50 to-fuchsia-50 px-4">
      {/* Decorazioni sfondo */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-pink-200 opacity-30 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-fuchsia-200 opacity-30 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 shadow-lg shadow-pink-300 mb-4">
            <span className="text-3xl">🍼</span>
          </div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tight">FantaParto</h1>
          <p className="text-gray-500 text-sm mt-1">Il gioco social della gravidanza</p>
        </div>

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl shadow-pink-100 border border-white p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Bentornata 👋</h2>

          <form action={formAction} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="la-tua@email.com"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all"
              />
            </div>

            {state.error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                <span className="text-red-400 mt-0.5">⚠</span>
                <p className="text-sm text-red-600">{state.error}</p>
              </div>
            )}

            <div className="pt-2">
              <SubmitButton />
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Prima volta qui?{" "}
              <Link href="/signup" className="font-bold text-pink-600 hover:text-pink-700 transition-colors">
                Crea il tuo account
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          © 2026 FantaParto · Il gioco delle mamme 🤰
        </p>
      </div>
    </main>
  );
}
