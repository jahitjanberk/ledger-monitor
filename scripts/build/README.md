# Data builders

Each script rebuilds one dashboard's published data from raw downloads: `data/<id>/*` (CSV, JSON, `sources.json`, `index.json`, the data page) and `<id>/assets/data.js`, which the dashboard loads. They need Node.js 18 or later and no packages.

    node scripts/build/food.mjs
    node scripts/build/debt.mjs
    node scripts/build/heat.mjs
    node scripts/build/minerals.mjs

Raw downloads go in `scripts/.raw/`, which git ignores, laid out as below. To keep them elsewhere, set `RAW` to the folder that holds `food/`, `debt/`, `heat/`, `minerals/` and `cmo/`. Excel files are read unzipped: unzip the `.xlsx` into the folder named.

After rebuilding, refresh the derived pages and check them:

    node scripts/hub-sparks.mjs && node scripts/preload-hints.mjs && node scripts/seo.mjs && node scripts/og-images.mjs
    node scripts/check.mjs

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
