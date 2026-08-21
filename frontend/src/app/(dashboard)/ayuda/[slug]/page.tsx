import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { HelpArticleView } from "@/components/help/help-article-view";
import { HELP_GUIDES, findGuide } from "@/lib/help/guides";

/** The manual is fixed, so every guide is built once instead of on demand. */
export function generateStaticParams() {
  return HELP_GUIDES.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = findGuide(slug);

  return {
    title: guide ? `${guide.title} · Guía · JOSEMA RB` : "Guía · JOSEMA RB",
  };
}

export default async function HelpGuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = findGuide(slug);

  if (!guide) {
    notFound();
  }

  return <HelpArticleView guide={guide} />;
}
