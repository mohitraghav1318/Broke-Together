import { AppNavbar } from "@/components/navigation/app-navbar";
import { HomePageContent } from "@/features/marketing/components/home-page-content";
import { SiteFooter } from "@/features/marketing/components/site-footer";

export default function Home() {
  return (
    <>
      <AppNavbar />
      <HomePageContent />
      <SiteFooter />
    </>
  );
}
