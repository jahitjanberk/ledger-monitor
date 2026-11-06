# Data builders

Each script rebuilds one dashboard's published data from raw downloads: `data/<id>/*` (CSV, JSON, `sources.json`, `index.json`, the data page) and `<id>/assets/data.js`, which the dashboard loads. They need Node.js 18 or later and no packages.

    node scripts/build/food.mjs
    node scripts/build/debt.mjs
    node scripts/build/heat.mjs
    node scripts/build/minerals.mjs
    node scripts/build/vaccines.mjs
    node scripts/build/energy.mjs
    node scripts/build/medicines.mjs

Raw downloads go in `scripts/.raw/`, which git ignores, laid out as below. To keep them elsewhere, set `RAW` to the folder that holds `food/`, `debt/`, `heat/`, `minerals/`, `medicines/`, `energy/`, `vaccines/` and `cmo/`. Excel files are read unzipped: unzip the `.xlsx` into the folder named.

After rebuilding, refresh the derived pages and check them:

    node scripts/hub-sparks.mjs && node scripts/countries.mjs && node scripts/preload-hints.mjs && node scripts/seo.mjs && node scripts/og-images.mjs
    node scripts/check.mjs

Then add a line to `docs/updates.json` and run `node scripts/feed.mjs`, so feed readers hear about the refresh. `node scripts/freshness.mjs` lists the sources that are due for a new edition.

Each builder prints a short report: compare it with the published figures before you publish. Headline facts quoted from reports (the `facts` table) and source dates (`SOURCES`) are written in the scripts, so update them by hand when a new edition comes out.

## Shared: `cmo/`

