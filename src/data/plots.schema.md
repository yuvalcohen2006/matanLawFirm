# plots.json - data structure (English)

This file is the calculator's single source of truth: the settlement, tender-number, and plot dropdowns are all built from it - nothing is hard-coded in the UI. It was produced automatically from the RMI tender booklets (see `EXTRACTION_REPORT.md`). **Don't edit it by hand without checking against the booklets.**

> **No land cost is stored here, by design.** The land component varies between buyers - bid, discounts, allocation terms - so a figure taken from the booklet would be wrong for most people. The calculator uses **only the land cost the user types in**. If the user enters `0`, the case is routed to manual review rather than falling back to a stored number.

## Top level

```jsonc
{
  "purchaseTaxRate": 0.06,           // purchase-tax rate used in the internal calculation
  "overpaymentThresholdILS": 1500,   // gap (in ILS) above which a result is "possible overpayment"
  "settlements": [ ... ]             // one entry per tender
}
```

## Each settlement

| Field | Meaning |
|---|---|
| `id` | Fixed latin id used in code |
| `name` | Hebrew settlement name - shown in the dropdown |
| `tenderNumber` | Official tender number incl. regional prefix (e.g. `בש/297/2025`) |
| `neighborhood` | The neighborhood in the tender |
| `developmentCompletionRate` | **Weighted development-completion %** (0-1) - supplied by the client |
| `developmentCompletionRateSource` | Where that percentage came from (Arad's is not printed in the booklet) |
| `developmentCostsVatNote` | The VAT basis of the development figures, as printed |
| `devCostIndexBase` | The printed index-base date for the development costs |
| `sourceBooklet` | Booklet filename in `assets/` |
| `sourcePages` | Source pages in the booklet |
| `plots` | Array of plots |

## Each plot

| Field | Meaning |
|---|---|
| `plotNumber` | Plot number (string) - shown in the dropdown |
| `areaSqm` | Plot area in m² - shown back to the user so they can confirm they picked the right plot |
| `unitCount` | Housing units on the plot (2 = two-family). `null` = missing/contradictory |
| `isDuplex` | `true` when `unitCount >= 2`; `null` when the unit count is unknown |
| `developmentCostFullPlot` | Development cost for the **whole plot**, ILS, **including VAT**, as printed. The calculator divides it by `unitCount` |
| `sourcePages` | Booklet pages the development cost came from |
| `needsManualFill` | `true` = a value is missing/contradictory; the calculator routes this plot to manual review and does not compute |
| `notes` | Explanation of the issue, when present |

## The formula the calculator applies

```
adjustedDevelopment = developmentCostFullPlot / unitCount    // 2 units → half; 1 unit → the full figure
relevantDevelopment = adjustedDevelopment * developmentCompletionRate
taxableValue        = landCostEnteredByUser + relevantDevelopment
estimatedTax        = taxableValue * purchaseTaxRate         // 6%
gap                 = taxPaidByUser - estimatedTax
```

A gap above `overpaymentThresholdILS` (1,500 ₪) surfaces the "possible overpayment" result. **None of these numbers is ever rendered in the UI** - they travel only in the lead email.

The calculation is skipped entirely (→ manual review) when: a relief was used in the assessment, the land cost entered is `0`, the plot isn't in the list, or `needsManualFill` is set.

## Adding a future tender

Add a new settlement object to the `settlements` array with all of the fields above (or re-run the extraction script with the new booklet). The calculator's dropdowns update automatically - no code changes needed.
