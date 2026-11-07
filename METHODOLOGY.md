# Methodology

How Ledger Monitor chooses, processes and presents its figures. Each dashboard repeats its own section of this file at the bottom of the page.

## Principles

- **Every figure is cited.** Each number on a dashboard links to the report or dataset it came from. Select a number with a dotted underline to see its source.
- **Official statistics come first.** Where none exist, survey or modelled estimates are used, and the source drawer labels each figure as *reported to authorities*, *survey estimate* or *reference*.
- **Reported and estimated figures are kept apart.** They measure different things, so they are never added together or compared one to one.
- **Every dashboard says what it leaves out.** The limitations below appear on each page.
- **The data is published.** Every table behind a dashboard is available as CSV and JSON under `data/<dashboard>/`, with a source for each row. See [DATA_LICENSE.md](DATA_LICENSE.md).

## Where the Internet Lives

Cable routes and landing points come from TeleGeography's Submarine Cable Map open data, in a public mirror whose last update was January 2021. TeleGeography publishes that data under CC BY-NC-SA 3.0, which allows reuse with credit, for non-commercial purposes, under the same licence. The headline figures for 2026 come from TeleGeography's own FAQ. Routes are stylised and don't show exact seabed paths. TeleGeography no longer publishes open data: its current database is for paying subscribers, so the dashboard stays on the 2021 snapshot.

Cloud regions are each provider's published list: AWS's regions page, Microsoft's list of Azure regions and Google's Cloud Run locations. Providers name an area, not a building, so each region is plotted at a representative city using GeoNames coordinates, and regions in the same city are nudged apart. Regional electricity figures for the US, China and Europe are the IEA's percentage shares of the global total, converted to TWh here.

**What this doesn't show**

- Cable routes come from a January 2021 snapshot, so newer cables are missing, and routes are stylised rather than exact seabed paths.
- Cloud regions are areas, not buildings. Each is plotted at a representative city.
- Latency figures come from Azure's own network; other networks will differ.

Sources: [`data/internet/sources.json`](data/internet/sources.json) · Data: [`data/internet/`](data/internet/)

## Housing Affordability

The median multiple is the median house price divided by the median gross annual household income, for each market's whole metropolitan area. Demographia compiles it for the third quarter of each year from national price and income sources. It measures purchase affordability only, not rents or mortgage costs.

Markets are plotted at their main city using GeoNames coordinates; the "London Exurbs" market is plotted at Reading. The ONS ratio uses individual full-time earnings rather than household income, so it isn't directly comparable. UBS's bubble index measures overvaluation risk, not affordability.

**What this doesn't show**

- It measures the price of buying a home against income. Rents and mortgage rates don't appear.
- Each market is a whole metropolitan area, so city centres can be far less affordable than the figure.
- The ONS ratio uses one worker's earnings rather than household income, so it can't be compared directly with Demographia's.

Sources: [`data/housing/sources.json`](data/housing/sources.json) · Data: [`data/housing/`](data/housing/)

## The Scam Economy

Reported losses are what victims told national agencies, so they undercount real harm. Survey estimates (GASA) ask a sample of adults what they lost and scale it up, so they run much higher. The two are shown separately and shouldn't be compared one to one.

Each agency counts differently: UK Finance covers payment fraud reported by its member banks; Australia combines Scamwatch, ReportCyber, AFCX, IDCARE and ASIC; the FBI figure covers all internet crime reported to IC3; India's is financial cyber fraud reported to the National Cybercrime Reporting Portal. Denmark's estimate is from GASA's 2026 report. The Philippines estimate is shown in pesos only, because the IRS table has no 2025 peso rate.

**What this doesn't show**

- Reported losses only include what victims told an agency, so they undercount real harm.
- Survey estimates scale up what a sample of adults say they lost. They run much higher and can't be compared one to one with reported figures.
- Each agency counts differently, so national totals aren't strictly comparable.

Sources: [`data/scams/sources.json`](data/scams/sources.json) · Data: [`data/scams/`](data/scams/)

## Water Stress

Water stress is SDG indicator 6.4.2: total freshwater withdrawn by agriculture, industry and municipalities, divided by total renewable freshwater minus the flows ecosystems need. Countries report the inputs to FAO's AQUASTAT; FAO is the custodian agency. Values can exceed 100% where a country uses fossil groundwater, desalinated water or water flowing in from neighbours. Country figures are taken from Our World in Data's copy of the UN SDG database; the world figure matches the UN-Water SDG 6 Data Portal. Several countries report the same value for several years, so the 2015 comparison can show no change.

