# Data builders

Each script rebuilds one dashboard's published data from raw downloads: `data/<id>/*` (CSV, JSON, `sources.json`, `index.json`, the data page) and `<id>/assets/data.js`, which the dashboard loads. They need Node.js 18 or later and no packages. Run `air.mjs` first when its country list changes: it writes `data/air/countries.json`, which the other builders read for country names and codes.

    node scripts/build/air.mjs
    node scripts/build/chokepoints.mjs
    node scripts/build/debt.mjs
    node scripts/build/electricity.mjs
    node scripts/build/energy.mjs
    node scripts/build/fertilizer.mjs
    node scripts/build/food.mjs
    node scripts/build/heat.mjs
    node scripts/build/housing.mjs
    node scripts/build/internet.mjs
    node scripts/build/medicines.mjs
    node scripts/build/minerals.mjs
    node scripts/build/orbit.mjs
    node scripts/build/remittances.mjs
    node scripts/build/scams.mjs
    node scripts/build/vaccines.mjs
    node scripts/build/water.mjs
    node scripts/build/disasters.mjs
    node scripts/build/wages.mjs

Raw downloads go in `scripts/.raw/`, which git ignores, laid out as below. To keep them elsewhere, set `RAW` to the folder that holds one subfolder per dashboard (`food/`, `debt/`, `air/` and so on) and the shared `cmo/`. Excel files are read unzipped: unzip the `.xlsx` into the folder named.

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
| `ers_intl/` | USDA ERS [International Food and Alcoholic Beverage Expenditure Data](https://www.ers.usda.gov/data-products/international-food-and-alcoholic-beverage-expenditure-data): *Percent of consumer expenditures spent on food, alcoholic beverages, and tobacco that were consumed at home, by selected countries, 2021–2025* (XLSX), unzipped. One sheet per year; the builder takes each country's latest year. When a new edition comes out, update the `usda-ers` title, date and notes in the script. |

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

## `fertilizer/`

| File | Source |
|---|---|
| `rfn/` | FAOSTAT Fertilizers by Nutrient bulk file, unzipped: `https://bulks-faostat.fao.org/production/Inputs_FertilizersNutrient_E_All_Data_(Normalized).zip` |
| `cmo_forecasts.txt` | World Bank Commodity Markets Outlook price forecasts, converted with `pdftotext -raw`: `https://thedocs.worldbank.org/en/doc/2ac43f46629cf90c2ea5b8929a343593-0050012026/related/CMO-October-2026-Forecasts.pdf` (linked as "Price forecasts" on [the commodity markets page](https://www.worldbank.org/en/research/commodity-markets)) |
| `API_20261029.csv` | Defra agricultural price indices, monthly CSV (2020 = 100): `https://assets.publishing.service.gov.uk/media/6adf42f4b62d80a107bc5cf7/API_20261029.csv` (from [the API page](https://www.gov.uk/government/statistics/agricultural-price-indices); the file name changes each month, so update it in the script) |
| `bsfp_ts/` | British Survey of Fertiliser Practice time series (`.ods`), unzipped so `content.xml` is in the folder: `https://assets.publishing.service.gov.uk/media/6a564aa72f6185941a9a64b5/BSFP_2025_timeseries_dataset_260716.ods` (from [the BSFP dataset page](https://www.gov.uk/government/statistical-data-sets/british-survey-of-fertiliser-practice-dataset)) |

The builder also reads the shared Pink Sheet in `cmo/` (sheets 2 and 3) and `data/air/countries.json` for country names and numeric codes. The headline facts (World Bank blog, Al Jazeera, Defra's August 2026 release) are typed into the builder. When the World Bank publishes new forecasts (April and October), download the new PDF, convert it and update the `wb-cmo-forecast` source.

## `chokepoints/`

| File | Source |
|---|---|
| `portwatch_chokepoints_2026-10-31.csv` | IMF PortWatch "Daily Chokepoints Data" export of 31 October 2026 (data to 25 October 2026), from the public copy at `https://raw.githubusercontent.com/jhelvy/2026-global-oil-flows/42baea26/data/raw/portwatch_chokepoints_2026-10-31.csv`. The same rows can be queried from PortWatch's ArcGIS service, one chokepoint at a time (at most 1,000 rows per call; add `&resultOffset=1000` and so on for more): `https://services9.arcgis.com/weJ1QsnbMYJlCHdG/arcgis/rest/services/Daily_Chokepoints_Data/FeatureServer/0/query?where=portid%3D%27chokepoint6%27+AND+date%3E%3D%272025-01-01%27&outFields=*&orderByFields=date&resultRecordCount=1000&f=json` for `chokepoint1`, `4`, `6` and `7`. Save these as `portwatch_daily_<anything>.json`. The builder reads them when the CSV is missing. The service is rate-limited across all its users and often returns error 429, so wait a minute and try again. |
| `portwatch_chokepoints_database.csv` | PortWatch chokepoints database (names and locations), CSV download: `https://hub.arcgis.com/api/v3/datasets/fa9a5800b0ee4855af8b2944ab1e07af_0/downloads/data?format=csv&spatialRefId=4326&where=1%3D1` |
| `eia_world_oil_transit_chokepoints.html` | EIA *World Oil Transit Chokepoints* page, saved as HTML: `https://www.eia.gov/international/content/analysis/special_topics/world_oil_transit_chokepoints` (the first table is read) |

The builder takes an optional end date, `node scripts/build/chokepoints.mjs 2026-11-22`, which defaults to the last published day (25 October 2026). To extend the series, save a newer export, either as a CSV with `PORTWATCH=<file>` or as ArcGIS query files. Then pass the new end date and update the `portwatch` source date and notes in the script. The dashboard text in `chokepoints/assets/chokepoints.js` ("PortWatch's export of 31 October 2026 … taken from a public copy") and the hub's "data to" date also need updating. PortWatch revises past days, so compare the builder's report with the published summary. The Hormuz closure date and the headline facts are written in the script.

## `housing/`

| File | Source |
|---|---|
| `ons_bulletin_2025.html` | Optional, used to check the ONS figures: `https://www.ons.gov.uk/peoplepopulationandcommunity/housing/bulletins/housingaffordabilityinenglandandwales/2025` |
| `ubs_grebi_2026.txt` | Optional, used to check the UBS risk categories: text of the media release PDF linked from `https://www.ubs.com/global/en/media/display-page-ndp/en-20260922-grebi26.html`, saved with `pdftotext -layout -enc UTF-8` (ubs.com refuses scripted requests for the HTML page) |

The Demographia median multiples (2026 and 2025 editions) are published only as PDFs, so they are typed into the script with their source ids. So are the market coordinates (GeoNames, 2 decimals), the ONS ratios and the UBS risk groups. When the ONS bulletin and the UBS media release text are downloaded, the builder checks the typed figures against them and prints any that it cannot find. The dashboard reads `housing/assets/data.js`, which the builder writes.

## `electricity/`

| File | Source |
|---|---|
| `owid-energy-data.csv` | Our World in Data energy dataset (Ember Yearly Electricity Data, 2026 release), pinned to the commit of 27 April 2026: `https://raw.githubusercontent.com/owid/energy-data/e7897aed55b514b8d16e0a3d8f1518789ac3de31/owid-energy-data.csv` |

This GitHub file is OWID's legacy release and is no longer updated. OWID's new file is `https://catalog.ourworldindata.org/energy/owid_energy/owid_energy.csv` (new primary-energy method, renamed columns; see its `column_mapping.csv`). Moving to it means changing the column names in `mix()`. Countries are those in `data/air/countries.json` with generation above 0 TWh in 2025, or else 2024. Generation per person is generation ÷ OWID population. Headline facts (Ember Global Electricity Review 2026, Ratcliffe-on-Soar closure) are typed into the script.

## `air/`

| File | Source |
|---|---|
| `owid_outdoor-air-pollution-exposure.csv` | SatPM population-weighted PM2.5: `https://ourworldindata.org/grapher/outdoor-air-pollution-exposure.csv?v=1&csvType=full&useColumnShortNames=true` |
| `owid_human-caused-air-pollution-exposure.csv` | AQLI PM2.5 from human sources (the `pm25_human` column): `https://ourworldindata.org/grapher/human-caused-air-pollution-exposure.csv?v=1&csvType=full&useColumnShortNames=true` |
| `owid_ind_1298167.data.json`, `owid_ind_1298167.metadata.json` | WHO SDG 11.6.2 PM2.5, urban areas (the series behind `exposure-to-outdoor-air-pollution-in-urban-areas`): `https://api.ourworldindata.org/v1/indicators/1298167.data.json` and `.metadata.json` |
| `owid_ind_<id>.data.json`, `owid_ind_<id>.metadata.json` for `1171305` (all air pollution deaths), `1171332` (ambient PM), `1171721` (household), `1171314` (ozone), `1172183` (share of age-standardised deaths), `1173306` (ambient PM deaths per 100,000, crude) | IHME GBD 2023 via OWID indicator API: `https://api.ourworldindata.org/v1/indicators/<id>.data.json` and `.metadata.json`. The grapher CSV downloads are blocked for IHME data (non-redistributable), but the indicator API serves them |
| `iso3166_all.csv` | ISO 3166 codes, for `iso_n3`: `https://raw.githubusercontent.com/lukes/ISO-3166-Countries-with-Regional-Codes/99cdae15c839bb4f94a23db4e47b4a4c590dec61/all/all.csv` |

Indicator ids change when OWID re-imports a dataset. If an id 404s, open the chart's `.config.json` (`https://ourworldindata.org/grapher/<slug>.config.json`, `dimensions[].variableId`) to find the new one. Charts: `deaths-from-air-pollution-line`, `share-deaths-air-pollution`, `death-rate-from-ambient-particulate-air-pollution`, `exposure-to-outdoor-air-pollution-in-urban-areas`. The WHO and IQAir headline facts are typed into the script.

## `water/`

| File | Source |
|---|---|
| `owid_ind_1305196.data.json`, `owid_ind_1305196.metadata.json` | FAO SDG 6.4.2 water stress via OWID indicator API (the series behind `freshwater-withdrawals-as-a-share-of-internal-resources`): `https://api.ourworldindata.org/v1/indicators/1305196.data.json` and `.metadata.json`. Countries with the same rounded value keep this file's entity order |
| `un_sdg_ER_H2O_STRESS_regions.json` | UN SDG API, SDG regional aggregates for 2023: `https://unstats.un.org/sdgapi/v1/sdg/Series/Data?seriesCode=ER_H2O_STRESS&areaCode=1&areaCode=202&areaCode=747&areaCode=62&areaCode=753&areaCode=419&areaCode=543&areaCode=53&areaCode=513&timePeriod=2023&pageSize=100` |
| `owid_agricultural-water-as-a-share-of-total-water-withdrawals.csv`, `owid_industrial-water-as-a-share-of-total-water-withdrawals.csv`, `owid_municipal-water-as-a-share-of-total-water-withdrawals.csv`, `owid_renewable-water-resources-per-capita.csv`, `owid_water-withdrawals-per-capita.csv` | AQUASTAT via OWID: `https://ourworldindata.org/grapher/<slug>.csv?v=1&csvType=full&useColumnShortNames=true` |
| `owid_access-drinking-water-stacked.csv`, `owid_number-without-safe-drinking-water.csv` | WHO/UNICEF JMP via OWID, same URL pattern |

When the stress year moves on, change `STRESS_YEAR` and the `timePeriod` in the UN SDG URL. The `jmp_without` fact is typed in. The builder prints a note if the JMP world figure no longer matches it. The other headline facts (WRI, GRACE, UNCCD, LBNL) are typed in from each report.

## `orbit/`

| File | Source |
|---|---|
| `owid_yearly-number-of-objects-launched-into-outer-space.csv` and `.metadata.json` | Our World in Data (UNOOSA Online Index): `https://ourworldindata.org/grapher/yearly-number-of-objects-launched-into-outer-space.csv?v=1&csvType=full&useColumnShortNames=true`, and the same URL with `.metadata.json` in place of `.csv` |
| `owid_cumulative-number-of-objects-launched-into-outer-space.csv` and `.metadata.json` | The same, for `cumulative-number-of-objects-launched-into-outer-space` |
| `owid_space-objects-by-orbit.csv` and `.metadata.json` | The same, for `space-objects-by-orbit` (US Space Force Space-Track catalogue: payloads and rocket bodies by orbit) |
| `owid_low-earth-orbits-objects.csv` and `.metadata.json` | The same, for `low-earth-orbits-objects` (payloads, rocket bodies and debris in low Earth orbit) |

The builder also reads `data/air/countries.json` for ISO numeric codes. If an OWID file's `lastUpdated` differs from the `published` date in `SOURCES`, the builder prints a warning: update the date in the script, and the `objects_2025` column and its description if a new year has been added. OWID refreshes the UNOOSA charts about once a year (next due 25 February 2027) and the Space-Track charts likewise (next due 8 January 2027). The ESA and Starlink facts are typed into the script.

## `internet/`

| File | Source |
|---|---|
| `tg2021/cable/*.json` (one per cable, plus `all.json` and a stray copy of `cable-geo.json`, which the builder skips) | TeleGeography Submarine Cable Map open data, January 2021, from the public mirror: `https://raw.githubusercontent.com/hadistlm/submarine-cable-map/master/data/cable/<file>`. List the files with `https://api.github.com/repos/hadistlm/submarine-cable-map/git/trees/HEAD?recursive=1` |
| `tg2021/cable-geo.json` | Cable routes from the same mirror: `https://raw.githubusercontent.com/hadistlm/submarine-cable-map/master/data/cable-geo.json` |
| `countries-110m.json` | Natural Earth 1:110m shapes, from world-atlas: `https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json` |
| `azure-network-latency.html` | Microsoft's [Azure network round-trip latency statistics](https://learn.microsoft.com/en-us/azure/networking/azure-network-latency) page, saved as HTML |

The cable data stays frozen at January 2021. TeleGeography no longer publishes open data: its current map data (the `submarinecablemap.com/api/v3` JSON) is restricted to paying subscribers, and only screen captures of the map are CC BY-SA. The cloud regions (provider pages, placed at GeoNames cities), TOP500, Epoch AI, IEA, LBNL, CSO and water figures are typed into the script. Update them by hand when the providers add regions or a new edition comes out. When Microsoft updates the latency page, save it again and change the dates in the `azure-latency` source and the `azure_latency` description.

## `scams/`

| File | Source |
|---|---|
| `irs_yearly_fx.html` | IRS yearly average currency exchange rates, saved as HTML: `https://www.irs.gov/individuals/international-taxpayers/yearly-average-currency-exchange-rates`. The builder reads the `FX_YEAR` column (2025) for the nine currencies it needs |

Everything else is typed into the script, because the agencies publish their annual figures in PDFs, web pages and press releases: FBI IC3 Internet Crime Report (April), FTC Consumer Sentinel (March), UK Finance Annual Fraud Report (May–June), ACCC / National Anti-Scam Centre Targeting Scams (March), Canadian Anti-Fraud Centre (February–March), Singapore Police Force annual scams brief (February), I4C / NCRP (January), and GASA's Global State of Scams (October–November) and national State of Scams reports. Each row cites the source id of the page it was read from. When a new edition comes out, add a new source id (for example `gasa-global-2026`) instead of editing the old one, move the rows over, change the year in `FX_YEAR`, `FX_SOURCE` and the table titles, and check the dashboard text in `scams/assets/scams.js`, which quotes "2025" and "GASA Global State of Scams 2025/2024" in several places.

## `remittances/`

| File | Source |
|---|---|
| `rpw_dataset/` | Remittance Prices Worldwide complete dataset, unzipped: `https://datacatalogfiles.worldbank.org/ddh-published/0037898/DR0095523/rpw_dataset_2011_2025_q3.xlsx` (linked from [the Data Catalog page](https://datacatalog.worldbank.org/search/dataset/0037898/remittance-prices-worldwide); sheet6.xml is "Dataset (from Q2 2016)", about 300 MB, streamed) |
| `RPW_main_report_and_annex_Q325.pdf` | RPW Issue 54 report, for the headline facts: `https://datacatalogfiles.worldbank.org/ddh-published/0037898/DR0095413/RPW_main_report_and_annex_Q325.pdf` |
| `sdg_SI_RMT_COST.json`, `sdg_SI_RMT_COST_SND.json`, `sdg_SI_RMT_COST_BC.json`, `sdg_SI_RMT_COST_SC.json` | UN SDG API: `https://unstats.un.org/sdgs/UNSDGAPIV5/v1/sdg/Series/Data?seriesCode=<series>&pageSize=100000` |
| `wb_<id>.json` for `BX.TRF.PWKR.CD.DT`, `BX.TRF.PWKR.DT.GD.ZS`, `BM.TRF.PWKR.CD.DT` | World Bank API: `https://api.worldbank.org/v2/country/all/indicator/<id>?format=json&per_page=20000&date=2000:2026` |
| `wb_countries.json` | World Bank API country list (ISO2 codes, regions, income groups): `https://api.worldbank.org/v2/country?format=json&per_page=400` |

remittanceprices.worldbank.org is behind a Cloudflare challenge, so use the Data Catalog links. The builder also reads `data/air/countries.json` for country names and numeric codes. Headline facts (RPW Issue 54 and SDG target 10.c) are typed into the builder.

## `disasters/`

| File | Source |
|---|---|
| `rentschler/supplementary.pdf`, `rentschler/supp_raw.txt` | Rentschler et al. (2022), Supplementary Information: `https://static-content.springer.com/esm/art%3A10.1038%2Fs41467-022-30727-4/MediaObjects/41467_2022_30727_MOESM1_ESM.pdf` (linked from [the article](https://www.nature.com/articles/s41467-022-30727-4)). The builder reads `supp_raw.txt`, made with `pdftotext -raw supplementary.pdf supp_raw.txt` (poppler) |
| `idmc/disaster-displacements.csv` | IDMC, internal displacements associated with disasters, from [HDX](https://data.humdata.org/dataset/idmc-internal-displacements-new-displacements-associated-with-disasters) (CSV resource) |
| `wb/SP.POP.TOTL.json` | World Bank API: `https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?format=json&per_page=20000&date=2016:2025` |
| `pages/nafra.json` | GOV.UK content API for NaFRA 2024: `https://www.gov.uk/api/content/government/publications/national-assessment-of-flood-and-coastal-erosion-risk-in-england-2024/national-assessment-of-flood-and-coastal-erosion-risk-in-england-2024` (tables 4, 6, 7, 8, 10, 12, 13, 14 and 16 are parsed from `details.body`) |
| `pages/*.pdf`, `pages/*.html` | Kept for checking the typed-in figures: CRED's [2025 Disasters in Numbers](https://files.emdat.be/reports/2025_EMDAT_report.pdf), the Swiss Re sigma press release PDF, Munich Re's 2025 media release and factsheets (2025 and first half of 2026), the ABI and Flood Re releases |

The builder also reads `data/air/countries.json` for country names and numeric codes. Figures from CRED, Swiss Re, Munich Re, the ABI, Flood Re and the NaFRA text are typed into the builder with their source ids; each CRED hazard column was checked against the report's totals.

## `wages/`

| File | Source |
|---|---|
| `ilo_EAR_INEE_CUR_NB.csv` | ILO SDMX API, monthly minimum wage by currency: `https://sdmx.ilo.org/rest/data/ILO,DF_EAR_INEE_CUR_NB,1.0/all?format=csv&startPeriod=2010` |
| `ilo_EAR_EMTA_SEX_CUR_NB.csv` | Average monthly earnings of employees by sex and currency: same URL with `DF_EAR_EMTA_SEX_CUR_NB` and `startPeriod=2010` |
| `ilo_SDG_0111_SEX_AGE_RT.csv` | Working poverty rate (SDG 1.1.1): same URL with `DF_SDG_0111_SEX_AGE_RT` and `startPeriod=2000` |
| `ilo_LAP_2GDP_NOC_RT.csv` | Labour income share, ILO modelled estimates: same URL with `DF_LAP_2GDP_NOC_RT` and `startPeriod=2004` |
| `oecd_AV_AN_WAGE.csv`, `oecd_RMW.csv`, `oecd_MIN2AVE.csv` | OECD SDMX API: `https://sdmx.oecd.org/public/rest/data/OECD.ELS.SAE,DSD_EARNINGS@<id>,1.0/all?startPeriod=2000&dimensionAtObservation=AllDimensions&format=csvfilewithlabels` |
| `cahd/` | FAOSTAT Cost and Affordability of a Healthy Diet, unzipped: `https://bulks-faostat.fao.org/production/Cost_Affordability_Healthy_Diet_(CoAHD)_E_All_Data_(Normalized).zip` |
| `ons_kab9.csv`, `ons_a3wx.csv`, `ons_a3ww.csv` | ONS: `https://www.ons.gov.uk/generator?format=csv&uri=/employmentandlabourmarket/peopleinwork/earningsandworkinghours/timeseries/<id>/emp` |
| `ons_lowpay_75a77a6c.csv` | ONS *Low and high pay in the UK: 2026*, Figure 1 data: `https://www.ons.gov.uk/generator?uri=/employmentandlabourmarket/peopleinwork/earningsandworkinghours/bulletins/lowandhighpayuk/2026/75a77a6c&format=csv` (next year: the new bulletin's Figure 1 "Download this chart" CSV) |

The builder also reads `data/air/countries.json` for country names and numeric codes. The National Living Wage rates (GOV.UK, from April 2019) and the headline facts (ILO *Global Wage Report 2024-25* and *Employment and Social Trends 2026* press releases, the LPC's 2027 announcement, the ONS bulletins) are typed into the builder. `ilo_EAR_INEE_CUR_NB.csv` and the other ILO files can be large; the ILO's `rplumber` and `ilostat-files` bulk URLs returned empty files or 404s on 7 November 2026, so use the SDMX API.
