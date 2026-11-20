import { Suspense } from "react";
import { SubjectDetailClient } from "@/components/subjects/SubjectDetailClient";

async function SubjectContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SubjectDetailClient subjectId={id} />;
}

export default function SubjectPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-muted/30" />}>
      <SubjectContent params={params} />
    </Suspense>
  );
}