The map colours use the official severity classes: no stress under 25%, low 25 to 50%, medium 50 to 75%, high 75 to 100% and critical over 100%. WRI's Aqueduct uses a different, basin-based model with its own thresholds (40% high, 80% extremely high), so its counts differ from the SDG figures. Drinking water figures are WHO/UNICEF JMP estimates built from household surveys and censuses. Groundwater findings come from GRACE and GRACE-FO satellite gravity data; data centre figures cover the United States only.

**What this doesn't show**

- Country figures hide differences between river basins: a country can be unstressed overall and short of water in one region.
- Several countries report the same value for several years, so change over time can look flatter than it is.
- Data centre water figures cover the United States only.

Sources: [`data/water/sources.json`](data/water/sources.json) · Data: [`data/water/`](data/water/)

## Electricity Mix & Grid Carbon

Carbon intensity is Ember's life-cycle estimate of greenhouse gases emitted per kilowatt-hour generated, in grams of CO₂ equivalent. It counts emissions from building and fuelling plants as well as burning fuel, so even wind, solar and nuclear carry a small amount. It measures where electricity is generated, not where it is used, so imports and exports are not counted.

Generation shares are the share of each country's total electricity generation. Ember publishes 2025 figures for 90 countries so far; the rest show 2024, marked in the table. Figures come from Our World in Data's copy of Ember's Yearly Electricity Data (April 2026 release). The world figures match Ember's Global Electricity Review 2026. Renewables include hydro, wind, solar, bioenergy and other renewables; low-carbon adds nuclear.

**What this doesn't show**

- Carbon is counted where electricity is generated, not where it is used, so imports and exports are left out.
- Only 90 countries have 2025 figures so far; the rest show 2024.
- Electricity is only part of energy use. A clean grid says nothing about heating, transport or industrial fuel.

Sources: [`data/electricity/sources.json`](data/electricity/sources.json) · Data: [`data/electricity/`](data/electricity/)

## Chokepoints

Transits are IMF PortWatch's daily counts of vessels crossing each chokepoint, estimated from satellite AIS ship-tracking signals and grouped by vessel type. Ships that switch off their transponders are missed, and PortWatch revises past days as more signals arrive. This dashboard uses PortWatch's export of 31 October 2026, covering 1 January 2025 to 25 October 2026, taken from a public copy of the official download. Daily data here covers four chokepoints: Hormuz, Bab el-Mandeb, Suez and the Cape of Good Hope. "Since the closure" means from 2 March 2026, the date the IRGC confirmed it.

Oil flows are the US Energy Information Administration's estimates of crude oil and petroleum liquids passing each chokepoint, in million barrels a day, updated March 2026. Suez includes the SUMED pipeline; the Danish Straits are drawn at the Oresund and the Turkish Straits at the Bosporus. Dates of events come from news reporting, linked in the sources.

**What this doesn't show**

- Ships that switch off their transponders are missed, and PortWatch revises past days as more signals arrive.
- Daily counts cover four chokepoints only: Hormuz, Bab el-Mandeb, Suez and the Cape of Good Hope.
- Ship counts don't say what a ship carried. Oil flows are the EIA's estimates, last updated in March 2026.

Sources: [`data/chokepoints/sources.json`](data/chokepoints/sources.json) · Data: [`data/chokepoints/`](data/chokepoints/)

## Who Owns Orbit

Objects launched come from the UN Office for Outer Space Affairs' index of objects registered by the state or organisation that launched them, or had them launched, under the UN Registration Convention. They include satellites, probes, landers, crewed spacecraft and space station parts, counted by year of launch. Rocket bodies and debris are not included. The registering state is usually the owner's home country, so a satellite built abroad but operated from the UK counts for the UK. Some objects are registered late, so recent years can still rise. Russia includes objects launched by the Soviet Union.

Objects in orbit come from the US Space Force's public catalogue: tracked payloads, rocket bodies and debris still in orbit at the end of each year. Objects that re-enter are removed, and debris smaller than about 10 cm is mostly not tracked, which is why ESA's estimates of small debris are far higher. All series come from Our World in Data's processed copies.

**What this doesn't show**

- Launch counts include satellites, probes and station parts, not rocket bodies or debris.
- Objects count for the state that registered them, usually the owner's home country, not where they were built or launched.
- Some objects are registered late, so recent years can still rise. Debris smaller than about 10 cm is mostly not tracked.

