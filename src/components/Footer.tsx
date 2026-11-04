import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("site");

  return (
    <footer className="gutter border-t border-rule">
      <div className="mx-auto max-w-[62rem] py-8 text-sm text-ink-soft">
        <p className="m-0">
          <span className="font-display text-lg text-ink">{t("name")}</span>{" "}
          <span>{t("tagline")}</span>
        </p>
        <p className="m-0 mt-1">{t("disclaimer")}</p>
      </div>
    </footer>
  );
}
