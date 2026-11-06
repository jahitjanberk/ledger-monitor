# Methodology

How Economy Monitor chooses, processes and presents its figures. Each dashboard repeats its own section of this file at the bottom of the page.

## Principles

- **Every figure is cited.** Each number on a dashboard links to the report or dataset it came from. Select a number with a dotted underline to see its source.
- **Official statistics come first.** Where none exist, survey or modelled estimates are used, and the source drawer labels each figure as *reported to authorities*, *survey estimate* or *reference*.
- **Reported and estimated figures are kept apart.** They measure different things, so they are never added together or compared one to one.
- **Every dashboard says what it leaves out.** The limitations below appear on each page.
- **The data is published.** Every table behind a dashboard is available as CSV and JSON under `data/<dashboard>/`, with a source for each row. See [DATA_LICENSE.md](DATA_LICENSE.md).

## Where the Internet Lives

Cable routes and landing points come from TeleGeography's Submarine Cable Map open data, in a public mirror whose last update was January 2021. TeleGeography publishes that data under CC BY-NC-SA 3.0, which allows reuse with credit, for non-commercial purposes, under the same licence. The headline figures for 2026 come from TeleGeography's own FAQ. Routes are stylised and don't show exact seabed paths.

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

PM2.5 exposure is the annual average concentration of fine particles, 2.5 micrometres across or smaller, weighted by where people live. It comes from Washington University's SatPM estimates, which combine satellite observations of haze, a chemical transport model and ground monitors. It includes natural dust and wildfire smoke as well as human pollution, which is why desert countries rank high. WHO's own SDG 11.6.2 estimate is shown for comparison in each country's details. City monitor readings, such as IQAir's, measure air where monitors sit and can differ from these national averages.

Deaths are IHME's Global Burden of Disease 2023 estimates of deaths from all causes attributable to outdoor particulate matter, household air pollution from solid fuels, and ozone. They are modelled from exposure and the risk of disease at each level; they are not counted from death certificates. The death-rate map shows deaths from outdoor particles per 100,000 people. The WHO guideline of 5 µg/m³ was set in 2021. All series come from Our World in Data's processed copies.

**What this doesn't show**

- Exposure is a yearly average, so short spikes such as smoke episodes don't show.
- Desert dust and wildfire smoke count alongside human pollution, which is why some desert countries rank high.
- Deaths are modelled from exposure and the risk of disease at each level. They are not counted from death certificates.
- City monitors measure the air where they sit, so their readings can't be compared directly with national averages.

Sources: [`data/air/sources.json`](data/air/sources.json) · Data: [`data/air/`](data/air/)