Sources: [`data/orbit/sources.json`](data/orbit/sources.json) · Data: [`data/orbit/`](data/orbit/)

## The Air We Breathe

PM2.5 exposure is the annual average concentration of fine particles, 2.5 micrometres across or smaller, weighted by where people live. It comes from Washington University's SatPM estimates, which combine satellite observations of haze, a chemical transport model and ground monitors. It includes natural dust and wildfire smoke as well as human pollution, which is why desert countries rank high. The share from human sources, with desert dust and sea salt removed, is the University of Chicago's Air Quality Life Index. WHO's own SDG 11.6.2 estimate for urban areas is shown for comparison in each country's details; it covers cities and towns, not whole countries. City monitor readings, such as IQAir's, measure air where monitors sit and can differ from these national averages.

Deaths are IHME's Global Burden of Disease 2023 estimates of deaths from all causes attributable to outdoor particulate matter, household air pollution from solid fuels, and ozone. They are modelled from exposure and the risk of disease at each level; they are not counted from death certificates. The death-rate map shows deaths from outdoor particles per 100,000 people. The WHO guideline of 5 µg/m³ was set in 2021. All series come from Our World in Data's processed copies.

**What this doesn't show**

- Exposure is a yearly average, so short spikes such as smoke episodes don't show.
- Desert dust and wildfire smoke count alongside human pollution, which is why some desert countries rank high.
- Deaths are modelled from exposure and the risk of disease at each level. They are not counted from death certificates.
- City monitors measure the air where they sit, so their readings can't be compared directly with national averages.

Sources: [`data/air/sources.json`](data/air/sources.json) · Data: [`data/air/`](data/air/)

## Food Prices & Hunger

Undernourishment is FAO's estimate of the share of people whose usual food intake doesn't give them the dietary energy they need for a normal, active life. It is modelled from national food supply, household consumption surveys and each population's age and sex, not counted person by person. Country figures are three-year averages (2023–2025); world and regional figures are for 2025. FAO doesn't publish values under 2.5%. Food insecurity comes from FAO's Food Insecurity Experience Scale, an eight-question survey of adults. All hunger and diet figures come from FAOSTAT's July 2026 release, published with *The State of Food Security and Nutrition in the World 2026*, which revises earlier years.

A healthy diet is the cheapest mix of locally available foods that meets national dietary guidelines, priced by FAO and the World Bank in 2021 international (PPP) dollars per person per day. People can't afford it when their income, after other basic needs, falls below that cost. Food inflation is the year-on-year change in each country's food consumer price index from FAOSTAT, latest month available; readings older than July 2025 are left out. World prices are the FAO Food Price Index (2014–2016 = 100), nominal monthly and real annual, and the World Bank's monthly Pink Sheet prices in nominal US dollars. Acute food insecurity and famine figures are quoted from the *Global Report on Food Crises 2026*. Food's share of household spending is the US Department of Agriculture Economic Research Service's share of consumer spending on food and non-alcoholic drinks consumed at home, from its *International Food and Alcoholic Beverage Expenditure Data* (August 2026). Each country's latest year is shown: 2025 for all but Montenegro (2022). ERS calculated 2024 and 2025 from Oxford Economics data and earlier years from Euromonitor International, so for some countries the latest figure isn't comparable with older editions. UK figures are ONS consumer price series, the DWP Family Resources Survey and the Food Foundation's Food Insecurity Tracker.

**What this doesn't show**

- Undernourishment is modelled from food supply and consumption surveys, not counted person by person. Country figures are three-year averages, so a sudden crisis shows only gradually.
- A healthy diet is priced at the cheapest foods that meet dietary guidelines. People rarely buy exactly that, so real food bills run higher.
- Food inflation is each country's latest month, mostly June 2026. A few readings are extreme, such as Iran's +130% and Palestine's −67%; they are as published by FAOSTAT.
- Acute food insecurity covers only the countries the Global Report on Food Crises analyses, so it can't be added to the undernourishment figures.

Sources: [`data/food/sources.json`](data/food/sources.json) · Data: [`data/food/`](data/food/)

## Debt vs Public Services

Debt is general government gross debt, as a share of GDP, from the IMF's *Fiscal Monitor* (October 2026). General government covers central, state and local government and social security funds. Net interest is interest paid minus interest received, worked out as the IMF's primary balance minus its overall balance. The share of revenue divides net interest by all general government revenue, including grants. For 2025 many values are IMF estimates; 2026 to 2031 are projections and are drawn dashed. The world debt series is the IMF *World Economic Outlook* aggregate.

