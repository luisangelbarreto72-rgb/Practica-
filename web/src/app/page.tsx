import { Suspense } from "react";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

export default function Home() {
  // Suspense: el dashboard usa la fecha actual (días restantes), así que se renderiza
  // en cada visita en vez de congelarse en el prerender de `next build`.
  return (
    <Suspense fallback={<div className="min-h-screen bg-muted/30" />}>
      <DashboardClient />
    </Suspense>
  );
}
