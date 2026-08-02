import { api } from "./http";
import type { LoginInput, Trainer } from "@/types/auth";

export function login(input: LoginInput): Promise<Trainer> {
  return api.post<Trainer>("/auth/login", input);
}

export function logout(): Promise<void> {
  return api.post<void>("/auth/logout");
}

export function getCurrentTrainer(): Promise<Trainer> {
  return api.get<Trainer>("/auth/me");
}
