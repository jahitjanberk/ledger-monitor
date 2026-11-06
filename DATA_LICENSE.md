# Data licences

Ledger Monitor's code is MIT-licensed (see [LICENSE](LICENSE)). The data is covered separately, as follows.

## Our compilation: CC BY 4.0

The tables under `data/` are our selection, cleaning and arrangement of figures from public sources. You may reuse them under [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/). Please credit **Ledger Monitor** and the original publisher of the figures you use.

## The underlying data: the publishers' own terms

Every figure still belongs to the organisation that published it, and its terms apply. Each dashboard lists its publishers, with links, in `data/<dashboard>/sources.json` and on its data page (`data/<dashboard>/index.html`). Every row in the tables names its source.

Take particular care with these:

| Data | Used in | Terms |
|---|---|---|
| TeleGeography Submarine Cable Map (cable routes and landing points, January 2021 snapshot) | Internet | [CC BY-NC-SA 3.0](https://creativecommons.org/licenses/by-nc-sa/3.0/): credit TeleGeography, **non-commercial use only**, and share adaptations under the same licence. This overrides the CC BY 4.0 shown for the Internet tables `cables` and `landings`. |
| IMF PortWatch (daily transits) | Chokepoints | IMF PortWatch's terms of use |
| US Energy Information Administration (oil flows) | Chokepoints | EIA's terms; US government data is generally public domain |
| Our World in Data's processed series (Ember, SatPM, IHME, UNOOSA, US Space Force, SDG data, USDA ERS, Copernicus ERA5) | Electricity, Air, Orbit, Water, Food, Heat | CC BY 4.0 for Our World in Data's processing, plus the original producer's terms |
| FAOSTAT (food security, healthy diet costs, consumer prices) and the FAO Food Price Index | Food | [CC BY 4.0](https://www.fao.org/contact-us/terms/db-terms-of-use/en/), credit FAO |
| World Bank Commodity Price Data (Pink Sheet) | Food, Minerals | CC BY 4.0, credit the World Bank |
| IMF Fiscal Monitor and World Economic Outlook | Debt | The [IMF's copyright and usage terms](https://www.imf.org/en/About/copyright-and-terms): reuse with credit and a link to the IMF; derived figures, such as net interest, must say they are derived; **commercial reuse needs the IMF's permission** |
| World Bank World Development Indicators (health and education spending from WHO and UNESCO, population) | Debt | CC BY 4.0, credit the World Bank and the original producer |
| ONS consumer price series and public sector finances; DWP Family Resources Survey | Food, Debt | [Open Government Licence v3.0](https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/) |
| Copernicus Climate Change Service ERA5 (Climate Pulse daily series; country anomalies via Our World in Data) | Heat | The [Copernicus licence](https://cds.climate.copernicus.eu/licences): free reuse with the credit "Contains modified Copernicus Climate Change Service information (2026)" |
| World Bank Climate Change Knowledge Portal (hot days, observed and modelled) | Heat | CC BY 4.0, credit the World Bank |
| Met Office HadCRUT5 and HadUK-Grid; UKHSA heat mortality reports | Heat | [Open Government Licence v3.0](https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/) |
| USGS Mineral Commodity Summaries 2026 | Minerals | US public domain |
| IEA Global Critical Minerals Outlook 2025 and 2026 (refining shares) | Minerals | [CC BY 4.0](https://www.iea.org/terms/creative-commons-cc-licenses): our tables are a work derived from IEA material and are not endorsed by the IEA |
| OECD Inventory of Export Restrictions on Critical Raw Materials | Minerals | CC BY 4.0 |
| GeoNames (city coordinates) | Housing, Internet | CC BY 4.0 |
| Natural Earth (country shapes) | Every map | Public domain |

Individual figures quoted from reports and news articles, such as a single total or percentage, are cited with a link to the original.

## Bundled code and fonts

The built site includes third-party code and fonts under their own licences: [MapLibre GL JS](https://github.com/maplibre/maplibre-gl-js) (BSD 3-Clause), [D3](https://github.com/d3/d3) (ISC), and the Inter Tight and JetBrains Mono fonts (SIL Open Font License 1.1, see `assets/fonts/`).

If you think something here is wrong, please [open an issue](https://github.com/jahitjanberk/ledger-monitor/issues).