Government health spending is domestic general government health expenditure from the WHO Global Health Expenditure Database, via the World Bank, which leaves out foreign aid and private spending; the latest year is mostly 2023. Education is government education spending from the UNESCO Institute for Statistics, via the World Bank, latest year since 2019. A country counts as paying more in interest than on health or education when its 2025 net interest, as a share of GDP, is larger than either. Population totals are the World Bank's. UNCTAD's *A World of Debt 2026* runs a similar test for developing countries only and finds 51 countries and 3.7 billion people; our count includes every country with data. External debt figures are quoted from the World Bank's *International Debt Report 2025*. UK figures are from the ONS public sector finances: central government net interest payable (NMFX), summed over each April-to-March financial year, against public sector current receipts (JW2O), and public sector net debt excluding public sector banks (HF6X).

**What this doesn't show**

- Interest is net of interest received, and for 2025 many values are IMF estimates rather than final accounts.
- Health and education spending are each country's latest year, mostly 2023, set against 2025 interest. Health counts government money only, not aid or private spending.
- General government covers central, state and local government; debts of state-owned companies are left out.
- UK interest is central government only, against receipts for the whole public sector.

Sources: [`data/debt/sources.json`](data/debt/sources.json) · Data: [`data/debt/`](data/debt/)

## Extreme Heat

Global temperature since 1850 is HadCRUT5 (version 5.2.0.0) from the Met Office Hadley Centre and the University of East Anglia. It is published against 1961–1990; we subtract its 1850–1900 average so that 0 stands for pre-industrial, which is our own rebasing and can differ by a few hundredths from figures in other datasets. Daily global temperature is Copernicus's ERA5 reanalysis from Climate Pulse, against the 1991–2020 average for the same day; the last few days are preliminary, and the chart shows monthly averages of the daily figures. Figures above pre-industrial for single months, the last twelve months and 2025 are quoted from Copernicus, ECMWF and the WMO.

Country warming is each country's 2025 average land temperature against its own 1991–2020 average, from ERA5 as processed by Our World in Data. Days above 35°C are the World Bank Climate Change Knowledge Portal's ERA5 counts, averaged over each country's area; the change compares 2025 with the 1991–2020 average. Modelled days are the CMIP6 multi-model median for 2040–2059 under SSP2-4.5 against the same models for 1995–2014. Heat deaths, injuries and lost work hours are estimates quoted from the Lancet Countdown 2025, the ILO, ISGlobal's Nature Medicine study and UKHSA. UK summers are the Met Office HadUK-Grid average of daily mean temperature for June to August; 2026 is provisional.

**What this doesn't show**

- Country warming is measured against each country's own 1991–2020 average, not pre-industrial times, so it understates the total warming since the 1800s.
- Days above 35°C are averaged over each country's whole area, so large countries with cool regions score lower than their hottest cities.
- Air temperature alone misses humidity, which makes heat far more dangerous to the body.
- Heat deaths are statistical estimates; heat is seldom recorded as a cause of death.

Sources: [`data/heat/sources.json`](data/heat/sources.json) · Data: [`data/heat/`](data/heat/)

## Critical Minerals

Mine production by country, reserves and annual prices come from the US Geological Survey's *Mineral Commodity Summaries 2026* (version 1.3, 27 May 2026). The country tables were read from the USGS chapter PDFs. Shares divide each country's 2025 estimate by USGS's rounded world total, so they can differ by a point or two from shares USGS states in its text (73% for DR Congo's cobalt, 82% for China's graphite). US lithium output is withheld, so lithium shares are of the world excluding the US; gallium is primary low-purity production; platinum is platinum alone, not all platinum-group metals. Germanium has no country table.

Refining shares are from the International Energy Agency's *Global Critical Minerals Outlook 2026* for seven minerals in 2025, and from its 2025 edition for twenty minerals in the latest year available for each. They are a work derived by Ledger Monitor from IEA material (CC BY 4.0) and are not endorsed by the IEA. Monthly copper, nickel, aluminium and tin prices are the World Bank's Pink Sheet London Metal Exchange series in nominal US dollars. Export controls are taken from the announcements of China's Ministry of Commerce, USGS and the IEA's policy database, with their status checked on 6 November 2026. Export restriction counts are from the OECD's *Inventory of Export Restrictions on Critical Raw Materials 2026*. The child labour estimate is UNICEF's from 2014, as cited by Amnesty International.

