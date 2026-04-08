import type { ReactNode } from "react";
import Image from "next/image";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { hasAdminAccessFromCookies } from "@/lib/admin-access";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const allowed = await hasAdminAccessFromCookies();

  if (!allowed) {
    redirect("/admin-login");
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="absolute inset-0">
        <Image
          src="/assets/images/background.png"
          alt="Admin background"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-20"
        />
      </div>
      <div className="absolute inset-0 bg-[url('/assets/grid.svg')] opacity-30" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(34,211,238,0.2),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(217,70,239,0.16),transparent_24%),linear-gradient(180deg,rgba(1,2,9,0.72),rgba(0,0,0,0.94))]" />

      <div className="relative z-10 mx-auto grid min-h-screen max-w-7xl gap-5 p-4 lg:grid-cols-[280px_minmax(0,1fr)] lg:p-6">
        <AdminSidebar />
        <main>{children}</main>
      </div>
    </div>
  );
}
