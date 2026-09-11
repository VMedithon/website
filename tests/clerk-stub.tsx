import type { ReactNode } from 'react';

const auth = { isLoaded: true, isSignedIn: true, getToken: async () => 'browser-fixture-token' };
export function useAuth() {
  return auth;
}
export function ClerkProvider({ children }: { children: ReactNode }) {
  return children;
}
export function UserButton() {
  return (
    <button type="button" aria-label="Account menu">
      Account
    </button>
  );
}
export function SignIn() {
  return <div>Sign in</div>;
}
export function SignUp() {
  return <div>Sign up</div>;
}