**What this doesn't show**

- Mining shares are calculated from USGS's rounded world totals, so they can differ by a point or two from shares USGS quotes in its text.
- Refining shares cover seven minerals for 2025; the twenty-mineral comparison uses the latest year available for each, which varies.
- Export controls change quickly. Their status here is as of 6 November 2026, and two Chinese suspensions end later that month.
- The child labour estimate dates from 2014 and covers all mines in southern DR Congo, not cobalt alone.

Sources: [`data/minerals/sources.json`](data/minerals/sources.json) · Data: [`data/minerals/`](data/minerals/)

## Vaccination & Health Workers

Coverage is from the WHO/UNICEF Estimates of National Immunization Coverage (WUENIC), 2025 revision, released on 15 July 2026 and downloaded from the WHO Immunization Data portal: the share of surviving infants (those alive at their first birthday) who received each vaccine. DTP1 and DTP3 are the first and third doses of the diphtheria, tetanus and pertussis vaccine; MCV1 and MCV2 the first and second doses of a measles-containing vaccine, at the age each country recommends. WHO and UNICEF re-estimate the whole series with each release; for countries that did not report 2025, the estimate is carried forward from their last informed value.

Zero-dose children are infants who did not receive a first dose of DTP vaccine. For each country we multiply the share without DTP1 by the number of surviving infants from the UN World Population Prospects 2024, as given in WHO's WUENIC country-profile file; the country figures add up to the published world total (13.47 million). Regional and world counts are the published target population minus those vaccinated. Measles and diphtheria cases are confirmed cases reported by national authorities through the WHO/UNICEF Joint Reporting Form, and measles incidence per million people is WHO's, from the portal's export of 11 June 2026. Health workers are medical doctors, and nursing and midwifery personnel, per 10,000 people, from WHO's National Health Workforce Accounts (December 2025 update) via the Global Health Observatory, latest year each country reported; regional and world figures are for 2024. Headline findings are quoted from the UNICEF and WHO release of 15 July 2026 and WHO's *State of the World's Nursing 2025*. UK figures are UKHSA's COVER annual statistics for 2025 to 2026: MMR at 24 months in England since 1988/89, MMR1, MMR2 and the pre-school booster at 5 years since 2009/10, and coverage at 5 years by UK nation; UK measles cases are those the UK reported to WHO.

**What this doesn't show**

- Coverage figures are WHO and UNICEF estimates built from countries' own reports and surveys. Each year's release revises the whole series, and fewer surveys were submitted this round, so recent years may change.
- Zero-dose means no first dose of DTP vaccine by the first birthday. A child who missed DTP but had another vaccine still counts as zero-dose.
- Measles cases are what countries confirmed and reported, not estimates of every case; 12 countries, including the United States, have no 2025 figure.
- Health worker figures are each country's latest report, mostly 2023 or 2024, and count people in the workforce, not where they work or how many hours.

Sources: [`data/vaccines/sources.json`](data/vaccines/sources.json) · Data: [`data/vaccines/`](data/vaccines/)

## Household Energy Prices & Poverty

Access to electricity and to clean cooking fuels and technologies are the shares of people with each, from the World Bank's *World Development Indicators* (updated 8 October 2026), which carry the estimates of the Tracking SDG 7 custodian agencies; the latest year is 2024. Clean cooking means mainly using electricity, gas, LPG, biogas, solar or alcohol fuels; wood, charcoal, kerosene and coal count as polluting. The number of people without access is our calculation: each country's 2024 population times the share without. Country totals add up to 655 million people without electricity, matching the figure in *Tracking SDG 7: The Energy Progress Report 2026*. World and regional headline figures are quoted from the report's joint news release of 24 June 2026.

Household prices are Eurostat's half-yearly prices for a medium consumer (electricity band DC, 2,500 to 4,999 kWh a year; gas band D2, 20 to 199 GJ a year), including all taxes and levies, in euros and in purchasing power standards, for the first half of 2026. The share of people who can't afford to keep their home adequately warm, and the share behind on utility bills, come from the EU Statistics on Income and Living Conditions (EU-SILC), for everyone and for people at risk of poverty (below 60% of median income). We show each country's latest year from 2023 on, mostly 2025, which leaves out the UK (latest Eurostat figures 2018) and Iceland.

