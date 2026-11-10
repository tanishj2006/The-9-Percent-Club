/**
 * SEBI's own publications behind Chapter 07, each checked against the PDF on
 * sebi.gov.in in November 2026. Figures are for individual traders in equity
 * derivatives (F&O) only.
 */
export const SEBI_STUDIES = {
  /** PR 22/2024, 23 September 2024, and the full study: FY22 to FY24. */
  sep2024: {
    pressRelease: "https://www.sebi.gov.in/sebi_data/attachdocs/sep-2024/1727086965496.pdf",
    study: "https://www.sebi.gov.in/sebi_data/attachdocs/sep-2024/1727085659479.pdf",
    lostPct: "93",
    keptTradingPct: "75",
    profitPct: "7.2",
  },
  /** PR 39/2025, 7 July 2025, and the full study: FY25. */
  jul2025: {
    pressRelease: "https://www.sebi.gov.in/sebi_data/attachdocs/jul-2025/1751900802566.pdf",
    study: "https://www.sebi.gov.in/sebi_data/attachdocs/jul-2025/1751900271726.pdf",
  },
  /** "Profitability of Individual Traders in the Equity Derivatives Segment (FY25–FY26)", August 2026. */
  aug2026: {
    study: "https://www.sebi.gov.in/sebi_data/attachdocs/aug-2026/1787233506209.pdf",
  },
} as const;
