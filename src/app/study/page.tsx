import type { Metadata } from "next";
import { StudyList } from "./Console";

export const metadata: Metadata = { title: "Study console · SubText", robots: { index: false } };

export default function StudyPage() {
  return <StudyList />;
}
