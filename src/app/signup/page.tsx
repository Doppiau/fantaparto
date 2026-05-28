"use client";

import { useActionState } from "react";
import { signupAction, type AuthActionState } from "@/app/auth/actions";
import Link from "next/link";

const initialState: AuthActionState = {};

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signupAction, initialState);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-md p-8">
        <h1 className="text-2xl font-bold text-center mb-1">FantaParto</h1>
        <p className="text-sm text-gray-500 text-center mb-6">Crea il tuo account mamma</p>

        <form action={formAction} className="space-y-4">
          <div>
            <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
              Il tuo nome
            </label>
            <input
              id="nome"
              name="nome"
              type="text"
              required
              autoComplete="given-name"
              placeholder="es. Giulia"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
              placeholder="Minimo 8 caratteri"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
          </div>

          {state.error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full bg-pink-500 hover:bg-pink-600 disabled:opacity-60 text-white font-semibold rounded-lg py-2 text-sm transition-colors"
          >
            {pending ? "Registrazione in corso…" : "Crea account"}
          </button>
        </form>

        <p className="text-sm text-center text-gray-500 mt-6">
          Hai già un account?{" "}
          <Link href="/login" className="text-pink-600 font-medium hover:underline">
            Accedi
          </Link>
        </p>
      </div>
    </main>
  );
}
