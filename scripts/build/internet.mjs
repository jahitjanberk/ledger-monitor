// Builds data/internet/* and internet/assets/data.js for the Where the Internet Lives dashboard from scripts/.raw/internet
// (TeleGeography's January 2021 open-data snapshot via a GitHub mirror, Natural Earth shapes via world-atlas, Microsoft's Azure latency page).
//   node scripts/build/internet.mjs        (raw downloads in scripts/.raw/internet/, or set RAW to their parent folder)
// See scripts/build/README.md for the files each builder needs and where to download them.
// Cloud regions, supercomputers, AI compute, energy and water figures are typed in below from the pages cited in SOURCES.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const RAW_ROOT = path.resolve(process.env.RAW ?? path.join(REPO, "scripts/.raw"));
const RAW = path.join(RAW_ROOT, "internet");
const OUT = path.join(REPO, "data/internet");
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(path.join(REPO, "internet/assets"), { recursive: true });
const r1 = (v, d = 1) => (v == null || !isFinite(v) ? null : Math.round(v * 10 ** d) / 10 ** d);
const J = (f) => JSON.parse(fs.readFileSync(path.join(RAW, f), "utf8"));
const byName = (a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0);

const SOURCES = {
  "telegeography-2021": { publisher: "TeleGeography (open data, via a public GitHub mirror)", title: "Submarine Cable Map data, January 2021 snapshot", url: "https://github.com/hadistlm/submarine-cable-map", published: "2021-01", method: "reference", notes: "TeleGeography published this data under CC BY-NC-SA 3.0. The mirror's last commit is 12 January 2021; cables built since are missing." },
  "telegeography-faq": { publisher: "TeleGeography", title: "Submarine Cable Frequently Asked Questions", url: "https://www2.telegeography.com/submarine-cable-faqs-frequently-asked-questions", published: "2026", method: "reference" },
  "aws-regions": { publisher: "Amazon Web Services", title: "AWS Regions", url: "https://docs.aws.amazon.com/global-infrastructure/latest/regions/aws-regions.html", published: "2026", method: "reference" },
  "azure-regions": { publisher: "Microsoft", title: "List of Azure regions", url: "https://learn.microsoft.com/en-us/azure/reliability/regions-list", published: "2026", method: "reference" },
  "gcp-regions": { publisher: "Google Cloud", title: "Cloud Run locations", url: "https://docs.cloud.google.com/run/docs/locations", published: "2026", method: "reference", notes: "Regions where Cloud Run is offered, used as the list of Google Cloud regions." },
  "top500-2026": { publisher: "Institute of Physics Belgrade, reporting the TOP500 June 2026 list", title: "TOP500 June 2026: China Returns, Europe Expands, Exascale Competition Intensifies", url: "https://hpc.ipb.ac.rs/news/new-top500-list-2026-1", published: "2026-06", method: "reference" },
  "epoch-chips-2026": { publisher: "OfficeChai, reporting Epoch AI's AI Chip Imports explorer", title: "The US's share of new compute has risen from 60% in 2024 to 78% in first half of 2026", url: "https://officechai.com/ai/the-uss-share-of-new-compute-has-risen-from-60-in-2024-to-78-in-first-half-of-2026/", published: "2026-10-28", method: "reference" },
  "epoch-clusters-2025": { publisher: "Epoch AI", title: "The US hosts the majority of GPU cluster performance, followed by China", url: "https://epoch.ai/data-insights/ai-supercomputers-performance-share-by-country", published: "2025-06-05", method: "reference" },
  "iea-energy-ai": { publisher: "NS Energy, reporting the IEA's Energy and AI report", title: "Energy and AI: key findings from the IEA", url: "https://www.nsenergybusiness.com/analysis/energy-and-ai-key-findings-from-the-iea/", published: "2025-04", method: "reported" },
  "lbnl-2024": { publisher: "Lawrence Berkeley National Laboratory", title: "2024 United States Data Center Energy Usage Report", url: "https://climate.mit.edu/sites/default/files/2025-02/lbnl-2024-united-states-data-center-energy-usage-report.pdf", published: "2024-12-19", method: "reported" },
  "lbnl-water": { publisher: "Civil Beat (The Conversation), reporting LBNL and company reports", title: "Data centers consume massive amounts of water — companies rarely say exactly how much", url: "https://www.civilbeat.org/2025/08/data-centers-consume-massive-amounts-of-water-companies-rarely-say-exactly-how-much/", published: "2025-08", method: "reported" },
  "cso-2024": { publisher: "Central Statistics Office, Ireland", title: "Data Centres Metered Electricity Consumption 2024", url: "https://www.cso.ie/en/releasesandpublications/ep/p-dcmec/datacentresmeteredelectricityconsumption2024", published: "2025-06-10", method: "reported" },
  "cso-2025": { publisher: "Irish Examiner, reporting the CSO", title: "Data centres accounted for 23% of all Ireland's electricity usage last year", url: "https://www.irishexaminer.com/business/companies/arid-41875214.html", published: "2026-07-07", method: "reported" },
  "geonames": { publisher: "GeoNames (via the all-the-cities package)", title: "GeoNames cities with population over 1,000", url: "https://www.geonames.org/", published: "2026", method: "reference", notes: "Used only to place regions and sites on the map." },
  "azure-latency": { publisher: "Microsoft", title: "Azure network round-trip latency statistics", url: "https://learn.microsoft.com/en-us/azure/networking/azure-network-latency", published: "2026-07-30", method: "reported", notes: "P50 of round trips sampled every minute over the 30 days to 30 July 2026." },
  "natural-earth": { publisher: "Natural Earth (via the world-atlas package)", title: "Admin 0 countries, 1:110m", url: "https://www.naturalearthdata.com/", published: "2026", method: "reference", notes: "Public domain. Used to match countries to map shapes." },
};
const ENERGY = [
  { metric: "global_2024_twh", label: "Global data centre use, 2024", value: 415, unit: "TWh", source: "iea-energy-ai" },
  { metric: "global_2024_share", label: "Share of world electricity, 2024", value: 0.015, unit: "share", source: "iea-energy-ai" },
  { metric: "global_2030_twh", label: "Global projection, 2030", value: 945, unit: "TWh", source: "iea-energy-ai" },
  { metric: "share_us", label: "United States share of global data centre use, 2024", value: 0.45, unit: "share", source: "iea-energy-ai" },
  { metric: "share_china", label: "China share, 2024", value: 0.25, unit: "share", source: "iea-energy-ai" },
  { metric: "share_europe", label: "Europe share, 2024", value: 0.15, unit: "share", source: "iea-energy-ai" },
  { metric: "us_2018_twh", label: "US data centres, 2018", value: 76, unit: "TWh", source: "lbnl-2024" },
  { metric: "us_2018_share", label: "Share of US electricity, 2018", value: 0.019, unit: "share", source: "lbnl-2024" },
  { metric: "us_2023_twh", label: "US data centres, 2023", value: 176, unit: "TWh", source: "lbnl-2024" },
  { metric: "us_2023_share", label: "Share of US electricity, 2023", value: 0.044, unit: "share", source: "lbnl-2024" },
  { metric: "us_2028_low_twh", label: "US projection 2028, low", value: 325, unit: "TWh", source: "lbnl-2024" },
  { metric: "us_2028_high_twh", label: "US projection 2028, high", value: 580, unit: "TWh", source: "lbnl-2024" },
  { metric: "us_2028_low_share", label: "Share of US electricity 2028, low", value: 0.067, unit: "share", source: "lbnl-2024" },
  { metric: "us_2028_high_share", label: "Share of US electricity 2028, high", value: 0.12, unit: "share", source: "lbnl-2024" },
  { metric: "ie_2015_share", label: "Ireland: data centres' share of metered electricity, 2015", value: 0.05, unit: "share", source: "cso-2024" },
  { metric: "ie_2024_share", label: "Ireland, 2024", value: 0.22, unit: "share", source: "cso-2024" },
  { metric: "ie_2025_share", label: "Ireland, 2025", value: 0.23, unit: "share", source: "cso-2025" },
  { metric: "ie_2024_gwh", label: "Ireland data centres, 2024", value: 6973, unit: "GWh", source: "cso-2025" },
  { metric: "ie_2025_gwh", label: "Ireland data centres, 2025", value: 7663, unit: "GWh", source: "cso-2025" },
];
const WATER = [
  { metric: "us_direct_2023_l", label: "US data centres, direct (cooling), 2023", value: 64000000000, unit: "litres", source: "lbnl-water" },
  { metric: "us_direct_2023_gal", label: "US data centres, direct (cooling), 2023", value: 17000000000, unit: "US gallons", source: "lbnl-water" },
  { metric: "us_indirect_2023_l", label: "US data centres, indirect (power generation), 2023", value: 800000000000, unit: "litres", source: "lbnl-water" },
  { metric: "us_indirect_2023_gal", label: "US data centres, indirect (power generation), 2023", value: 211000000000, unit: "US gallons", source: "lbnl-water" },
  { metric: "google_dc_2023_l", label: "Google data centres, 2023", value: 23100000000, unit: "litres", source: "lbnl-water" },
  { metric: "meta_dc_2023_l", label: "Meta data centres, 2023", value: 2900000000, unit: "litres", source: "lbnl-water" },
];
const CABLES_NOW = [
  { metric: "cables_tracked", label: "Active and planned cables tracked, 2026", value: 600, unit: "cables (more than)", source: "telegeography-faq" },
  { metric: "km_in_service", label: "Cable in service, early 2026", value: 1500000, unit: "km (over)", source: "telegeography-faq" },
];
const AI_COMPUTE = [
  { country: "United States", share: 0.722, source: "epoch-chips-2026" },
  { country: "China", share: 0.096, source: "epoch-chips-2026" },
  { country: "European Union", share: 0.051, source: "epoch-chips-2026" },
  { country: "Malaysia", share: 0.024, source: "epoch-chips-2026" },
  { country: "India", share: 0.016, source: "epoch-chips-2026" },
  { country: "Japan", share: 0.016, source: "epoch-chips-2026" },
  { country: "Rest of world", share: 0.075, source: "epoch-chips-2026" },
];
const AI_CLUSTERS = [
  { country: "United States", share: 0.75, source: "epoch-clusters-2025" },
  { country: "China", share: 0.15, source: "epoch-clusters-2025" },
];
const TOP500_COUNTRIES = [
  { country: "United States", systems: 162, source: "top500-2026" },
  { country: "Japan", systems: 44, source: "top500-2026" },
  { country: "Germany", systems: 41, source: "top500-2026" },
  { country: "China", systems: 30, source: "top500-2026" },
];
const SUPERCOMPUTERS = [
  { rank: 1, system: "LineShine", site: "National Supercomputing Center in Shenzhen", country: "China", lon: 114.07, lat: 22.55, rmax_eflops: 2.198, source: "top500-2026", geo_source: "geonames" },
  { rank: 2, system: "El Capitan", site: "Lawrence Livermore National Laboratory", country: "United States", lon: -121.77, lat: 37.68, rmax_eflops: 1.8, source: "top500-2026", geo_source: "geonames" },
  { rank: 5, system: "JUPITER Booster", site: "Jülich Supercomputing Centre", country: "Germany", lon: 6.36, lat: 50.92, rmax_eflops: null, source: "top500-2026", geo_source: "geonames" },
  { rank: 9, system: "Fugaku", site: "RIKEN Center for Computational Science", country: "Japan", lon: 135.18, lat: 34.69, rmax_eflops: null, source: "top500-2026", geo_source: "geonames" },
  { rank: 10, system: "Alps", site: "Swiss National Supercomputing Centre (CSCS)", country: "Switzerland", lon: 8.96, lat: 46.01, rmax_eflops: null, source: "top500-2026", geo_source: "geonames" },
];
// provider, code, name, location, country, status, lon, lat, source, geo_source
const CLOUD_REGIONS = [
  ["AWS","us-east-1","US East (N. Virginia)","N. Virginia","United States","available",-77.49,39.04,"aws-regions","geonames"],
  ["AWS","us-east-2","US East (Ohio)","Ohio","United States","available",-83,39.96,"aws-regions","geonames"],
  ["AWS","us-west-1","US West (N. California)","N. California","United States","available",-121.89,37.34,"aws-regions","geonames"],
  ["AWS","us-west-2","US West (Oregon)","Oregon","United States","available",-122.68,45.52,"aws-regions","geonames"],
  ["AWS","af-south-1","Africa (Cape Town)","Cape Town","South Africa","available",18.42,-33.93,"aws-regions","geonames"],
  ["AWS","ap-east-1","Asia Pacific (Hong Kong)","Hong Kong","Hong Kong","available",114.17,22.28,"aws-regions","geonames"],
  ["AWS","ap-south-2","Asia Pacific (Hyderabad)","Hyderabad","India","available",78.46,17.38,"aws-regions","geonames"],
  ["AWS","ap-southeast-3","Asia Pacific (Jakarta)","Jakarta","Indonesia","available",106.85,-6.21,"aws-regions","geonames"],
  ["AWS","ap-southeast-5","Asia Pacific (Malaysia)","Malaysia","Malaysia","available",101.69,3.14,"aws-regions","geonames"],
  ["AWS","ap-southeast-4","Asia Pacific (Melbourne)","Melbourne","Australia","available",144.96,-37.81,"aws-regions","geonames"],
  ["AWS","ap-south-1","Asia Pacific (Mumbai)","Mumbai","India","available",72.88,19.07,"aws-regions","geonames"],
  ["AWS","ap-southeast-6","Asia Pacific (New Zealand)","New Zealand","New Zealand","available",174.76,-36.85,"aws-regions","geonames"],
  ["AWS","ap-northeast-3","Asia Pacific (Osaka)","Osaka","Japan","available",135.5,34.69,"aws-regions","geonames"],
  ["AWS","ap-northeast-2","Asia Pacific (Seoul)","Seoul","South Korea","available",126.98,37.57,"aws-regions","geonames"],
  ["AWS","ap-southeast-1","Asia Pacific (Singapore)","Singapore","Singapore","available",103.85,1.29,"aws-regions","geonames"],
  ["AWS","ap-southeast-2","Asia Pacific (Sydney)","Sydney","Australia","available",151.21,-33.87,"aws-regions","geonames"],
  ["AWS","ap-east-2","Asia Pacific (Taipei)","Taipei","Taiwan","available",121.53,25.05,"aws-regions","geonames"],
  ["AWS","ap-southeast-7","Asia Pacific (Thailand)","Thailand","Thailand","available",100.5,13.75,"aws-regions","geonames"],
  ["AWS","ap-northeast-1","Asia Pacific (Tokyo)","Tokyo","Japan","available",139.69,35.69,"aws-regions","geonames"],
  ["AWS","ca-central-1","Canada (Central)","Central Canada","Canada","available",-73.59,45.51,"aws-regions","geonames"],
  ["AWS","ca-west-1","Canada West (Calgary)","Calgary","Canada","available",-114.09,51.05,"aws-regions","geonames"],
  ["AWS","eu-central-1","Europe (Frankfurt)","Frankfurt","Germany","available",8.68,50.12,"aws-regions","geonames"],
  ["AWS","eu-west-1","Europe (Ireland)","Ireland","Ireland","available",-6.25,53.33,"aws-regions","geonames"],
  ["AWS","eu-west-2","Europe (London)","London","United Kingdom","available",-0.13,51.51,"aws-regions","geonames"],
  ["AWS","eu-south-1","Europe (Milan)","Milan","Italy","available",9.19,45.46,"aws-regions","geonames"],
  ["AWS","eu-west-3","Europe (Paris)","Paris","France","available",2.35,48.85,"aws-regions","geonames"],
  ["AWS","eu-south-2","Europe (Spain)","Spain","Spain","available",-0.88,41.66,"aws-regions","geonames"],
  ["AWS","eu-north-1","Europe (Stockholm)","Stockholm","Sweden","available",18.07,59.33,"aws-regions","geonames"],
  ["AWS","eu-central-2","Europe (Zurich)","Zurich","Switzerland","available",8.55,47.37,"aws-regions","geonames"],
  ["AWS","il-central-1","Israel (Tel Aviv)","Tel Aviv","Israel","available",34.78,32.08,"aws-regions","geonames"],
  ["AWS","mx-central-1","Mexico (Central)","Central Mexico","Mexico","available",-92.76,15.84,"aws-regions","geonames"],
  ["AWS","me-south-1","Middle East (Bahrain)","Bahrain","Bahrain","available",50.59,26.23,"aws-regions","geonames"],
  ["AWS","me-central-1","Middle East (UAE)","UAE","United Arab Emirates","available",55.31,25.08,"aws-regions","geonames"],
  ["AWS","sa-east-1","South America (São Paulo)","São Paulo","Brazil","available",-46.64,-23.55,"aws-regions","geonames"],
  ["Azure","australiacentral","Australia Central","Canberra","Australia","available",149.13,-35.28,"azure-regions","geonames"],
  ["Azure","australiacentral2","Australia Central 2","Canberra","Australia","restricted",149.13,-35.28,"azure-regions","geonames"],
  ["Azure","australiaeast","Australia East","New South Wales","Australia","available",151.21,-33.87,"azure-regions","geonames"],
  ["Azure","australiasoutheast","Australia Southeast","Victoria","Australia","available",144.96,-37.81,"azure-regions","geonames"],
  ["Azure","austriaeast","Austria East","Vienna","Austria","available",16.37,48.21,"azure-regions","geonames"],
  ["Azure","belgiumcentral","Belgium Central","Brussels","Belgium","available",4.35,50.85,"azure-regions","geonames"],
  ["Azure","brazilsouth","Brazil South","Sao Paulo State","Brazil","available",-46.64,-23.55,"azure-regions","geonames"],
  ["Azure","brazilsoutheast","Brazil Southeast","Rio","Brazil","restricted",-43.18,-22.91,"azure-regions","geonames"],
  ["Azure","canadacentral","Canada Central","Toronto","Canada","available",-79.42,43.7,"azure-regions","geonames"],
  ["Azure","canadaeast","Canada East","Quebec","Canada","available",-71.21,46.81,"azure-regions","geonames"],
  ["Azure","centralindia","Central India","Pune","India","available",73.86,18.52,"azure-regions","geonames"],
  ["Azure","centralus","Central US","Iowa","United States","available",-93.61,41.6,"azure-regions","geonames"],
  ["Azure","chilecentral","Chile Central","Santiago","Chile","available",-70.65,-33.46,"azure-regions","geonames"],
  ["Azure","denmarkeast","Denmark East","Copenhagen","Denmark","available",12.57,55.68,"azure-regions","geonames"],
  ["Azure","eastasia","East Asia","Hong Kong","Hong Kong","available",114.17,22.28,"azure-regions","geonames"],
  ["Azure","eastus","East US","Virginia","United States","available",-77.49,39.04,"azure-regions","geonames"],
  ["Azure","eastus2","East US 2","Virginia","United States","available",-77.46,37.55,"azure-regions","geonames"],
  ["Azure","francecentral","France Central","Paris","France","available",2.35,48.85,"azure-regions","geonames"],
  ["Azure","francesouth","France South","Marseille","France","restricted",5.38,43.3,"azure-regions","geonames"],
  ["Azure","germanynorth","Germany North","Berlin","Germany","restricted",13.41,52.52,"azure-regions","geonames"],
  ["Azure","germanywestcentral","Germany West Central","Frankfurt","Germany","available",8.68,50.12,"azure-regions","geonames"],
  ["Azure","indiasouthcentral","India South Central","Hyderabad","India","available",78.46,17.38,"azure-regions","geonames"],
  ["Azure","indonesiacentral","Indonesia Central","Jakarta","Indonesia","available",106.85,-6.21,"azure-regions","geonames"],
  ["Azure","israelcentral","Israel Central","Israel","Israel","available",34.78,32.08,"azure-regions","geonames"],
  ["Azure","italynorth","Italy North","Milan","Italy","available",9.19,45.46,"azure-regions","geonames"],
  ["Azure","japaneast","Japan East","Tokyo, Saitama","Japan","available",139.69,35.69,"azure-regions","geonames"],
  ["Azure","japanwest","Japan West","Osaka","Japan","available",135.5,34.69,"azure-regions","geonames"],
  ["Azure","koreacentral","Korea Central","Seoul","South Korea","available",126.98,37.57,"azure-regions","geonames"],
  ["Azure","koreasouth","Korea South","Busan","South Korea","available",129.03,35.1,"azure-regions","geonames"],
  ["Azure","malaysiawest","Malaysia West","Kuala Lumpur","Malaysia","available",101.69,3.14,"azure-regions","geonames"],
  ["Azure","mexicocentral","Mexico Central","Querétaro State","Mexico","available",-92.76,15.84,"azure-regions","geonames"],
  ["Azure","newzealandnorth","New Zealand North","Auckland","New Zealand","available",174.76,-36.85,"azure-regions","geonames"],
  ["Azure","northcentralus","North Central US","Illinois","United States","available",-87.65,41.85,"azure-regions","geonames"],
  ["Azure","northeurope","North Europe","Ireland","Ireland","available",-6.25,53.33,"azure-regions","geonames"],
  ["Azure","norwayeast","Norway East","Norway","Norway","available",10.75,59.91,"azure-regions","geonames"],
  ["Azure","norwaywest","Norway West","Norway","Norway","restricted",5.73,58.97,"azure-regions","geonames"],
  ["Azure","polandcentral","Poland Central","Warsaw","Poland","available",21.01,52.23,"azure-regions","geonames"],
  ["Azure","qatarcentral","Qatar Central","Doha","Qatar","available",51.53,25.29,"azure-regions","geonames"],
  ["Azure","southafricanorth","South Africa North","Johannesburg","South Africa","available",28.04,-26.2,"azure-regions","geonames"],
  ["Azure","southafricawest","South Africa West","Cape Town","South Africa","restricted",18.42,-33.93,"azure-regions","geonames"],
  ["Azure","southcentralus","South Central US","Texas","United States","available",-98.49,29.42,"azure-regions","geonames"],
  ["Azure","southindia","South India","Chennai","India","available",80.28,13.09,"azure-regions","geonames"],
  ["Azure","southeastasia","Southeast Asia","Singapore","Singapore","available",103.85,1.29,"azure-regions","geonames"],
  ["Azure","southeastasia3","Southeast Asia 3","Johor Bahru","Malaysia","preview",103.76,1.47,"azure-regions","geonames"],
  ["Azure","spaincentral","Spain Central","Madrid","Spain","available",-3.7,40.42,"azure-regions","geonames"],
  ["Azure","swedencentral","Sweden Central","Gävle","Sweden","available",17.14,60.67,"azure-regions","geonames"],
  ["Azure","switzerlandnorth","Switzerland North","Zurich","Switzerland","available",8.55,47.37,"azure-regions","geonames"],
  ["Azure","switzerlandwest","Switzerland West","Geneva","Switzerland","restricted",6.14,46.2,"azure-regions","geonames"],
  ["Azure","taiwannorth","Taiwan North","Taipei","Taiwan","preview",121.53,25.05,"azure-regions","geonames"],
  ["Azure","uaecentral","UAE Central","Abu Dhabi","United Arab Emirates","restricted",54.4,24.45,"azure-regions","geonames"],
  ["Azure","uaenorth","UAE North","Dubai","United Arab Emirates","available",55.31,25.08,"azure-regions","geonames"],
  ["Azure","uksouth","UK South","London","United Kingdom","available",-0.13,51.51,"azure-regions","geonames"],
  ["Azure","ukwest","UK West","Cardiff","United Kingdom","available",-3.18,51.48,"azure-regions","geonames"],
  ["Azure","westcentralus","West Central US","Wyoming","United States","available",-104.82,41.14,"azure-regions","geonames"],
  ["Azure","westeurope","West Europe","Netherlands","Netherlands","available",4.89,52.37,"azure-regions","geonames"],
  ["Azure","westindia","West India","Mumbai","India","available",72.88,19.07,"azure-regions","geonames"],
  ["Azure","westus","West US","California","United States","available",-122.42,37.77,"azure-regions","geonames"],
  ["Azure","westus2","West US 2","Washington","United States","available",-122.33,47.61,"azure-regions","geonames"],
  ["Azure","westus3","West US 3","Phoenix","United States","available",-112.07,33.45,"azure-regions","geonames"],
  ["Google Cloud","asia-east1","asia-east1","Taiwan","Taiwan","available",120.54,24.08,"gcp-regions","geonames"],
  ["Google Cloud","asia-northeast1","asia-northeast1","Tokyo","Japan","available",139.69,35.69,"gcp-regions","geonames"],
  ["Google Cloud","asia-northeast2","asia-northeast2","Osaka","Japan","available",135.5,34.69,"gcp-regions","geonames"],
  ["Google Cloud","asia-south1","asia-south1","Mumbai, India","India","available",72.88,19.07,"gcp-regions","geonames"],
  ["Google Cloud","asia-southeast3","asia-southeast3","Bangkok","Thailand","available",100.5,13.75,"gcp-regions","geonames"],
  ["Google Cloud","europe-north1","europe-north1","Finland","Finland","available",27.2,60.57,"gcp-regions","geonames"],
  ["Google Cloud","europe-north2","europe-north2","Stockholm","Sweden","available",18.07,59.33,"gcp-regions","geonames"],
  ["Google Cloud","europe-southwest1","europe-southwest1","Madrid","Spain","available",-3.7,40.42,"gcp-regions","geonames"],
  ["Google Cloud","europe-west1","europe-west1","Belgium","Belgium","available",3.82,50.45,"gcp-regions","geonames"],
  ["Google Cloud","europe-west4","europe-west4","Netherlands","Netherlands","available",6.57,53.22,"gcp-regions","geonames"],
  ["Google Cloud","europe-west8","europe-west8","Milan","Italy","available",9.19,45.46,"gcp-regions","geonames"],
  ["Google Cloud","europe-west9","europe-west9","Paris","France","available",2.35,48.85,"gcp-regions","geonames"],
  ["Google Cloud","me-west1","me-west1","Tel Aviv","Israel","available",34.78,32.08,"gcp-regions","geonames"],
  ["Google Cloud","northamerica-south1","northamerica-south1","Mexico","Mexico","available",-92.76,15.84,"gcp-regions","geonames"],
  ["Google Cloud","us-central1","us-central1","Iowa","United States","available",-95.86,41.26,"gcp-regions","geonames"],
  ["Google Cloud","us-east1","us-east1","South Carolina","United States","available",-80.01,33.2,"gcp-regions","geonames"],
  ["Google Cloud","us-east4","us-east4","Northern Virginia","United States","available",-77.49,39.04,"gcp-regions","geonames"],
  ["Google Cloud","us-east5","us-east5","Columbus","United States","available",-83,39.96,"gcp-regions","geonames"],
  ["Google Cloud","us-south1","us-south1","Dallas","United States","available",-96.81,32.78,"gcp-regions","geonames"],
  ["Google Cloud","us-west1","us-west1","Oregon","United States","available",-121.18,45.59,"gcp-regions","geonames"],
  ["Google Cloud","africa-south1","africa-south1","Johannesburg","South Africa","available",28.04,-26.2,"gcp-regions","geonames"],
  ["Google Cloud","asia-east2","asia-east2","Hong Kong","Hong Kong","available",114.17,22.28,"gcp-regions","geonames"],
  ["Google Cloud","asia-northeast3","asia-northeast3","Seoul, South Korea","South Korea","available",126.98,37.57,"gcp-regions","geonames"],
  ["Google Cloud","asia-southeast1","asia-southeast1","Singapore","Singapore","available",103.85,1.29,"gcp-regions","geonames"],
  ["Google Cloud","asia-southeast2","asia-southeast2","Jakarta","Indonesia","available",106.85,-6.21,"gcp-regions","geonames"],
  ["Google Cloud","asia-south2","asia-south2","Delhi, India","India","available",77.22,28.64,"gcp-regions","geonames"],
  ["Google Cloud","australia-southeast1","australia-southeast1","Sydney","Australia","available",151.21,-33.87,"gcp-regions","geonames"],
  ["Google Cloud","australia-southeast2","australia-southeast2","Melbourne","Australia","available",144.96,-37.81,"gcp-regions","geonames"],
  ["Google Cloud","europe-central2","europe-central2","Warsaw, Poland","Poland","available",21.01,52.23,"gcp-regions","geonames"],
  ["Google Cloud","europe-west10","europe-west10","Berlin","Germany","available",13.41,52.52,"gcp-regions","geonames"],
  ["Google Cloud","europe-west12","europe-west12","Turin","Italy","available",7.69,45.07,"gcp-regions","geonames"],
  ["Google Cloud","europe-west2","europe-west2","London, UK","United Kingdom","available",-0.13,51.51,"gcp-regions","geonames"],
  ["Google Cloud","europe-west3","europe-west3","Frankfurt, Germany","Germany","available",8.68,50.12,"gcp-regions","geonames"],
  ["Google Cloud","europe-west6","europe-west6","Zurich, Switzerland","Switzerland","available",8.55,47.37,"gcp-regions","geonames"],
  ["Google Cloud","me-central1","me-central1","Doha","Qatar","available",51.53,25.29,"gcp-regions","geonames"],
  ["Google Cloud","me-central2","me-central2","Dammam","Saudi Arabia","available",50.1,26.43,"gcp-regions","geonames"],
  ["Google Cloud","northamerica-northeast1","northamerica-northeast1","Montreal","Canada","available",-73.59,45.51,"gcp-regions","geonames"],
  ["Google Cloud","northamerica-northeast2","northamerica-northeast2","Toronto","Canada","available",-79.42,43.7,"gcp-regions","geonames"],
  ["Google Cloud","southamerica-east1","southamerica-east1","Sao Paulo, Brazil","Brazil","available",-46.64,-23.55,"gcp-regions","geonames"],
  ["Google Cloud","southamerica-west1","southamerica-west1","Santiago, Chile","Chile","available",-70.65,-33.46,"gcp-regions","geonames"],
  ["Google Cloud","us-west2","us-west2","Los Angeles","United States","available",-118.24,34.05,"gcp-regions","geonames"],
  ["Google Cloud","us-west3","us-west3","Salt Lake City","United States","available",-111.89,40.76,"gcp-regions","geonames"],
  ["Google Cloud","us-west4","us-west4","Las Vegas","United States","available",-115.14,36.17,"gcp-regions","geonames"],
];