World Bank Pink Sheet, monthly prices: [CMO-Historical-Data-Monthly.xlsx](https://www.worldbank.org/en/research/commodity-markets), unzipped into `cmo/` (sheet 2 is "Monthly Prices"). Used by Food and Minerals.

## `food/`

| File | Source |
|---|---|
| `fs/` | FAOSTAT Food Security bulk file, unzipped: `https://bulks-faostat.fao.org/production/Food_Security_Data_E_All_Data_(Normalized).zip` |
| `cahd/` | FAOSTAT Cost and Affordability of a Healthy Diet: `https://bulks-faostat.fao.org/production/Cost_Affordability_Healthy_Diet_(CoAHD)_E_All_Data_(Normalized).zip` |
| `cpi/` | FAOSTAT Consumer Price Indices: `https://bulks-faostat.fao.org/production/ConsumerPriceIndices_E_All_Data_(Normalized).zip` |
| `ffpi.csv` | FAO Food Price Index CSV, from the [FAO Food Price Index page](https://www.fao.org/worldfoodsituation/foodpricesindex/en/) |
| `ffr/` | FAO Food Price Index, nominal and real (`food_price_index_nominal_real.xlsx`, same page), unzipped |
| `ons_d7g8.csv`, `ons_d7g7.csv`, `ons_d7bu.csv` | ONS series, e.g. `https://www.ons.gov.uk/generator?format=csv&uri=/economy/inflationandpriceindices/timeseries/d7g8/mm23` |
| `share-of-consumer-expenditure-spent-on-food.csv` | [Our World in Data](https://ourworldindata.org/grapher/share-of-consumer-expenditure-spent-on-food) (USDA ERS) |

## `debt/`

| File | Source |
|---|---|
| `imf_<id>.json` for `GGXCNL_G01_GDP_PT`, `GGXONLB_G01_GDP_PT`, `GGR_G01_GDP_PT`, `G_XWDG_G01_GDP_PT`, `GGXWDG_NGDP` | IMF DataMapper API: `https://www.imf.org/external/datamapper/api/v1/<id>` |
| `wb_<id>.json` for `SH.XPD.GHED.GD.ZS`, `SE.XPD.TOTL.GD.ZS`, `SP.POP.TOTL` | World Bank API: `https://api.worldbank.org/v2/country/all/indicator/<id>?format=json&per_page=20000&date=2010:2026` |
| `ons_nmfx.csv`, `ons_jw2o.csv`, `ons_hf6x.csv` | ONS: `https://www.ons.gov.uk/generator?format=csv&uri=/economy/governmentpublicsectorandtaxes/publicsectorfinance/timeseries/<id>/pusf` |

## `heat/`

| File | Source |
|---|---|
| `era5_daily_2t_global.csv` | Copernicus Climate Pulse: `https://sites.ecmwf.int/data/climatepulse/data/series/era5_daily_series_2t_global.csv` |
| `hadcrut5.2.0.0_global_annual.csv` | Met Office: `https://www.metoffice.gov.uk/hadobs/hadcrut5/data/HadCRUT.5.2.0.0/analysis/diagnostics/HadCRUT.5.2.0.0.analysis.summary_series.global.annual.csv` (update the version when a new one comes out) |
| `owid_annual-temperature-anomalies.csv` | `https://ourworldindata.org/grapher/annual-temperature-anomalies.csv?v=1&csvType=full&useColumnShortNames=true` |
| `wb_cckp_era5_hd35_annual_1950-2025_all_countries.json` | `https://cckpapi.worldbank.org/cckp/v1/era5-x0.25_timeseries_hd35_timeseries_annual_1950-2025_mean_historical_era5_x0.25_mean/all_countries?_format=json` |
| `wb_cckp_era5_tas_annual_1950-2025_all_countries.json` | The same URL with `hd35` replaced by `tas` |
| `wb_cckp_cmip6_hd35_1995-2014_historical_all_countries.json` | `https://cckpapi.worldbank.org/cckp/v1/cmip6-x0.25_climatology_hd35_climatology_annual_1995-2014_median_historical_ensemble_all_mean/all_countries?_format=json` |
| `wb_cckp_cmip6_hd35_2040-2059_ssp245_all_countries.json` | `https://cckpapi.worldbank.org/cckp/v1/cmip6-x0.25_climatology_hd35_climatology_annual_2040-2059_median_ssp245_ensemble_all_mean/all_countries?_format=json` |
| `metoffice_haduk_Tmean_UK.txt` | `https://www.metoffice.gov.uk/pub/data/weather/uk/climate/datasets/Tmean/date/UK.txt` |

When the year changes, move `YEAR` in the script and the year ranges in the CCKP URLs forward.

## `minerals/`

| File | Source |
|---|---|
| `usgs_mcs2026_world_production_reserves.csv` | USGS *Mineral Commodity Summaries 2026*, world production and reserves tables, in long form (`commodity, measure, year, country, value_raw, value, footnote_marks, unit, source_pdf`). The 2026 file was transcribed from the chapter PDFs at `https://pubs.usgs.gov/periodicals/mcs2026/mcs2026-<commodity>.pdf` because the official data release ([doi:10.5066/P1WKQ63T](https://doi.org/10.5066/P1WKQ63T)) could not be downloaded by script. If you can download `MCS2026_ALLchapters_Reconcile.csv` in a browser, reshape it into these columns and compare the two. |
| `usgs_mcs2026_prices_annual.csv` | Annual price rows from the same chapters (`commodity, series, unit, 2021…2025e, source_note, source_pdf`) |
| `iea/iea_gcmo2026_refined_share_by_country_2025.csv` | IEA chart download: [share of refined material production by country](https://www.iea.org/data-and-statistics/charts/share-of-refined-material-production-by-country-with-the-top-producers-share-2023-versus-2025) |
| `iea/iea_gcmo2025_top_refiner_share_20_minerals.csv` | IEA chart download: [share of top refining country for 20 minerals](https://www.iea.org/data-and-statistics/charts/share-of-top-refining-country-for-20-energy-related-minerals) |

The export-control timeline and headline facts are written in the script, with links to each announcement in `SOURCES`. Recheck their status before publishing: China's suspensions run to 10 and 27 November 2026.

All builders match countries to map shapes with `data/air/countries.json`, so keep that file in place.

## `vaccines/`

| File | Source |
|---|---|
| `coverage-data/` | WHO Immunization Data portal, vaccination coverage export (WUENIC rows), unzipped: `https://srhdpeuwpubsa-geecgzbpd5h0fueu.z01.azurefd.net/whdh/WIISE/export/coverage-data.xlsx` (linked from [the coverage page](https://immunizationdata.who.int/global?topic=Vaccination-coverage)) |
| `wuenic-input-to-pdf/` | WUENIC country-profile input (surviving infants, sheet 2), unzipped: `https://immunizationdata.who.int/docs/librariesprovider21/additional-datasets/wuenic-input-to-pdf.xlsx` (portal > Additional datasets) |
| `reported-cases-data/` | Reported cases export, unzipped: `https://srhdpeuwpubsa-geecgzbpd5h0fueu.z01.azurefd.net/whdh/WIISE/export/reported-cases-data.xlsx` |
| `incidence-rate-data/` | Incidence export, unzipped: `https://srhdpeuwpubsa-geecgzbpd5h0fueu.z01.azurefd.net/whdh/WIISE/export/incidence-rate-data.xlsx` |
| `gho_HWF_0001.json`, `gho_HWF_0006.json` | WHO GHO API: `https://ghoapi.azureedge.net/api/HWF_0001` (doctors per 10,000) and `https://ghoapi.azureedge.net/api/HWF_0006` (nurses and midwives per 10,000) |
| `gho_WHS4_100.json` | WHO GHO API, DTP3 coverage, used only for each country's WHO region: `https://ghoapi.azureedge.net/api/WHS4_100` |
| `cover-annual-2025-26/` | UKHSA COVER annual data tables 2025 to 2026 (`.ods`), unzipped so `content.xml` is in the folder: from [the COVER April 2025 to March 2026 page](https://www.gov.uk/government/statistics/cover-of-vaccination-evaluated-rapidly-cover-programme-april-2025-to-march-2026) |

The builder also reads `data/air/countries.json` for country names and numeric codes. Headline facts (the UNICEF/WHO release and *State of the World's Nursing 2025*) are typed into the builder.

## `energy/`

| File | Source |
|---|---|
| `wb_<id>.json` for `EG.ELC.ACCS.ZS`, `EG.ELC.ACCS.UR.ZS`, `EG.ELC.ACCS.RU.ZS`, `EG.CFT.ACCS.ZS`, `SP.POP.TOTL` | World Bank API: `https://api.worldbank.org/v2/country/all/indicator/<id>?format=json&per_page=20000&date=2000:2026` |
| `es_nrg_pc_204.json` | Eurostat API: `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/nrg_pc_204?format=JSON&lang=EN&nrg_cons=KWH2500-4999&tax=I_TAX&unit=KWH&sinceTimePeriod=2015-S1` |
| `es_nrg_pc_202.json` | The same, for `nrg_pc_202` with `nrg_cons=GJ20-199` |
| `es_ilc_mdes01.json`, `es_ilc_mdes07.json` | Eurostat API: `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/<id>?format=JSON&lang=EN&sinceTimePeriod=2015` |
| `ofgem_dtc/` | Ofgem default tariff cap level model, unzipped: `https://www.ofgem.gov.uk/sites/default/files/2026-08/Default-tariff-cap-level-v1.31.xlsx` (sheet6.xml is "1c Consumption adjusted levels"; newer versions are listed on the [cap levels page](https://www.ofgem.gov.uk/energy-regulation/domestic-and-non-domestic/energy-pricing-rules/energy-price-cap/energy-price-cap-default-tariff-levels)) |
| `ofgem_summary_2026Q4.pdf` | Ofgem summary letter, for the headline facts: `https://www.ofgem.gov.uk/sites/default/files/2026-08/Summary-of-changes-to-energy-price-cap-1-October-to-31-December-2026.pdf` |
| `desnz_trends/` | DESNZ fuel poverty trend tables, unzipped: `https://assets.publishing.service.gov.uk/media/69c3b05e3ed0546101e0dc41/2025_Trends_Tables__2026_Fuel_Poverty_Statistics_Publication_.xlsx` (sheet5.xml is Table 1, sheet6.xml Table 2) |
| `desnz_fp_report_2026.pdf` | DESNZ annual fuel poverty statistics report 2026, for the headline facts: `https://assets.publishing.service.gov.uk/media/6a733816201b38b4dc3c2854/2026-fuel-poverty-statistics-report.pdf` |

When Ofgem publishes a new cap (next on 25 November 2026, for January to March 2027), download the new model and update the `facts` and the `ofgem-*` dates in the script. The Tracking SDG 7 headline facts are typed into the script from the WHO joint news release of 24 June 2026.

## `medicines/`

| File | Source |
|---|---|
| `fda/drug-shortages-0001-of-0001.json` | openFDA drug shortages bulk file, unzipped: `https://download.open.fda.gov/drug/shortages/drug-shortages-0001-of-0001.json.zip` (listed in `https://api.fda.gov/download.json`) |
| `comtrade_hs30_X_2024.json`, `comtrade_hs30_M_2024.json`, `comtrade_hs30_X_2025.json`, `comtrade_hs30_M_2025.json`, `comtrade_hs2941_X_2024.json`, `comtrade_hs2941_M_2024.json`, `comtrade_hs2941_X_2025.json` | UN Comtrade public preview API: `https://comtradeapi.un.org/public/v1/preview/C/A/HS?cmdCode=<30 or 2941>&flowCode=<X or M>&partnerCode=0&period=<year>&includeDesc=true`. It is rate-limited: wait a few seconds between calls |
| `ema/` | EMA shortages catalogue, unzipped: `https://www.ema.europa.eu/en/documents/report/medicines-output-shortages-report_en.xlsx` |
| `ulcm/` | Union list of critical medicines, unzipped: `https://www.ema.europa.eu/en/documents/other/union-list-critical-medicines-en.xlsx` |
| `cpe_archive.html` | Community Pharmacy England price concession archive page: `https://cpe.org.uk/funding-and-reimbursement/reimbursement/price-concessions/archive/` |
| `nhsbsa_ssp.html` | NHSBSA Serious Shortage Protocols page: `https://www.nhsbsa.nhs.uk/pharmacies-gp-practices-and-appliance-contractors/serious-shortage-protocols-ssps` |

FDA's yearly shortage counts, the FDA quality report figures and the headline facts are written in the script from the report PDFs (`https://www.fda.gov/drugs/drug-shortages/drug-shortages-additional-news-and-information` lists the reports to Congress; the quality report is at `https://www.fda.gov/about-fda/center-drug-evaluation-and-research-cder/report-state-pharmaceutical-quality`). Add a row to `US_YEARS` when the next report to Congress comes out, usually mid-year. The CPE archive grows each month; if the builder's latest-month count differs from the total in CPE's "final update" news post, check the table parsing.
