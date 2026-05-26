import type { Metadata } from "next";
import { AppNavbar } from "@/components/navigation/app-navbar";
import { AccountSettingsPanel } from "@/features/account/components/account-settings-panel";

export const metadata: Metadata = {
  title: "Account | Broke Together",
  description: "Update or delete your Broke Together account.",
};

type AccountPageProps = {
  params: Promise<{
    userId: string;
  }>;
};

export default async function AccountPage({ params }: AccountPageProps) {
  const { userId } = await params;

  return (
    <>
      <AppNavbar />
      <main className="min-h-[calc(100vh-4rem)] bg-stone-50 px-4 py-10 text-zinc-950 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-6xl">
          <AccountSettingsPanel userId={userId} />
        </div>
      </main>
    </>
  );
}