// ---------- TeleGeography 2021 snapshot ----------
// One file per cable in tg2021/cable/. The mirror also keeps all.json (an index) and a copy of cable-geo.json there; skip both.
const CABLE_DIR = path.join(RAW, "tg2021/cable");
const cableFiles = fs.readdirSync(CABLE_DIR).filter((f) => f.endsWith(".json") && f !== "all.json" && f !== "cable-geo.json").sort();
// Landing point names are "Place, Country" or "Place, State, Country"; two country names contain a comma.
const countryOf = (name) => {
  const p = name.split(", ");
  return /^(Dem\. )?Rep\.$/.test(p.at(-1)) ? p.slice(-2).join(", ") : p.at(-1);
};
// "37,000 km", "97.8 km" or "n.a."
const parseKm = (s) => {
  const m = s == null ? null : String(s).replace(/,/g, "").match(/\d+(\.\d+)?/);
  return m ? +m[0] : null;
};
const cables = [], landingMap = new Map(), names = new Map();
for (const f of cableFiles) {
  const c = J(path.join("tg2021/cable", f));
  names.set(c.id, c.name);
  for (const p of c.landing_points) {
    const [lat, lon] = p.latlon.split(",").map(Number);
    // A landing point shared by several cables can carry slightly different coordinates in each file (under 1 km apart); the last file wins.
    landingMap.set(p.id, { name: p.name, country: countryOf(p.name), lon: r1(lon, 3), lat: r1(lat, 3), source: "telegeography-2021" });
  }
  const countries = [...new Set(c.landing_points.map((p) => countryOf(p.name)))].sort();
  const owners = c.owners == null ? [] : c.owners.split(",").map((s) => s.trim()).filter(Boolean);
  cables.push({
    id: c.id, name: c.name, length_km: parseKm(c.length), rfs: c.rfs ?? null, landings: c.landing_points.length, source: "telegeography-2021",
    owners: owners.length ? owners.join(", ") : null, countries: countries.length ? countries.join("|") : null,
  });
}
cables.sort(byName);
const landings = [...landingMap.values()].sort(byName);
// all.json spells one id differently from its file (sabastatia, saba-statia); cable-geo.json uses the all.json ids.
for (const a of J("tg2021/cable/all.json")) if (!names.has(a.id)) names.set(a.id, a.name);
// Coordinates to 2 decimals (about 1 km), dropping points that then repeat the one before.
const rnd = (c) => (typeof c[0] === "number" ? c.map((v) => r1(v, 2)) : c.map(rnd));
const line = (l) => rnd(l).filter((p, i, a) => i === 0 || p[0] !== a[i - 1][0] || p[1] !== a[i - 1][1]);
const geom = (g) => ({ type: g.type, coordinates: g.type === "MultiLineString" ? g.coordinates.map(line) : g.type === "LineString" ? line(g.coordinates) : rnd(g.coordinates) });
const routes = J("tg2021/cable-geo.json").features.map((f) => ({
  type: "Feature",
  properties: { id: f.properties.slug, name: names.get(f.properties.slug) ?? null },
  geometry: geom(f.geometry),
}));