The British price cap series is Ofgem's own recalculation of every cap period since April 2017 at the 2026 typical consumption values (2,500 kWh of electricity and 9,500 kWh of gas a year), for a dual fuel household paying by direct debit, GB average, including VAT and before levelisation, from sheet 1c of the default tariff cap level model v1.31. Ofgem's headline figure of £1,723 for October to December 2026 includes levelisation. From October 2022 to June 2023 the government's Energy Price Guarantee discounted bills, so households paid less than the cap in those periods. Fuel poverty is England's Low Income Low Energy Efficiency measure from DESNZ (*Fuel poverty trends 2026* and the *Annual fuel poverty statistics report: 2026*): a household is fuel poor if it has a low income and lives in a home rated band D or below for energy efficiency. 2025 is provisional and 2026 a projection.

**What this doesn't show**

- Access figures for 2024 are partly modelled where countries have no recent household survey, and people without access are our calculation from population.
- Household prices and cold-home figures cover only European countries; there is no open, comparable price series for the rest of the world.
- Cold homes and arrears are what people say in a survey, not measured temperatures or bills. The UK left the EU survey, so its latest Eurostat figures are from 2018 and are not shown.
- The British price cap is the most a supplier can charge a typical customer on a default tariff, not what every household pays. Fuel poverty figures cover England only, and 2025 is provisional.

Sources: [`data/energy/sources.json`](data/energy/sources.json) · Data: [`data/energy/`](data/energy/)

## Medicine Shortages & Supply

US shortages come from the FDA Drug Shortages Database through openFDA, downloaded on 6 November 2026. FDA lists each affected product presentation (strength and pack) separately; we group them by generic name and count a shortage as current when any of its presentations is listed as current. A shortage's start is the earliest date any presentation was first posted, and its length runs from then to the download date. Reasons and therapeutic categories are as FDA lists them; reasons come from each manufacturer, so one shortage can have several. The database covers medicines tracked by FDA's Center for Drug Evaluation and Research (CDER); FDA's own count of 93 ongoing shortages at the end of 2025 also includes 22 vaccine, blood and other biological product shortages tracked by CBER. New, prevented and ongoing shortages per year are quoted from the text of FDA's annual reports to Congress for 2017 to 2025; counts before 2016 cover CDER only. Manufacturing sites, inspections and the regional shares of active-ingredient sites are quoted from FDA's FY2025 Report on the State of Pharmaceutical Quality.

Trade is from UN Comtrade: each country's reported exports and imports of HS chapter 30 (pharmaceutical products: finished medicines, vaccines, blood products) and HS 2941 (antibiotics as bulk ingredients) with the world, in current US dollars, for 2024, the latest year most countries have reported; 2025 is shown where reported. Shares are of the sum of all reporting countries. Figures reported as "Other Asia, not elsewhere specified", which cover Taiwan, are left out. The EU's critical medicines are the Union list of critical medicines, version 2.1 (revision 2), grouped by the first letter of each substance's ATC code; EU shortages are EMA's public catalogue, which covers shortages EMA assesses rather than every national shortage. UK price concessions are counted from Community Pharmacy England's monthly lists, one per distinct product and pack size; the counts match the monthly totals CPE publishes. Serious Shortage Protocols in force are read from the NHS Business Services Authority's list.

**What this doesn't show**

- US shortages are those in the FDA's database of medicines it tracks; vaccines and blood products, and shortages that FDA does not list, are left out. Each shortage is a generic name, which can cover several strengths and makers.
- How long a shortage has lasted counts from when it was first posted, so a shortage that eased and came back counts as one long one.
- Trade is measured by value as each country reports it. Countries where multinationals book sales or route goods, such as Switzerland, Ireland and Belgium, look bigger than their factories, and Taiwan is missing.
- Price concessions in England show medicines pharmacies could not buy at the NHS price. They are a sign of supply problems, not a count of shortages.

Sources: [`data/medicines/sources.json`](data/medicines/sources.json) · Data: [`data/medicines/`](data/medicines/)

## Fertiliser Prices & Supply

Prices are the World Bank's Commodity Price Data (the Pink Sheet), monthly averages in nominal US dollars, updated on 3 November 2026: urea (prill, f.o.b. Middle East; f.o.b. Black Sea before March 2022), DAP (f.o.b. US Gulf), TSP (imported to the US Gulf), potassium chloride (granular, CFR Brazil), phosphate rock (f.o.b. North Africa), natural gas in Europe ($ per million British thermal units) and the World Bank fertiliser and food price indices (2010 = 100). These are international spot prices, not farm-gate prices. Affordability is the urea price divided by the US maize export price from the same file: the tonnes of maize it takes to buy a tonne of urea. Forecasts are Table 1 of the World Bank's Commodity Markets Outlook of 28 October 2026, with its April 2026 forecasts.

