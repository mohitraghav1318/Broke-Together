import type { Metadata } from "next";
import { AuthForm } from "@/features/auth/components/auth-form";
import { AuthPageLayout } from "@/features/auth/components/auth-page-layout";

export const metadata: Metadata = {
  title: "Create account | Broke Together",
  description: "Create a Broke Together account.",
};

export default function SignupPage() {
  return (
    <AuthPageLayout
      heading="Create account"
      subheading="Start with your name, email, and a secure password."
    >
      <AuthForm mode="signup" />
    </AuthPageLayout>
  );
}