const COLS = ["provider", "code", "name", "location", "country", "status", "lon", "lat", "source", "geo_source"];
const cloud_regions = CLOUD_REGIONS.map((r) => Object.fromEntries(COLS.map((k, i) => [k, r[i]])));

// ---------- Countries matched to Natural Earth 1:110m shapes (world-atlas) ----------
const NE = new Map(J("countries-110m.json").objects.countries.geometries.filter((g) => g.id).map((g) => [g.properties.name, g.id]));
const NE_ALIAS = {
  "Congo, Dem. Rep.": "Dem. Rep. Congo", "Congo, Rep.": "Congo", "Dominican Republic": "Dominican Rep.",
  "Equatorial Guinea": "Eq. Guinea", "Solomon Islands": "Solomon Is.", "United States": "United States of America",
};
// Every country with a cable landing, a cloud region or a listed supercomputer, so each can be found on the map and in profiles.
const countries = [...new Set([...cables.flatMap((c) => (c.countries ? c.countries.split("|") : [])), ...cloud_regions.map((r) => r.country), ...SUPERCOMPUTERS.map((r) => r.country)])].sort().map((country) => {
  const map_name = NE_ALIAS[country] ?? country;
  const iso_n3 = NE.get(map_name) ?? null;
  return { country, iso_n3, map_name: iso_n3 ? map_name : null, source: "natural-earth" };
});