Use, production, imports and exports are FAOSTAT's Fertilizers by Nutrient (updated 30 July 2026), in tonnes of nitrogen (N), phosphate (P2O5) and potash (K2O), for 2024 (2022 for two countries). Use per hectare is FAO's agricultural use divided by cropland (arable land and permanent crops). Import reliance is imports minus exports of all three nutrients, as a share of agricultural use; a negative value is shown as a net exporter, and values above 100% can reflect stockbuilding, re-exports or gaps in the records. The Gulf share adds the 2024 exports of Bahrain, Iran, Kuwait, Oman, Qatar, Saudi Arabia and the United Arab Emirates. The Hormuz closure date is from Al Jazeera (27 August 2026) and the Middle East's share of urea exports and the April affordability finding from the World Bank's data blog of 14 May 2026. UK prices are Defra's agricultural price indices (2020 = 100, published 29 October 2026, to August 2026); application rates are Table GB1.1 of the British Survey of Fertiliser Practice 2025 (16 July 2026), overall rates for Great Britain averaged over all fields, including those given none.

**What this doesn't show**

- Prices are international spot prices at ports, not what farmers pay. Farm-gate prices add shipping, margins and taxes, and move later.
- FAO's use, production and trade figures mix official reports with estimates and partner countries' trade records. Some big exporters are under-recorded: FAO shows almost no exports from Iran, so the Gulf's share of nitrogen exports is likely to be higher than shown.
- The latest FAO year is 2024, before the Strait of Hormuz closed, so the country figures do not show how trade has shifted since.
- Use per hectare divides all fertiliser by cropland, which leaves out permanent grassland; in countries that fertilise a lot of grass, such as the UK and Ireland, it overstates what crops get.

Sources: [`data/fertilizer/sources.json`](data/fertilizer/sources.json) · Data: [`data/fertilizer/`](data/fertilizer/)

## The Cost of Sending Money Home

Costs come from the World Bank's Remittance Prices Worldwide (RPW): the fee and exchange-rate margin charged for sending the equivalent of $200 through each surveyed service, as a share of the amount sent. The exchange-rate margin is the gap between the rate a provider gives and the interbank rate. Global, regional (UN SDG regions), country and corridor averages are the World Bank's, as published in the UN SDG Global Database for indicator 10.c.1 (series SI_RMT_COST, SI_RMT_COST_SND, SI_RMT_COST_BC and SI_RMT_COST_SC, release 2026.Q3.G.01): simple averages over services in the third quarter of each year, 2011 to 2025, and the SmaRT average of the three cheapest qualifying services in each corridor. Averages by provider type, payment method and access point, the split between fee and margin, quarterly averages from Q2 2016 and the cheapest service in each corridor are calculated here from the complete RPW dataset (Q1 2011 to Q3 2025, updated on the World Bank Data Catalog on 23 September 2026). A service listed under two provider types counts in both; this reproduces the report's figures for banks (14.99%) and money transfer operators (4.73% against 4.72%). Q2 2025 was not collected. Headline findings are quoted from RPW Issue 54 (September 2025). Remittance flows are personal remittances received and paid (personal transfers plus compensation of employees), in current US dollars and as a share of GDP, from the World Bank's World Development Indicators (updated 8 October 2026), latest year to 2025. The 3% and 5% thresholds are SDG target 10.c.

**What this doesn't show**

- Costs are for sending the equivalent of $200 through the services the World Bank surveys in 48 sending and about 100 receiving countries. Each service counts equally, however much money goes through it.
- Most cost figures are for one quarter of each year (July to September). The World Bank did not collect prices for April to June 2025, and the dataset has no prices for money sent from Russia since 2022.
- A few corridors are recorded at more than the amount sent, such as Türkiye to Bulgaria at 118%, which suggests a data problem. They are kept in the data but left out of the charts.
- Remittance flows are those recorded in balance of payments data, in current US dollars. Money sent through informal channels is not counted, and the latest year is partly estimated.

Sources: [`data/remittances/sources.json`](data/remittances/sources.json) · Data: [`data/remittances/`](data/remittances/)

## Floods, Disasters & Insurance Gaps

