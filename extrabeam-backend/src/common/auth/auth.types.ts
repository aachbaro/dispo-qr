export interface AuthUser {
  id: string;
  email: string | null;
  role: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  slug?: string | null;
}
