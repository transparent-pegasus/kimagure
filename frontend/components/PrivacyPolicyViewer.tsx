"use client";

import type { PrivacyContent } from "@/data/privacyContent";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Card } from "@/components/ui/card";

export default function PrivacyPolicyViewer({
  content,
  lang,
  onLanguageChange,
}: {
  content: PrivacyContent;
  lang: string;
  onLanguageChange: (lang: "ja" | "en") => void;
}) {
  const sections = [
    { body: content.collection_body, title: content.collection_title },
    { body: content.analytics_body, title: content.analytics_title },
    { body: content.usage_body, title: content.usage_title },
    { body: content.third_party_body, title: content.third_party_title },
    { body: content.contact_body, title: content.contact_title },
  ];

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col items-center p-4 md:p-8 font-rounded translate-z-0">
      <div className="w-full max-w-3xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-bold">{content.backToHome}</span>
          </Link>

          <div className="flex items-center gap-4">
            <div className="flex gap-2 text-sm font-bold">
              <button
                onClick={() => onLanguageChange("en")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  lang === "en"
                    ? "bg-[#414141] text-white shadow-sm"
                    : "text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 bg-white/50 dark:bg-black/20"
                }`}
              >
                English
              </button>
              <button
                onClick={() => onLanguageChange("ja")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  lang === "ja"
                    ? "bg-[#414141] text-white shadow-sm"
                    : "text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 bg-white/50 dark:bg-black/20"
                }`}
              >
                日本語
              </button>
            </div>
          </div>
        </div>

        <Card className="shadow-xl border-2 border-stone-200 dark:border-stone-800 rounded-3xl overflow-hidden bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm">
          <div className="p-8 md:p-12 max-w-none">
            <h1 className="text-3xl font-black mb-2 text-stone-900 dark:text-stone-100">
              {content.title}
            </h1>
            <p className="text-xs font-bold text-stone-400 dark:text-stone-500 mb-8 border-b-2 border-stone-100 dark:border-stone-800 pb-4">
              {content.lastUpdated}
            </p>

            <p className="mb-10 leading-relaxed font-bold text-stone-700 dark:text-stone-300 whitespace-pre-wrap">
              {content.introduction}
            </p>

            <div className="space-y-12">
              {sections.map((section) => (
                <section key={section.title} className="group">
                  <h2 className="text-xl font-black mb-4 text-stone-800 dark:text-stone-200 flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-amber-400 rounded-full group-hover:scale-y-110 transition-transform" />
                    {section.title}
                  </h2>
                  <p className="text-stone-600 dark:text-stone-400 leading-relaxed font-bold whitespace-pre-wrap pl-3.5">
                    {section.body}
                  </p>
                </section>
              ))}
            </div>
          </div>
        </Card>

        <footer className="mt-8 text-center text-[10px] font-bold text-stone-400">
          &copy; 2026 きまぐれごはん. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