Flood exposure is from Rentschler, Salhab and Jafino, *Flood exposure and poverty in 188 countries* (Nature Communications, 28 June 2022, CC BY 4.0), Supplementary Table 1: people living where a 1-in-100-year flood from rivers, heavy rain or the sea would be more than 15 cm deep (Fathom and JRC flood maps, WorldPop 2020 population), and those among them living on under $1.90, $3.20 and $5.50 a day (2011 PPP), from the World Bank's subnational poverty estimates. It describes the hazard, not the remaining risk: flood defences are not modelled and there is no climate projection. The country figures add up to the paper's totals (1.81 billion; 170 million; 780 million). The table writes 0 where the study had no poverty estimate, so a 0 at all three poverty lines is treated as missing (37 countries, including Afghanistan and Somalia), and China's $3.20 and $5.50 figures (0, below its 4.3 million under $1.90) are left out.

Displacement is the Internal Displacement Monitoring Centre's count of new internal displacements caused by disasters (Global Internal Displacement Database, event data to 2025, HDX update of 24 May 2026, CC BY-IGO), summed for each country, year and hazard; it includes pre-emptive evacuations and counts movements, not people. Per 1,000 people is the 2016 to 2025 yearly average divided by average population (World Bank WDI, SP.POP.TOTL, 8 October 2026); years without a recorded event count as zero. Deaths, people affected, economic losses and events by hazard, the deadliest events and continental shares are quoted from CRED's *2025 Disasters in Numbers* (CC BY 4.0; EM-DAT data as of 17 March 2026), which summarises the EM-DAT database. EM-DAT's own records are not republished: its terms forbid redistribution and derivative databases, and the same terms apply to the EM-DAT series on Our World in Data. Overall and insured losses are quoted from Munich Re's NatCatSERVICE (13 January and 30 July 2026) and the Swiss Re Institute's sigma 1/2026 press release (19 March 2026); averages are inflation-adjusted as published and Munich Re's figures exclude droughts and heatwaves. UK figures are the Environment Agency's National assessment of flood and coastal erosion risk in England 2024 (published 17 December 2024, updated 5 August 2026): properties in areas at high (over 3.3% a year), medium (1 to 3.3%) and low (0.1 to 1%) risk from rivers and the sea and from surface water, by region, now and with climate change; and figures quoted from the ABI (17 February 2026) and Flood Re (22 July 2026).

**What this doesn't show**

- Deaths, people affected and losses by hazard are CRED's published summary of EM-DAT, which only records disasters above a threshold (10 deaths, 100 people affected, or a call for help). Heat and drought deaths are reported late or not at all, so they are undercounted.
- Flood exposure is a 2022 model of present-day hazard on 2020 population maps. It ignores flood defences and climate change, so it shows where floods could reach, not who will be flooded.
- Displacements count movements, including evacuations before a storm; one person moved twice counts twice.
- Insured and overall losses are the reinsurers' estimates, quoted from Munich Re and Swiss Re; their figures differ, and Munich Re's leave out droughts and heatwaves.

Sources: [`data/disasters/sources.json`](data/disasters/sources.json) · Data: [`data/disasters/`](data/disasters/)

## Country profiles and comparisons

The [country pages](country/) and the [compare page](compare/) add no data of their own. They are built by `scripts/countries.mjs` from the dashboards' published country tables, joined on the ISO 3166 country code. Tables that name countries without a code (cable landing points, cloud regions and mineral refining) are matched by name, with a short list of spellings written in the script; the few names it can't match are printed when it runs and left off the profiles. A country gets a page when it has figures from at least two dashboards.

Each figure keeps its own year and source, which are shown beside it, so two figures on one page can describe different years. The rank compares the country with every country in the same table that has a value; ties share a rank, so a country with 0% coal is "highest" or "lowest" together with all the others at 0%. The bar under each figure places the country between the lowest and highest values by rank, not by size, so one extreme value doesn't squash the rest. On the compare page the bars do use size: each is scaled to the largest of the countries shown on that row.

**What this doesn't show**

- A rank says nothing about whether a value is good or bad: being "highest" is good for renewables and bad for air pollution. Read the label.
- Rankings cover different sets of countries for each figure, from fewer than ten for housing to about 240 for air and heat.
- The dashboards' own method notes, above, apply to every figure on the profiles.

Code: [`scripts/countries.mjs`](scripts/countries.mjs) · Data: [`country/profiles.json`](country/profiles.json)
