"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import { z } from "zod";

import { useLogin } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { ErrorMessage } from "@/components/ui/feedback";
import { Input } from "@/components/ui/input";

const loginSchema = z.object({
  email: z.string().min(1, "Introduce tu email"),
  password: z.string().min(1, "Introduce tu contraseña"),
});

type LoginValues = z.infer<typeof loginSchema>;

/** Only internal paths are accepted as a post-login destination (open redirect guard). */
function safeRedirect(next: string | null): string {
  return next && next.startsWith("/") && !next.startsWith("//")
    ? next
    : "/dashboard";
}

export function LoginForm() {
  const searchParams = useSearchParams();
  const login = useLogin(safeRedirect(searchParams.get("next")));

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={handleSubmit((values) => login.mutate(values))}
      noValidate
    >
      <Field label="Email" error={errors.email?.message}>
        {(props) => (
          <Input
            {...props}
            {...register("email")}
            type="email"
            autoComplete="username"
            autoFocus
          />
        )}
      </Field>

      <Field label="Contraseña" error={errors.password?.message}>
        {(props) => (
          <Input
            {...props}
            {...register("password")}
            type="password"
            autoComplete="current-password"
          />
        )}
      </Field>

      <ErrorMessage error={login.error} />

      <Button type="submit" loading={login.isPending} className="mt-2 w-full">
        Entrar
      </Button>
    </form>
  );
}
