import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "SmoothSchool",
};

export default function LoginPage() {
  return (
    <div className="login-screen">
      <div className="login-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand-mark.png" alt="" width={40} height={40} className="login-mark" />
        <h1>SmoothSchool</h1>
        <p className="login-sub">Enter the password to get in.</p>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