// ---------- Azure latency (P50 round trip, ms) from the tables on Microsoft's page: row = source, column = destination ----------
const AZURE_FROM = ["uksouth", "westeurope", "northeurope", "eastus", "westus2", "southeastasia", "japaneast", "australiaeast", "brazilsouth", "southafricanorth", "centralindia"];
const azHtml = fs.readFileSync(path.join(RAW, "azure-network-latency.html"), "utf8");
const strip = (x) => x.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();
const azCode = (n) => n.toLowerCase().replace(/\s+/g, "");
const azM = new Map(), azName = new Map();
for (const [t] of azHtml.matchAll(/<table[\s\S]*?<\/table>/g)) {
  const rows = [...t.matchAll(/<tr[\s\S]*?<\/tr>/g)].map(([r]) => [...r.matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map((c) => strip(c[1])));
  const head = rows[0];
  for (const row of rows.slice(1)) for (let j = 1; j < head.length; j++) {
    azName.set(azCode(row[0]), row[0]);
    azName.set(azCode(head[j]), head[j]);
    if (row[j] !== "") azM.set(`${azCode(row[0])}>${azCode(head[j])}`, +row[j]);
  }
}
const azure_latency = [];
for (const a of AZURE_FROM) for (const b of AZURE_FROM) {
  if (a === b) continue;
  const v = azM.get(`${a}>${b}`);
  if (v == null) throw new Error(`Azure latency ${a} to ${b} is missing from the page`);
  azure_latency.push({ from_code: a, from_name: azName.get(a), to_code: b, to_name: azName.get(b), rtt_ms: v, source: "azure-latency" });
}


const TABLES = [
  ["ai_clusters", "GPU cluster performance", "Share of global GPU cluster (AI supercomputer) performance by country, May 2025, from Epoch AI. The US share is published as about three quarters.", AI_CLUSTERS],
  ["ai_compute", "AI compute by country", "Share of AI chip compute (H100-equivalents) acquired since 2022, as of Q2 2026, from Epoch AI's AI Chip Imports explorer.", AI_COMPUTE],
  ["azure_latency", "Azure measured latency", "Median (P50) round-trip latency between Azure regions over the 30 days to 30 July 2026, measured by Azure's backbone probes. Latency is directional.", azure_latency],
  ["cables", "Submarine cables (2021 snapshot)", "Cable systems in TeleGeography's Submarine Cable Map as of its January 2021 open-data snapshot: length, ready-for-service year, owners and the countries each one lands in (separated by |).", cables],
  ["cables_now", "Submarine cables today", "TeleGeography's current headline figures for the global submarine cable network.", CABLES_NOW],
  ["cloud_regions", "Cloud regions", "AWS, Azure and Google Cloud regions as listed by each provider, plotted at a representative city in the named area.", cloud_regions],
  ["countries", "Country codes", "Countries in the cable data matched to Natural Earth map shapes (ISO 3166 numeric). Small islands have no shape at this map scale.", countries],
  ["energy", "Data centre electricity", "Electricity used by data centres: global and regional (IEA), United States (LBNL) and Ireland (CSO).", ENERGY],
  ["landings", "Cable landing points (2021 snapshot)", "Landing points in TeleGeography's January 2021 open-data snapshot.", landings],
  ["supercomputers", "Top supercomputers", "Systems from the June 2026 TOP500 top ten whose site is named in the source.", SUPERCOMPUTERS],
  ["top500_countries", "TOP500 systems by country", "Number of systems on the June 2026 TOP500 list.", TOP500_COUNTRIES],
  ["water", "Data centre water", "Water consumed by data centres in the United States (LBNL estimate) and by Google and Meta's data centres, 2023.", WATER],
];
const csvCell = (v) => (v == null ? "" : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
for (const [id, title, description, records] of TABLES) {
  const keys = [...new Set(records.flatMap((r) => Object.keys(r)))];
  fs.writeFileSync(path.join(OUT, `${id}.csv`), [keys.join(","), ...records.map((r) => keys.map((k) => csvCell(r[k])).join(","))].join("\n") + "\n");
  fs.writeFileSync(path.join(OUT, `${id}.json`), JSON.stringify({ id, title, description, records }, null, 2) + "\n");
}
fs.writeFileSync(path.join(OUT, "sources.json"), JSON.stringify({ sources: SOURCES }, null, 2) + "\n");
fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify({ variant: "internet", licence: "CC BY 4.0", datasets: TABLES.map(([id, title, description, records]) => ({ id, title, description, rows: records.length })) }, null, 2) + "\n");
const he = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
fs.writeFileSync(path.join(OUT, "index.html"), `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>internet data · Ledger Monitor</title>
<style>body{font:16px/1.5 system-ui,sans-serif;max-width:900px;margin:40px auto;padding:0 16px;color:#0a0a0a;background:#f5f5f1}table{width:100%;border-collapse:collapse}td{padding:10px 8px;border-bottom:1px solid #dadad3;vertical-align:top}small{color:#5c5c57}a{color:#3B50B5}</style>
<h1>internet data</h1><p>Every dataset behind the dashboard. Each row cites a source id listed in <a href="sources.json">sources.json</a>. Licensed <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>: credit "Ledger Monitor" and the original publishers.</p>
<table><tr><th align="left">Dataset</th><th align="left">Rows</th><th align="left">Download</th></tr>${TABLES.map(([id, title, d, rec]) => `<tr><td><b>${he(title)}</b><br><small>${he(d)}</small></td><td>${rec.length}</td><td><a href="${id}.csv">CSV</a> · <a href="${id}.json">JSON</a></td></tr>`).join("")}</table><p><a href="../../index.html">← Back to Ledger Monitor</a></p>`);

// The cable routes are not a published table; the dashboard reads them from data.js.
const DATA = Object.fromEntries(TABLES.map(([id, , , rec]) => [id, rec]));
DATA.routes = routes;
fs.writeFileSync(path.join(REPO, "internet/assets/data.js"), `export const SOURCES=${JSON.stringify(SOURCES)};\nexport const DATA=${JSON.stringify(DATA)};\n`);

const km = cables.reduce((s, c) => s + (c.length_km ?? 0), 0);
console.log("cables", cables.length, "km", Math.round(km), "landings", landings.length, "routes", routes.length, "countries", countries.length, "matched", countries.filter((c) => c.iso_n3).length);
const BIG = ["Google", "Meta", "Microsoft", "Amazon"];
console.log("big tech", BIG.map((b) => `${b} ${cables.filter((c) => c.owners && (b === "Meta" ? /facebook|\bmeta\b/i.test(c.owners) : c.owners.toLowerCase().includes(b.toLowerCase()))).length}`).join(", "));
console.log("routes without a name", routes.filter((r) => !r.properties.name).map((r) => r.properties.id).join(" ") || "none");
console.log("azure", azure_latency.length, azure_latency.slice(0, 3).map((r) => `${r.from_code}>${r.to_code} ${r.rtt_ms}`).join(", "));
