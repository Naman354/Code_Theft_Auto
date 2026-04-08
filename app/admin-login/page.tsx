"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AccessForm } from "@/components/AccessForm";
import { loginAdmin } from "@/services/arena-api";

export default function AdminLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdminLogin(_: string, secret: string) {
    setLoading(true);
    setError(null);

    try {
      await loginAdmin(secret);
      router.push("/admin");
    } catch (adminError) {
      setError(adminError instanceof Error ? adminError.message : "Admin authorization failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="absolute inset-0">
        <Image
          src="/assets/images/background.png"
          alt="Admin login background"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-20"
        />
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(236,72,153,0.12),transparent_30%),radial-gradient(circle_at_70%_20%,rgba(34,211,238,0.12),transparent_22%),linear-gradient(180deg,rgba(0,0,0,0.35),rgba(0,0,0,0.94))]" />

      <main className="relative z-10 mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full rounded-[2rem] border border-amber-400/20 bg-black/60 p-4 shadow-[0_0_60px_rgba(251,191,36,0.08)] backdrop-blur-xl sm:p-8">
          <div className="mb-6 text-center">
            <p className="font-[family-name:var(--font-accent)] text-xs uppercase tracking-[0.45em] text-amber-300/70">
              Private Control Entry
            </p>
            <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl uppercase tracking-[0.12em] text-white sm:text-5xl">
              Admin Console
            </h1>
            <p className="mt-3 text-sm uppercase tracking-[0.22em] text-zinc-400">
              Public team access has been separated from organizer controls.
            </p>
          </div>

          <AccessForm
            onSubmit={handleAdminLogin}
            loading={loading}
            error={error}
            eyebrow="Command Access"
            title="ENTER ADMIN CONSOLE"
            primaryLabel="Operator Name"
            secondaryLabel="Admin Secret"
            submitLabel="UNLOCK ADMIN"
            statusLabel="AUTHORIZING ADMIN..."
            primaryPlaceholder="arena-control"
            secondaryPlaceholder="ADMIN_API_SECRET"
          />
        </div>
      </main>
    </div>
  );
}
