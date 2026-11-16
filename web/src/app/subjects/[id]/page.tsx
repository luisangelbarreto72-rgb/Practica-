import { Suspense } from "react";
import { notFound } from "next/navigation";
import { SubjectDetailClient } from "@/components/subjects/SubjectDetailClient";
import { mockSubjects } from "@/lib/mock-data";

export function generateStaticParams() {
  return mockSubjects.map((s) => ({ id: s.id }));
}

async function SubjectContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!mockSubjects.some((s) => s.id === id)) notFound();
  return <SubjectDetailClient subjectId={id} />;
}

export default function SubjectPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-muted/30" />}>
      <SubjectContent params={params} />
    </Suspense>
  );
}
