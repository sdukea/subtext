import type { Metadata } from "next";
import { StudySession } from "../Console";

export const metadata: Metadata = { title: "Study session · SubText", robots: { index: false } };

export default async function StudySessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StudySession id={id} />;
}
