import { Suspense } from "react";

import { LoginForm } from "@/components/auth/login-form";
import { LoadingState } from "@/components/ui/feedback";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            JOSEMA <span className="text-amber-500">RB</span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Planes de entrenamiento y dieta
          </p>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-xl">
          <Suspense fallback={<LoadingState />}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
