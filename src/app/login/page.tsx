import type { Metadata } from "next";
import { AuthForm } from "@/features/auth/components/auth-form";
import { AuthPageLayout } from "@/features/auth/components/auth-page-layout";

export const metadata: Metadata = {
  title: "Sign in | Broke Together",
  description: "Sign in to your Broke Together account.",
};

export default function LoginPage() {
  return (
    <AuthPageLayout
      heading="Sign in"
      subheading="Use the email and password connected to your account."
    >
      <AuthForm mode="login" />
    </AuthPageLayout>
  );
}
