export interface Trainer {
  id: string;
  email: string;
  full_name: string | null;
}

export interface LoginInput {
  email: string;
  password: string;
}
