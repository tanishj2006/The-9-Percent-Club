import { BrandMark } from "./BrandMark";
import { ChapterMenu } from "./ChapterMenu";
import { LanguageMenu } from "./LanguageMenu";
import { MoneyHud } from "./MoneyHud";
import { ThemeToggle } from "./ThemeToggle";

/**
 * Three zones on wide screens: brand, the chapter menu, then the utilities and
 * the HUD. On a phone the HUD keeps its full three lines, so the left side
 * stacks into two rows beside it instead of squeezing.
 */
export function SiteHeader() {
  return (
    <header className="site-header" data-testid="site-header">
      <div className="header-brand">
        <BrandMark />
      </div>
      <div className="header-chapters">
        <ChapterMenu />
      </div>
      <div className="header-utilities">
        <LanguageMenu />
        <ThemeToggle />
      </div>
      <div className="header-hud">
        <MoneyHud />
      </div>
    </header>
  );
}
