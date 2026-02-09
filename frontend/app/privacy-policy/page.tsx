"use client";

import { useState } from "react";

import PrivacyPolicyViewer from "@/components/PrivacyPolicyViewer";
import { privacyContent } from "@/data/privacyContent";

export default function PrivacyPage() {
  const [lang, setLang] = useState<"ja" | "en">("ja");

  return (
    <PrivacyPolicyViewer
      content={privacyContent[lang]}
      lang={lang}
      onLanguageChange={(newLang) => setLang(newLang)}
    />
  );
}
