import { Suspense } from "react";

import { LoginForm } from "@/components/auth/login-form";
import { BrandWordmark } from "@/components/ui/brand-logo";
import { LoadingState } from "@/components/ui/feedback";

export default function LoginPage() {
  return (
    <main className="bg-inverse flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <h1 className="sr-only">JOSEMA RB</h1>
          <BrandWordmark className="h-auto w-60" preload />
          <p className="mt-4 text-[0.65rem] font-medium tracking-[0.3em] text-slate-400 uppercase">
            Strength · Discipline · Results
          </p>
        </div>
        <div className="bg-surface rounded-xl p-6 shadow-xl">
          <Suspense fallback={<LoadingState />}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
