import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./LoginForm";
import { withBase } from "@/lib/base-path";

export const metadata: Metadata = {
  title: "Sign in · SmoothSchool",
};

export default function LoginPage() {
  return (
    <div className="login-screen">
      <div className="login-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={withBase("/brand-mark.png")} alt="" width={40} height={40} className="login-mark" />
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
