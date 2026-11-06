import { s as me, S as pe, e as d, b as R } from "../../assets/charts.js";
import { B as ue } from "../../assets/map.js";
import { s as scrolly } from "../../assets/story-Cpe0Yf6I.js";
import "../../assets/maplibre-ChAaPfnC.js";
import "../../assets/d3-CYFjbSD-.js";
function Z(n, i) {
  const r = Math.round(n * 10) / 10,
    u = i.findIndex((h) => r >= h.min && r <= h.max);
  if (u < 0) throw new Error(`No rating band for ${n}`);
  return u;
}
const f = (n) =>
  n.median_multiple_prev == null
    ? null
    : Math.round((n.median_multiple - n.median_multiple_prev) * 10) / 10;
function ce(n) {
  const i = f(n);
  return i == null ? null : i < 0 ? 0 : i > 0 ? 2 : 1;
}
function j(n, i, r) {
  return r <= 0 ? 1 / 0 : (i * n) / r;
}
const _e = (n, i) => n * (1 - i);
function ge(n, i) {
  const r = i.map((u) => ({ rating: u.rating, n: 0 }));
  return n.forEach((u) => r[Z(u.median_multiple, i)].n++), r;
}
function he(n, i) {
  const r = n
      .filter((_) => _.median_multiple_prev != null)
      .map((_) => ({ ..._, d: f(_) })),
    u = [...r].sort((_, v) => _.d - v.d).slice(0, i),
    h = [...r]
      .sort((_, v) => v.d - _.d)
      .filter((_) => _.d > 0)
      .slice(0, i);
  return { better: u, worse: h };
}
const ve = {
    "demographia-2026": {
      publisher: "Chapman University Center for Demographics and Policy",
      title: "Demographia International Housing Affordability, 2026 Edition",
      url: "https://blogs.chapman.edu/wp-content/uploads/sites/56/2026/05/Demographia-International-Housing-Affordability-2026-Edition-1.pdf",
      published: "2026-05",
      method: "reported",
      notes: "Data for the third quarter of 2025.",
    },
    "demographia-2025": {
      publisher: "Chapman University Center for Demographics and Policy",
      title: "Demographia International Housing Affordability, 2025 Edition",
      url: "https://blogs.chapman.edu/wp-content/uploads/sites/56/2025/06/Demographic-International-Housing-Affordability-2025.pdf",
      published: "2025-05",
      method: "reported",
      notes: "Data for the third quarter of 2024.",
    },
    "ons-2025": {
      publisher: "Office for National Statistics",
      title: "Housing affordability in England and Wales: 2025",
      url: "https://www.ons.gov.uk/peoplepopulationandcommunity/housing/bulletins/housingaffordabilityinenglandandwales/2025",
      published: "2026-03-26",
      method: "reported",
      notes: "London ratio corrected to 10.6 by the ONS on 13 May 2026.",
    },
    "ubs-2025": {
      publisher: "UBS",
      title: "UBS Global Real Estate Bubble Index 2025",
      url: "https://www.ubs.com/global/de/media/display-page-ndp/en-20250923-grebi25.html",
      published: "2025-09-23",
      method: "reference",
    },
    geonames: {
      publisher: "GeoNames (via the all-the-cities package)",
      title: "GeoNames cities with population over 1,000",
      url: "https://www.geonames.org/",
      published: "2026",
      method: "reference",
      notes: "Used only to place markets on the map.",
    },
  },
  ke = { sources: ve },
  be = JSON.parse(
    '[{"market":"Cleveland, OH","nation":"United States","nation_code":"US","rank":1,"median_multiple":3.1,"median_multiple_prev":3.3,"lon":-81.7,"lat":41.5,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Pittsburgh, PA","nation":"United States","nation_code":"US","rank":2,"median_multiple":3.2,"median_multiple_prev":3.2,"lon":-80,"lat":40.44,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Edmonton, AB","nation":"Canada","nation_code":"CA","rank":3,"median_multiple":3.6,"median_multiple_prev":3.7,"lon":-113.47,"lat":53.55,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Oklahoma City, OK","nation":"United States","nation_code":"US","rank":3,"median_multiple":3.6,"median_multiple_prev":3.7,"lon":-97.52,"lat":35.47,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Rochester, NY","nation":"United States","nation_code":"US","rank":3,"median_multiple":3.6,"median_multiple_prev":3.6,"lon":-77.62,"lat":43.15,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"St. Louis, MO-IL","nation":"United States","nation_code":"US","rank":3,"median_multiple":3.6,"median_multiple_prev":3.5,"lon":-90.2,"lat":38.63,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Sheffield","nation":"United Kingdom","nation_code":"GB","rank":7,"median_multiple":3.7,"median_multiple_prev":3.8,"lon":-1.47,"lat":53.38,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Omaha, NE-IA","nation":"United States","nation_code":"US","rank":7,"median_multiple":3.7,"median_multiple_prev":3.7,"lon":-95.94,"lat":41.26,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Middlesbrough & Durham","nation":"United Kingdom","nation_code":"GB","rank":9,"median_multiple":3.8,"median_multiple_prev":3.7,"lon":-1.23,"lat":54.58,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Louisville, KY-IN","nation":"United States","nation_code":"US","rank":9,"median_multiple":3.8,"median_multiple_prev":4,"lon":-85.76,"lat":38.25,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Glasgow","nation":"United Kingdom","nation_code":"GB","rank":11,"median_multiple":3.9,"median_multiple_prev":4.6,"lon":-4.26,"lat":55.87,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Cincinnati, OH-KY-IN","nation":"United States","nation_code":"US","rank":11,"median_multiple":3.9,"median_multiple_prev":3.9,"lon":-84.51,"lat":39.13,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Dallas-Fort Worth, TX","nation":"United States","nation_code":"US","rank":11,"median_multiple":3.9,"median_multiple_prev":4.3,"lon":-96.81,"lat":32.78,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Detroit, MI","nation":"United States","nation_code":"US","rank":11,"median_multiple":3.9,"median_multiple_prev":3.9,"lon":-83.05,"lat":42.33,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Tulsa, OK","nation":"United States","nation_code":"US","rank":11,"median_multiple":3.9,"median_multiple_prev":4.1,"lon":-95.99,"lat":36.15,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Atlanta, GA","nation":"United States","nation_code":"US","rank":16,"median_multiple":4,"median_multiple_prev":4.3,"lon":-84.39,"lat":33.75,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Buffalo, NY","nation":"United States","nation_code":"US","rank":16,"median_multiple":4,"median_multiple_prev":4,"lon":-78.88,"lat":42.89,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Minneapolis-St. Paul, MN-WI","nation":"United States","nation_code":"US","rank":16,"median_multiple":4,"median_multiple_prev":4,"lon":-93.26,"lat":44.98,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"San Antonio, TX","nation":"United States","nation_code":"US","rank":16,"median_multiple":4,"median_multiple_prev":4.3,"lon":-98.49,"lat":29.42,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Columbus, OH","nation":"United States","nation_code":"US","rank":20,"median_multiple":4.1,"median_multiple_prev":4.3,"lon":-83,"lat":39.96,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Houston, TX","nation":"United States","nation_code":"US","rank":20,"median_multiple":4.1,"median_multiple_prev":4.3,"lon":-95.36,"lat":29.76,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Indianapolis, IN","nation":"United States","nation_code":"US","rank":20,"median_multiple":4.1,"median_multiple_prev":4.1,"lon":-86.16,"lat":39.77,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Kansas City, MO-KS","nation":"United States","nation_code":"US","rank":20,"median_multiple":4.1,"median_multiple_prev":4.2,"lon":-94.58,"lat":39.1,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Grand Rapids, MI","nation":"United States","nation_code":"US","rank":24,"median_multiple":4.2,"median_multiple_prev":4.3,"lon":-85.67,"lat":42.96,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Calgary, AB","nation":"Canada","nation_code":"CA","rank":25,"median_multiple":4.3,"median_multiple_prev":4.8,"lon":-114.09,"lat":51.05,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Singapore","nation":"Singapore","nation_code":"SG","rank":25,"median_multiple":4.3,"median_multiple_prev":4.2,"lon":103.85,"lat":1.29,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Memphis, TN-MS-AR","nation":"United States","nation_code":"US","rank":25,"median_multiple":4.3,"median_multiple_prev":4.4,"lon":-90.05,"lat":35.15,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Edinburgh","nation":"United Kingdom","nation_code":"GB","rank":28,"median_multiple":4.4,"median_multiple_prev":6.2,"lon":-3.2,"lat":55.95,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Nottingham","nation":"United Kingdom","nation_code":"GB","rank":28,"median_multiple":4.4,"median_multiple_prev":4.6,"lon":-1.15,"lat":52.95,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Baltimore, MD","nation":"United States","nation_code":"US","rank":28,"median_multiple":4.4,"median_multiple_prev":4.4,"lon":-76.61,"lat":39.29,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Birmingham, AL","nation":"United States","nation_code":"US","rank":28,"median_multiple":4.4,"median_multiple_prev":4.5,"lon":-86.8,"lat":33.52,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Chicago, IL","nation":"United States","nation_code":"US","rank":28,"median_multiple":4.4,"median_multiple_prev":4.4,"lon":-87.65,"lat":41.85,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Hartford, CT","nation":"United States","nation_code":"US","rank":28,"median_multiple":4.4,"median_multiple_prev":4.3,"lon":-72.69,"lat":41.76,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Philadelphia, PA-NJ-DE-MD","nation":"United States","nation_code":"US","rank":28,"median_multiple":4.4,"median_multiple_prev":4.4,"lon":-75.16,"lat":39.95,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Raleigh, NC","nation":"United States","nation_code":"US","rank":28,"median_multiple":4.4,"median_multiple_prev":4.8,"lon":-78.64,"lat":35.77,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Virginia Beach-Norfolk, VA-NC","nation":"United States","nation_code":"US","rank":28,"median_multiple":4.4,"median_multiple_prev":4.4,"lon":-75.98,"lat":36.85,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Derby & Derbyshire","nation":"United Kingdom","nation_code":"GB","rank":37,"median_multiple":4.5,"median_multiple_prev":4.6,"lon":-1.48,"lat":52.92,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Newcastle","nation":"United Kingdom","nation_code":"GB","rank":37,"median_multiple":4.5,"median_multiple_prev":4.7,"lon":-1.61,"lat":54.97,"plotted_at":"Newcastle upon Tyne (main city)","source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Stoke on Trent & Staffordshire","nation":"United Kingdom","nation_code":"GB","rank":37,"median_multiple":4.5,"median_multiple_prev":4.6,"lon":-2.19,"lat":53,"plotted_at":"Stoke-on-Trent (main city)","source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Greenville, SC","nation":"United States","nation_code":"US","rank":37,"median_multiple":4.5,"median_multiple_prev":null,"lon":-82.39,"lat":34.85,"plotted_at":null,"source":"demographia-2026","prev_source":null,"geo_source":"geonames"},{"market":"New Orleans, LA","nation":"United States","nation_code":"US","rank":37,"median_multiple":4.5,"median_multiple_prev":4.6,"lon":-90.08,"lat":29.95,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Austin, TX","nation":"United States","nation_code":"US","rank":42,"median_multiple":4.6,"median_multiple_prev":4.8,"lon":-97.74,"lat":30.27,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"West Midlands","nation":"United Kingdom","nation_code":"GB","rank":43,"median_multiple":4.7,"median_multiple_prev":4.9,"lon":-1.9,"lat":52.48,"plotted_at":"Birmingham (main city)","source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Jacksonville, FL","nation":"United States","nation_code":"US","rank":43,"median_multiple":4.7,"median_multiple_prev":5.1,"lon":-81.66,"lat":30.33,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Nashville, TN","nation":"United States","nation_code":"US","rank":43,"median_multiple":4.7,"median_multiple_prev":4.9,"lon":-86.78,"lat":36.17,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Dublin","nation":"Ireland","nation_code":"IE","rank":46,"median_multiple":4.9,"median_multiple_prev":5.1,"lon":-6.25,"lat":53.33,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Blackpool & Lancashire","nation":"United Kingdom","nation_code":"GB","rank":46,"median_multiple":4.9,"median_multiple_prev":4.9,"lon":-3.05,"lat":53.82,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Charlotte, NC-SC","nation":"United States","nation_code":"US","rank":46,"median_multiple":4.9,"median_multiple_prev":5.1,"lon":-80.84,"lat":35.23,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Ottawa-Gatineau, ON-QC","nation":"Canada","nation_code":"CA","rank":49,"median_multiple":5,"median_multiple_prev":5,"lon":-75.7,"lat":45.41,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Tampa-St. Petersburg, FL","nation":"United States","nation_code":"US","rank":49,"median_multiple":5,"median_multiple_prev":5.5,"lon":-82.46,"lat":27.95,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Hull & Humber","nation":"United Kingdom","nation_code":"GB","rank":51,"median_multiple":5.1,"median_multiple_prev":5.4,"lon":-0.34,"lat":53.74,"plotted_at":"Kingston upon Hull (main city)","source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Phoenix, AZ","nation":"United States","nation_code":"US","rank":51,"median_multiple":5.1,"median_multiple_prev":5.4,"lon":-112.07,"lat":33.45,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Richmond, VA","nation":"United States","nation_code":"US","rank":51,"median_multiple":5.1,"median_multiple_prev":4.9,"lon":-77.46,"lat":37.55,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Tucson, AZ","nation":"United States","nation_code":"US","rank":51,"median_multiple":5.1,"median_multiple_prev":5.5,"lon":-110.93,"lat":32.22,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Washington, DC-VA-MD-WV","nation":"United States","nation_code":"US","rank":51,"median_multiple":5.1,"median_multiple_prev":5.2,"lon":-77.04,"lat":38.9,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Liverpool","nation":"United Kingdom","nation_code":"GB","rank":56,"median_multiple":5.2,"median_multiple_prev":5.3,"lon":-2.98,"lat":53.41,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Orlando, FL","nation":"United States","nation_code":"US","rank":57,"median_multiple":5.3,"median_multiple_prev":5.6,"lon":-81.38,"lat":28.54,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Sacramento, CA","nation":"United States","nation_code":"US","rank":58,"median_multiple":5.4,"median_multiple_prev":5.8,"lon":-121.49,"lat":38.58,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Leeds","nation":"United Kingdom","nation_code":"GB","rank":59,"median_multiple":5.5,"median_multiple_prev":5.7,"lon":-1.55,"lat":53.8,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Leicester & Leicestershire","nation":"United Kingdom","nation_code":"GB","rank":59,"median_multiple":5.5,"median_multiple_prev":5.6,"lon":-1.13,"lat":52.64,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Milwaukee, WI","nation":"United States","nation_code":"US","rank":59,"median_multiple":5.5,"median_multiple_prev":5.3,"lon":-87.91,"lat":43.04,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Northampton","nation":"United Kingdom","nation_code":"GB","rank":62,"median_multiple":5.7,"median_multiple_prev":5.9,"lon":-0.88,"lat":52.25,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Fresno, CA","nation":"United States","nation_code":"US","rank":62,"median_multiple":5.7,"median_multiple_prev":5.9,"lon":-119.77,"lat":36.75,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Montreal, QC","nation":"Canada","nation_code":"CA","rank":64,"median_multiple":5.8,"median_multiple_prev":5.8,"lon":-73.59,"lat":45.51,"plotted_at":"Montréal (main city)","source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Plymouth & Devon","nation":"United Kingdom","nation_code":"GB","rank":64,"median_multiple":5.8,"median_multiple_prev":6,"lon":-4.14,"lat":50.37,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Las Vegas, NV","nation":"United States","nation_code":"US","rank":64,"median_multiple":5.8,"median_multiple_prev":6.3,"lon":-115.14,"lat":36.17,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Salt Lake City, UT","nation":"United States","nation_code":"US","rank":64,"median_multiple":5.8,"median_multiple_prev":6,"lon":-111.89,"lat":40.76,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Denver, CO","nation":"United States","nation_code":"US","rank":68,"median_multiple":5.9,"median_multiple_prev":6.2,"lon":-104.98,"lat":39.74,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Portland, OR-WA","nation":"United States","nation_code":"US","rank":68,"median_multiple":5.9,"median_multiple_prev":6.3,"lon":-122.68,"lat":45.52,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Greater Manchester","nation":"United Kingdom","nation_code":"GB","rank":70,"median_multiple":6.1,"median_multiple_prev":6.4,"lon":-2.24,"lat":53.48,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Swindon","nation":"United Kingdom","nation_code":"GB","rank":71,"median_multiple":6.2,"median_multiple_prev":6.4,"lon":-1.78,"lat":51.56,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Riverside-San Bernardino, CA","nation":"United States","nation_code":"US","rank":72,"median_multiple":6.3,"median_multiple_prev":6.6,"lon":-117.4,"lat":33.95,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Providence, RI-MA","nation":"United States","nation_code":"US","rank":73,"median_multiple":6.5,"median_multiple_prev":6.2,"lon":-71.41,"lat":41.82,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Boston, MA-NH","nation":"United States","nation_code":"US","rank":74,"median_multiple":6.6,"median_multiple_prev":6.7,"lon":-71.06,"lat":42.36,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"London Exurbs","nation":"United Kingdom","nation_code":"GB","rank":75,"median_multiple":6.9,"median_multiple_prev":7.3,"lon":-0.97,"lat":51.46,"plotted_at":"Reading (centre of the London exurbs)","source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Seattle, WA","nation":"United States","nation_code":"US","rank":75,"median_multiple":6.9,"median_multiple_prev":7.1,"lon":-122.33,"lat":47.61,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Bournemouth & Dorset","nation":"United Kingdom","nation_code":"GB","rank":77,"median_multiple":7.2,"median_multiple_prev":7.3,"lon":-1.88,"lat":50.72,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Bristol-Bath","nation":"United Kingdom","nation_code":"GB","rank":77,"median_multiple":7.2,"median_multiple_prev":7.5,"lon":-2.6,"lat":51.46,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Warrington & Cheshire","nation":"United Kingdom","nation_code":"GB","rank":79,"median_multiple":7.3,"median_multiple_prev":7.4,"lon":-2.58,"lat":53.39,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"New York, NY-NJ-PA","nation":"United States","nation_code":"US","rank":80,"median_multiple":7.5,"median_multiple_prev":7.4,"lon":-74.01,"lat":40.71,"plotted_at":"New York City (main city)","source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Toronto, ON","nation":"Canada","nation_code":"CA","rank":81,"median_multiple":7.6,"median_multiple_prev":8.4,"lon":-79.42,"lat":43.7,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Auckland","nation":"New Zealand","nation_code":"NZ","rank":82,"median_multiple":7.7,"median_multiple_prev":7.7,"lon":174.76,"lat":-36.85,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Miami, FL","nation":"United States","nation_code":"US","rank":82,"median_multiple":7.7,"median_multiple_prev":8.1,"lon":-80.19,"lat":25.77,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Perth, WA","nation":"Australia","nation_code":"AU","rank":84,"median_multiple":8,"median_multiple_prev":8.3,"lon":115.86,"lat":-31.95,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Greater London","nation":"United Kingdom","nation_code":"GB","rank":85,"median_multiple":8.5,"median_multiple_prev":9.1,"lon":-0.13,"lat":51.51,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"San Diego, CA","nation":"United States","nation_code":"US","rank":86,"median_multiple":9,"median_multiple_prev":9.5,"lon":-117.16,"lat":32.72,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"San Francisco, CA","nation":"United States","nation_code":"US","rank":87,"median_multiple":9.4,"median_multiple_prev":10,"lon":-122.42,"lat":37.77,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Melbourne, VIC","nation":"Australia","nation_code":"AU","rank":88,"median_multiple":9.5,"median_multiple_prev":9.7,"lon":144.96,"lat":-37.81,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Brisbane, QLD","nation":"Australia","nation_code":"AU","rank":89,"median_multiple":9.9,"median_multiple_prev":9.3,"lon":153.03,"lat":-27.47,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Honolulu, HI","nation":"United States","nation_code":"US","rank":90,"median_multiple":10.4,"median_multiple_prev":10.8,"lon":-157.86,"lat":21.31,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Los Angeles, CA","nation":"United States","nation_code":"US","rank":91,"median_multiple":10.7,"median_multiple_prev":11.2,"lon":-118.24,"lat":34.05,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Vancouver, BC","nation":"Canada","nation_code":"CA","rank":92,"median_multiple":10.8,"median_multiple_prev":11.8,"lon":-123.12,"lat":49.25,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Adelaide, SA","nation":"Australia","nation_code":"AU","rank":93,"median_multiple":11.2,"median_multiple_prev":10.9,"lon":138.6,"lat":-34.93,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"San Jose, CA","nation":"United States","nation_code":"US","rank":94,"median_multiple":11.3,"median_multiple_prev":12.1,"lon":-121.89,"lat":37.34,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Sydney, NSW","nation":"Australia","nation_code":"AU","rank":95,"median_multiple":14,"median_multiple_prev":13.8,"lon":151.21,"lat":-33.87,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"},{"market":"Hong Kong","nation":"China: Hong Kong","nation_code":"HK","rank":96,"median_multiple":14.1,"median_multiple_prev":14.4,"lon":114.17,"lat":22.28,"plotted_at":null,"source":"demographia-2026","prev_source":"demographia-2025","geo_source":"geonames"}]',
  ),
  Se = { records: be },
  ye = [
    {
      nation: "Australia",
      nation_code: "AU",
      iso_n3: "036",
      median_multiple: 9.9,
      median_multiple_prev: 9.7,
      source: "demographia-2026",
      prev_source: "demographia-2025",
    },
    {
      nation: "Canada",
      nation_code: "CA",
      iso_n3: "124",
      median_multiple: 5.4,
      median_multiple_prev: 5.4,
      source: "demographia-2026",
      prev_source: "demographia-2025",
    },
    {
      nation: "China: Hong Kong",
      nation_code: "HK",
      iso_n3: "344",
      median_multiple: 14.1,
      median_multiple_prev: 14.4,
      source: "demographia-2026",
      prev_source: "demographia-2025",
    },
    {
      nation: "Ireland",
      nation_code: "IE",
      iso_n3: "372",
      median_multiple: 4.9,
      median_multiple_prev: 5.1,
      source: "demographia-2026",
      prev_source: "demographia-2025",
    },
    {
      nation: "New Zealand",
      nation_code: "NZ",
      iso_n3: "554",
      median_multiple: 7.7,
      median_multiple_prev: 7.7,
      source: "demographia-2026",
      prev_source: "demographia-2025",
    },
    {
      nation: "Singapore",
      nation_code: "SG",
      iso_n3: "702",
      median_multiple: 4.3,
      median_multiple_prev: 4.2,
      source: "demographia-2026",
      prev_source: "demographia-2025",
    },
    {
      nation: "United Kingdom",
      nation_code: "GB",
      iso_n3: "826",
      median_multiple: 5.2,
      median_multiple_prev: 5.6,
      source: "demographia-2026",
      prev_source: "demographia-2025",
    },
    {
      nation: "United States",
      nation_code: "US",
      iso_n3: "840",
      median_multiple: 4.5,
      median_multiple_prev: 4.8,
      source: "demographia-2026",
      prev_source: "demographia-2025",
    },
    {
      nation: "All 96 markets",
      nation_code: "ALL",
      iso_n3: null,
      median_multiple: 5,
      median_multiple_prev: 5.1,
      source: "demographia-2026",
      prev_source: "demographia-2025",
    },
  ],
  fe = { records: ye },
  Ue = [
    { rating: "Affordable", min: 0, max: 3, source: "demographia-2026" },
    {
      rating: "Moderately unaffordable",
      min: 3.1,
      max: 4,
      source: "demographia-2026",
    },
    {
      rating: "Seriously unaffordable",
      min: 4.1,
      max: 5,
      source: "demographia-2026",
    },
    {
      rating: "Severely unaffordable",
      min: 5.1,
      max: 8.9,
      source: "demographia-2026",
    },
    {
      rating: "Impossibly unaffordable",
      min: 9,
      max: 99,
      source: "demographia-2026",
    },
  ],
  $e = { records: Ue },
  Ae = [
    {
      area: "England",
      level: "Country",
      ratio: 7.6,
      median_price: 3e5,
      median_earnings: 39300,
      source: "ons-2025",
    },
    {
      area: "Wales",
      level: "Country",
      ratio: 6,
      median_price: 213e3,
      median_earnings: 35800,
      source: "ons-2025",
    },
    {
      area: "London",
      level: "Region",
      ratio: 10.6,
      median_price: null,
      median_earnings: null,
      source: "ons-2025",
    },
    {
      area: "North East",
      level: "Region",
      ratio: 5,
      median_price: null,
      median_earnings: null,
      source: "ons-2025",
    },
    {
      area: "Kensington and Chelsea",
      level: "Local authority",
      ratio: 25.2,
      median_price: null,
      median_earnings: null,
      source: "ons-2025",
    },
    {
      area: "Hyndburn",
      level: "Local authority",
      ratio: 4.1,
      median_price: null,
      median_earnings: null,
      source: "ons-2025",
    },
    {
      area: "Kingston upon Hull",
      level: "Local authority",
      ratio: 4.1,
      median_price: null,
      median_earnings: null,
      source: "ons-2025",
    },
  ],
  we = { records: Ae },
  Ce = [
    { city: "Miami", risk: "High", source: "ubs-2025" },
    { city: "Tokyo", risk: "High", source: "ubs-2025" },
    { city: "Zurich", risk: "High", source: "ubs-2025" },
    { city: "Los Angeles", risk: "Elevated", source: "ubs-2025" },
    { city: "Geneva", risk: "Elevated", source: "ubs-2025" },
    { city: "Amsterdam", risk: "Elevated", source: "ubs-2025" },
    { city: "Dubai", risk: "Elevated", source: "ubs-2025" },
    { city: "Sydney", risk: "Moderate", source: "ubs-2025" },
    { city: "Vancouver", risk: "Moderate", source: "ubs-2025" },
    { city: "Toronto", risk: "Moderate", source: "ubs-2025" },
    { city: "Madrid", risk: "Moderate", source: "ubs-2025" },
    { city: "Frankfurt", risk: "Moderate", source: "ubs-2025" },
    { city: "Munich", risk: "Moderate", source: "ubs-2025" },
    { city: "London", risk: "Low", source: "ubs-2025" },
    { city: "Paris", risk: "Low", source: "ubs-2025" },
    { city: "Milan", risk: "Low", source: "ubs-2025" },
    { city: "Hong Kong", risk: "Low", source: "ubs-2025" },
    { city: "San Francisco", risk: "Low", source: "ubs-2025" },
    { city: "New York", risk: "Low", source: "ubs-2025" },
    { city: "São Paulo", risk: "Low", source: "ubs-2025" },
  ],
  Me = { records: Ce },
  w = (n) => n.records,
  l = (n) => n.toFixed(1),
  y = (n) => (n > 0 ? "+" : n < 0 ? "−" : "±") + Math.abs(n).toFixed(1),
  Q = (n) => "£" + new Intl.NumberFormat("en-GB").format(n),
  F = ["--hs-r0", "--hs-r1", "--hs-r2", "--hs-r3", "--hs-r4"],
  Y = ["--hs-better", "--hs-same", "--hs-worse"],
  Le = ["US", "GB", "CA", "AU", "NZ", "IE", "SG", "HK"],
  C = {
    US: "US",
    GB: "UK",
    CA: "Canada",
    AU: "Australia",
    NZ: "New Zealand",
    IE: "Ireland",
    SG: "Singapore",
    HK: "Hong Kong",
  },
  He = {
    id: "housing",
    title: "Housing Affordability",
    description:
      "How many years of income a typical home costs in 96 major housing markets, from the Demographia survey, the ONS and UBS, with every number linked to its source.",
    mount(n) {
      const i = w($e),
        r = w(Se),
        u = w(fe),
        h = w(we),
        _ = w(Me),
        v = (e) => Z(e, i),
        I = [...r].sort((e, a) => e.median_multiple - a.median_multiple),
        k = I[0],
        M = I[I.length - 1],
        U = u.find((e) => e.nation_code === "ALL"),
        b = ge(r, i),
        { better: L, worse: P } = he(r, 6),
        N = r.find((e) => e.market === "Greater London"),
        { main: t, initialView: IV } = me(n, {
          variantId: "housing",
          name: "Housing",
          views: [{ id: "dashboard", label: "Dashboard" }, { id: "story", label: "Story" }],
          onView: (e) => setView(e),
          onTheme: () => { $.retheme(); story && story.redraw(); },
        }),
        B = new pe(ke.sources, n),
        s = (...e) => B.attr(...e),
        E = (e) => `<i style="background:var(${F[e]})"></i>`,
        J = (e) =>
          `<span class="hs-pill">${E(v(e))}${d(i[v(e)].rating)}</span>`;
      t.innerHTML = `
      <header class="em-head">
        <p class="em-eyebrow"><span class="num">00</span>Housing affordability · Q3 2025 data</p>
        <h1>In ${d(M.market)}, a home costs <span class="accent"><b ${s(M.source)}>${l(M.median_multiple)} years</b> of household income</span></h1>
        <p class="em-lede">None of the <b ${s(k.source)}>${r.length}</b> major housing markets in the Demographia survey counts as affordable. Even the most affordable, <b ${s(k.source)}>${d(k.market)}</b>, sits at <b ${s(k.source)}>${l(k.median_multiple)}</b>, just above the affordable line of ${l(i[0].max)}.</p>
      </header>

      <div class="em-view" data-view="dashboard">
      <section class="em-sec" id="glance">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">01</span>At a glance</p><h2>Affordability here is the median home price divided by median income</h2></div></div>
        <div class="em-kpis">
          ${K("Markets tracked", String(r.length), "Major markets in 8 countries, Q3 2025", k.source)}
          ${K("Rated affordable", String(b[0].n), `A multiple of ${l(i[0].max)} or less`, i[0].source, !0)}
          ${K("Median of all markets", l(U.median_multiple), `${y(U.median_multiple - U.median_multiple_prev)} on Q3 2024 (${l(U.median_multiple_prev)})`, U.source)}
          ${K("Greater London", l(N.median_multiple), `${y(f(N))} on 2024 · ${i[v(N.median_multiple)].rating.toLowerCase()}`, N.source)}
        </div>
      </section>

      <section class="em-sec" id="map">
        <div class="em-sec-h">
          <div><p class="em-eyebrow"><span class="num">02</span>Where homes cost the most</p><h2>96 markets, <span class="accent">one scale</span></h2></div>
        </div>
        <div class="em-maprow">
          <div class="em-card em-mapcard">
            <div class="em-maptools">
              <div class="em-toggle" role="group" aria-label="Colour by">
                <button type="button" class="hs-mode" data-mode="level" aria-pressed="true">2025 rating</button>
                <button type="button" class="hs-mode" data-mode="change" aria-pressed="false">Change on 2024</button>
              </div>
              <div class="em-toggle" role="group" aria-label="Projection">
                <button type="button" class="em-proj" data-proj="mercator" aria-pressed="true">Flat</button>
                <button type="button" class="em-proj" data-proj="globe" aria-pressed="false">Globe</button>
              </div>
            </div>
            <div class="hs-chips" role="group" aria-label="Country" style="margin-bottom:12px">
              <button type="button" class="hs-chip" data-nation="" aria-pressed="true">All</button>
              ${Le.map((e) => `<button type="button" class="hs-chip" data-nation="${e}" aria-pressed="false">${d(C[e])}</button>`).join("")}
            </div>
            <div class="em-map" id="hs-map" role="region" aria-label="Map of housing markets coloured by affordability"></div>
            <div class="hs-scale" id="hs-scale"></div>
          </div>
          <div class="em-card em-detail soft" id="hs-detail" aria-live="polite"></div>
        </div>
      </section>

      <section class="em-sec" id="calc">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">03</span>What it means for a buyer</p><h2>Years to save a deposit, <span class="accent">market by market</span></h2></div></div>
        <div class="em-grid">
          <div class="em-card">
            <p class="em-eyebrow">Deposit calculator</p>
            <h3>How long would a typical household need to save?</h3>
            <p class="note">For a household on the local median income buying a median-priced home. Years = deposit share × median multiple ÷ share of income saved. Income cancels out, so this works in any currency.</p>
            <div class="hs-calc">
              <div class="hs-field"><label for="hs-market">Market</label><select id="hs-market">${[
                ...r,
              ]
                .sort((e, a) => e.market.localeCompare(a.market))
                .map(
                  (e) =>
                    `<option value="${d(e.market)}">${d(e.market)} (${l(e.median_multiple)})</option>`,
                )
                .join("")}</select></div>
              <div class="hs-field"><label for="hs-dep">Deposit <output id="hs-dep-o">20%</output></label><input id="hs-dep" type="range" min="5" max="40" step="1" value="20"></div>
              <div class="hs-field"><label for="hs-sav">Saved each year <output id="hs-sav-o">10% of income</output></label><input id="hs-sav" type="range" min="2" max="40" step="1" value="10"></div>
              <div class="hs-out" id="hs-out"></div>
            </div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">By country · Q3 2025</p>
            <h3>National median multiples</h3>
            <p class="note">The median across each country's major markets in the survey, with the change on Q3 2024.</p>
            <p class="hs-key"><span><i style="background:var(--em-accent)"></i>Severely unaffordable or worse (${l(i[3].min)}+)</span><span><i style="background:var(--em-bar-muted)"></i>Seriously unaffordable or better</span></p>
            <div class="em-bars" id="hs-nations"></div>
            <div class="em-cites"></div>
          </div>
        </div>
      </section>

      <section class="em-sec" id="dist">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">04</span>The spread</p><h2>${Math.round((100 * (b[3].n + b[4].n)) / r.length)}% of markets are <span class="accent">severely unaffordable or worse</span></h2></div></div>
        <div class="em-grid">
          <div class="em-card">
            <p class="em-eyebrow">Markets by rating · Q3 2025</p>
            <h3>How the ${r.length} markets split</h3>
            <p class="note">Demographia's bands: up to ${l(i[0].max)} affordable, ${l(i[4].min)} and above impossibly unaffordable.</p>
            <div id="hs-dist"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">Biggest moves since Q3 2024</p>
            <h3>Where affordability changed most</h3>
            <p class="note">Change in the median multiple. A fall means homes got more affordable relative to income.</p>
            <div class="em-bars" id="hs-movers"></div>
            <div class="em-cites"></div>
          </div>
        </div>
      </section>

      <section class="em-sec" id="uk">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">05</span>Close-up · England and Wales</p><h2>The ONS measure, <span class="accent">down to the borough</span></h2></div></div>
        <div class="em-card">
          <p class="em-eyebrow">House price to earnings ratio · 2025</p>
          <h3>Median house price ÷ median earnings of full-time workers</h3>
          <p class="note">The ONS uses one worker's earnings, not household income, so its ratios run higher than Demographia's. England's median home cost <b ${s(h[0].source)}>${Q(h[0].median_price)}</b> against median earnings of <b ${s(h[0].source)}>${Q(h[0].median_earnings)}</b>.</p>
          <div class="em-bars" id="hs-ons"></div>
          <div class="em-cites"></div>
        </div>
      </section>

      <section class="em-sec" id="risk">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">06</span>Bubble risk</p><h2>Expensive isn't the same as <span class="accent">overvalued</span></h2></div></div>
        <div class="em-card">
          <p class="em-eyebrow">UBS Global Real Estate Bubble Index 2025</p>
          <p class="note">UBS rates how far prices have drifted from incomes, rents and the wider economy. Hong Kong is the least affordable market in the Demographia survey, yet UBS rates its bubble risk as low.</p>
          <div class="hs-risk" id="hs-risk"></div>
          <div class="em-cites"></div>
        </div>
      </section>

      <section class="em-sec" id="table">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">07</span>Every market</p><h2>All ${r.length} markets, <span class="accent">ranked</span></h2></div></div>
        <div class="em-card">
          <input class="hs-search" id="hs-search" type="search" placeholder="Search a city or country" aria-label="Search markets">
          <div class="em-tablewrap hs-tablebox">
            <table class="em-table">
              <thead><tr>
                <th data-key="rank" aria-sort="ascending"><button type="button">Rank</button></th>
                <th data-key="market" aria-sort="none"><button type="button">Market</button></th>
                <th class="hide-n" data-key="nation" aria-sort="none"><button type="button">Country</button></th>
                <th class="r" data-key="median_multiple" aria-sort="none"><button type="button">2025</button></th>
                <th class="r hide-n" data-key="median_multiple_prev" aria-sort="none"><button type="button">2024</button></th>
                <th class="r" data-key="change" aria-sort="none"><button type="button">Change</button></th>
                <th class="hide-n">Rating</th>
              </tr></thead>
              <tbody id="hs-tbody"></tbody>
            </table>
          </div>
          <div class="em-cites"></div>
        </div>
      </section>

      <section class="em-method" id="method">
        <p class="em-eyebrow"><span class="num">08</span>Method</p>
        <p>The <b>median multiple</b> is the median house price divided by the median gross annual household income, for each market's whole metropolitan area. Demographia compiles it for the third quarter of each year from national price and income sources. It measures purchase affordability only, not rents or mortgage costs.</p>
        <p>Markets are plotted at their main city using GeoNames coordinates; the "London Exurbs" market is plotted at Reading. The ONS ratio uses individual full-time earnings rather than household income, so it isn't directly comparable. UBS's bubble index measures overvaluation risk, not affordability.</p>
        <p class="em-eyebrow" style="margin-top:24px">All sources</p>
        <ol class="em-srclist">${B.list()}</ol>
      </section>
      </div>

      <div class="em-view" data-view="story" hidden>
        <div class="em-story">
          <div class="em-steps">${storySteps()}</div>
          <div class="em-stick"><div class="em-card"><div class="em-vis" id="em-vis"></div><div class="em-cites"></div></div></div>
        </div>
      </div>`;
      const p = { mode: "level", nation: "", sel: M.market },
        $ = new ue(t.querySelector("#hs-map"), {
          palette: [...F, ...Y],
          radius: (e) => 3 + e * 0.9,
          onPick: (e) => {
            (p.sel = e), A(), ae();
          },
        }),
        W = () => r.filter((e) => !p.nation || e.nation_code === p.nation),
        X = t.querySelector("#hs-scale");
      function A() {
        const e = W();
        e.some((a) => a.market === p.sel) ||
          (p.sel = [...e].sort(
            (a, o) => o.median_multiple - a.median_multiple,
          )[0].market),
          $.update(
            e.map((a) => {
              var m;
              const o = ce(a),
                g = f(a);
              return {
                id: a.market,
                iso_n3:
                  ((m = u.find((c) => c.nation_code === a.nation_code)) == null
                    ? void 0
                    : m.iso_n3) ?? "",
                lon: a.lon,
                lat: a.lat,
                value: a.median_multiple,
                cat:
                  p.mode === "level"
                    ? v(a.median_multiple)
                    : o == null
                      ? 6
                      : 5 + o,
                label: `${a.market} · ${l(a.median_multiple)}${g == null ? "" : ` (${y(g)})`}`,
              };
            }),
            p.sel,
          ),
          (X.innerHTML =
            p.mode === "level"
              ? i
                  .map(
                    (a, o) =>
                      `<span>${E(o)}${d(a.rating)} (${o === 0 ? "≤" + l(a.max) : o === 4 ? "≥" + l(a.min) : l(a.min) + "–" + l(a.max)})</span>`,
                  )
                  .join("") + "<span>Circle size = median multiple</span>"
              : ["More affordable", "No change or new", "Less affordable"]
                  .map(
                    (a, o) =>
                      `<span><i style="background:var(${Y[o]})"></i>${a}</span>`,
                  )
                  .join("")),
          z();
      }
      const V = t.querySelector("#hs-detail");
      function z() {
        const e = r.find((c) => c.market === p.sel),
          a = u.find((c) => c.nation_code === e.nation_code),
          o = f(e),
          g = v(e.median_multiple),
          m = (c, de) => `<dt>${d(c)}</dt><dd>${de}</dd>`;
        (V.innerHTML = `
        <p class="em-eyebrow">Selected market · Q3 2025</p>
        <p class="em-d-country">${d(e.market)}</p>
        <p class="em-d-value" ${s(e.source)}>${l(e.median_multiple)}×</p>
        <p class="em-d-usd">A median-priced home costs ${l(e.median_multiple)} years of median household income.</p>
        <p class="hs-rate">${E(g)}${d(i[g].rating)}</p>
        <dl class="em-d-list" style="margin-top:16px">
          ${m("Rank", `<span ${s(e.source)}>${e.rank} of ${r.length}</span>`)}
          ${m("Q3 2024", e.median_multiple_prev == null ? "Not surveyed" : `<span ${s(e.prev_source)}>${l(e.median_multiple_prev)}</span>`)}
          ${m("Change", o == null ? "n/a" : y(o))}
          ${m(d(C[e.nation_code]) + " median", `<span ${s(a.source)}>${l(a.median_multiple)}</span>`)}
          ${m("20% deposit", `${l(j(e.median_multiple, 0.2, 0.1))} yrs at 10% saved`)}
          ${e.plotted_at ? m("Plotted at", d(e.plotted_at)) : ""}
        </dl>
        <div class="em-cites"></div>`),
          B.footnotes(V);
      }
      t.querySelectorAll(".hs-mode").forEach((e) =>
        e.addEventListener("click", () => {
          (p.mode = e.dataset.mode),
            t
              .querySelectorAll(".hs-mode")
              .forEach((a) => a.setAttribute("aria-pressed", String(a === e))),
            A();
        }),
      ),
        t.querySelectorAll(".em-proj").forEach((e) =>
          e.addEventListener("click", () => {
            t
              .querySelectorAll(".em-proj")
              .forEach((a) => a.setAttribute("aria-pressed", String(a === e))),
              $.setProjection(e.dataset.proj);
          }),
        ),
        t.querySelectorAll(".hs-chip").forEach((e) =>
          e.addEventListener("click", () => {
            (p.nation = e.dataset.nation),
              t
                .querySelectorAll(".hs-chip")
                .forEach((a) =>
                  a.setAttribute("aria-pressed", String(a === e)),
                ),
              A(),
              $.focus(p.nation ? W().map((a) => a.market) : null);
          }),
        ),
        A();
      const S = t.querySelector("#hs-market"),
        x = t.querySelector("#hs-dep"),
        T = t.querySelector("#hs-sav"),
        ee = t.querySelector("#hs-out"),
        ae = () => {
          (S.value = p.sel), D();
        };
      function D() {
        const e = r.find((c) => c.market === S.value),
          a = Number(x.value) / 100,
          o = Number(T.value) / 100;
        (t.querySelector("#hs-dep-o").textContent = `${x.value}%`),
          (t.querySelector("#hs-sav-o").textContent = `${T.value}% of income`);
        const g = j(e.median_multiple, a, o),
          m = j(k.median_multiple, a, o);
        ee.innerHTML = `
        <div><p class="em-eyebrow">Years to save</p><div class="big accent" ${s(e.source)}>${l(g)}</div></div>
        <div><p class="em-eyebrow">Mortgage needed</p><div class="big" ${s(e.source)}>${l(_e(e.median_multiple, a))}×</div><p class="note" style="margin:6px 0 0">of household income</p></div>
        <div><p class="em-eyebrow">In ${d(k.market.split(",")[0])}</p><div class="big" ${s(k.source)}>${l(m)}</div><p class="note" style="margin:6px 0 0">years, the most affordable market</p></div>`;
      }
      (S.value = p.sel),
        [S, x, T].forEach((e) => e.addEventListener("input", D)),
        S.addEventListener("change", () => {
          (p.sel = S.value),
            (p.nation = ""),
            t
              .querySelectorAll(".hs-chip")
              .forEach((e) =>
                e.setAttribute("aria-pressed", String(e.dataset.nation === "")),
              ),
            A(),
            $.focus(null);
        }),
        D();
      const oe = u
        .filter((e) => e.nation_code !== "ALL")
        .sort((e, a) => a.median_multiple - e.median_multiple);
      const DEP = [M, r.find((e) => e.market.startsWith("Sydney")), r.find((e) => e.market === "Greater London"), r.find((e) => e.market.startsWith("Toronto")), r.find((e) => e.market.startsWith("New York")), r.find((e) => e.market === "Dublin"), k];
      R(
        t.querySelector("#hs-nations"),
        oe.map((e) => ({
          label: `${C[e.nation_code]}  ${y(e.median_multiple - e.median_multiple_prev)}`,
          value: e.median_multiple,
          muted: v(e.median_multiple) < 3,
          src: e.source,
        })),
        l,
        15,
        s,
      );
      const te = r.length;
      (t.querySelector("#hs-dist").innerHTML = `
      <div class="hs-dist" role="img" aria-label="${b.map((e) => `${e.rating}: ${e.n}`).join(", ")}">
        ${b.map((e, a) => (e.n ? `<span style="flex:${e.n};background:var(${F[a]})" ${s(i[a].source)}>${e.n}</span>` : "")).join("")}
      </div>
      <div class="hs-dist-legend">${b.map((e, a) => `<span>${E(a)} ${d(e.rating)} · <b>${e.n}</b> (${Math.round((100 * e.n) / te)}%)</span>`).join("")}</div>`),
        t.querySelectorAll(".hs-dist-legend i").forEach((e) => {
          e.style.cssText +=
            ";width:.7rem;height:.7rem;border-radius:50%;display:inline-block;vertical-align:-1px";
        });
      const ne = Math.max(...[...L, ...P].map((e) => Math.abs(e.d)));
      R(
        t.querySelector("#hs-movers"),
        [
          ...L.map((e) => ({
            group: "More affordable",
            label: e.market,
            value: Math.abs(e.d),
            muted: !1,
            src: e.prev_source,
          })),
          ...P.map((e) => ({
            group: "Less affordable",
            label: e.market,
            value: e.d,
            muted: !0,
            src: e.prev_source,
          })),
        ],
        (e) => e.toFixed(1),
        ne,
        s,
      ),
        t.querySelectorAll("#hs-movers .em-bars-fill").forEach((e, a) => {
          e.style.background =
            a < L.length ? "var(--hs-better)" : "var(--hs-worse)";
        }),
        t.querySelectorAll("#hs-movers .em-bars-val").forEach((e, a) => {
          e.textContent = (a < L.length ? "−" : "+") + e.textContent;
        }),
        R(
          t.querySelector("#hs-ons"),
          [...h]
            .sort((e, a) => a.ratio - e.ratio)
            .map((e) => ({
              label: `${e.area} · ${e.level.toLowerCase()}`,
              value: e.ratio,
              muted: e.area !== "England",
              src: e.source,
            })),
          l,
          26,
          s,
        );
      const ie = ["High", "Elevated", "Moderate", "Low"],
        re = ["--hs-r4", "--hs-r3", "--hs-r2", "--hs-r0"];
      t.querySelector("#hs-risk").innerHTML = ie
        .map(
          (e, a) => `
      <div><p class="lvl"><i style="background:var(${re[a]})"></i><span class="em-eyebrow">${d(e)} risk</span></p>
      <ul>${_.filter((o) => o.risk === e)
        .map((o) => `<li ${s(o.source)}>${d(o.city)}</li>`)
        .join("")}</ul></div>`,
        )
        .join("");
      const le = t.querySelector("#hs-tbody"),
        q = t.querySelector("#hs-search"),
        se = r.map((e) => ({ ...e, change: f(e) }));
      let G = "rank",
        H = 1;
      function O() {
        const e = q.value.trim().toLowerCase(),
          a = se
            .filter(
              (o) =>
                !e ||
                `${o.market} ${o.nation} ${C[o.nation_code]}`
                  .toLowerCase()
                  .includes(e),
            )
            .sort((o, g) => {
              const m = o[G],
                c = g[G];
              return m == null
                ? 1
                : c == null
                  ? -1
                  : (typeof m == "number"
                      ? m - c
                      : String(m).localeCompare(String(c))) * H;
            });
        le.innerHTML =
          a
            .map(
              (o) => `<tr>
        <td class="r" ${s(o.source)}>${o.rank}</td>
        <td>${d(o.market)}</td><td class="hide-n">${d(C[o.nation_code])}</td>
        <td class="r" ${s(o.source)}>${l(o.median_multiple)}</td>
        <td class="r hide-n" ${s(o.prev_source)}>${o.median_multiple_prev == null ? "n/a" : l(o.median_multiple_prev)}</td>
        <td class="r ${o.change == null ? "" : o.change < 0 ? "down" : o.change > 0 ? "up" : ""}">${o.change == null ? "new" : y(o.change)}</td>
        <td class="hide-n">${J(o.median_multiple)}</td></tr>`,
            )
            .join("") ||
          `<tr><td colspan="7">No market matches “${d(q.value)}”.</td></tr>`;
      }
      t.querySelectorAll(".em-table th[aria-sort]").forEach((e) =>
        e.querySelector("button").addEventListener("click", () => {
          const a = e.dataset.key;
          (H =
            G === a
              ? -H
              : a === "market" || a === "nation" || a === "rank"
                ? 1
                : -1),
            (G = a),
            t
              .querySelectorAll(".em-table th[aria-sort]")
              .forEach((o) =>
                o.setAttribute(
                  "aria-sort",
                  o === e ? (H > 0 ? "ascending" : "descending") : "none",
                ),
              ),
            O();
        }),
      ),
        q.addEventListener("input", O),
        O(),
        B.footnotes(t);
      const VIS = t.querySelector("#em-vis");
      var story = null;
      story = scrolly(t.querySelector('[data-view="story"]'), (e) => {
        VIS.innerHTML = storyVis(e);
        if (e === "nations")
          R(VIS.querySelector(".em-bars"), oe.map((a) => ({ label: C[a.nation_code], value: a.median_multiple, muted: v(a.median_multiple) < 3, src: a.source })), l, 15, s);
        if (e === "deposit")
          R(VIS.querySelector(".em-bars"), DEP.map((a) => ({ label: a.market.split(",")[0], value: j(a.median_multiple, 0.2, 0.1), muted: a !== M, src: a.source })), l, Math.ceil(j(M.median_multiple, 0.2, 0.1)), s);
        if (e === "uk")
          R(VIS.querySelector(".em-bars"), [...h].sort((a, r) => r.ratio - a.ratio).map((a) => ({ label: a.area, value: a.ratio, muted: a.area !== "Kensington and Chelsea", src: a.source })), l, 26, s);
        B.footnotes(VIS.closest(".em-card"));
      });
      t.querySelector(".em-todash").addEventListener("click", () => {
        n.querySelector('.em-viewbtn[data-view="dashboard"]').click();
      });
      function setView(e) {
        t.querySelectorAll(".em-view").forEach((a) => { a.hidden = a.dataset.view !== e; });
        e === "story" ? story && story.redraw() : $.map.resize();
      }
      IV && IV !== "dashboard" && n.querySelector(`.em-viewbtn[data-view="${IV}"]`)?.click();
      function storySteps() {
        const sy = r.find((e) => e.market.startsWith("Sydney")),
          kc = h.find((e) => e.area === "Kensington and Chelsea"),
          eng = h.find((e) => e.area === "England"),
          us = u.find((e) => e.nation_code === "US"),
          miami = _.find((e) => e.city === "Miami"),
          hkRisk = _.find((e) => e.city === "Hong Kong"),
          sev = b[3].n + b[4].n,
          top3 = u.filter((e) => e.nation_code !== "ALL").sort((e, a) => a.median_multiple - e.median_multiple).slice(0, 3).map((e) => C[e.nation_code]),
          step = (id, num, eb, head, txt, extra = "") =>
            `<article class="em-step" data-step="${id}"><p class="em-eyebrow"><span class="num">${num}</span>${d(eb)}</p><h2>${head}</h2><p class="txt">${txt}</p>${extra}</article>`;
        return [
          step("top", "01", "The least affordable", `In ${d(M.market)}, a home costs <span class="accent"><b ${s(M.source)}>${l(M.median_multiple)} years</b></span> of household income.`,
            `That is the median house price divided by median household income. ${d(sy.market.split(",")[0])} is close behind at <b ${s(sy.source)}>${l(sy.median_multiple)}</b>.`),
          step("none", "02", "No affordable market", `Not one of the <b ${s(k.source)}>${r.length}</b> markets is <span class="accent">affordable</span>.`,
            `Demographia calls a multiple of ${l(i[0].max)} or less affordable. <b ${s(k.source)}>${sev}</b> markets, ${Math.round((100 * sev) / r.length)}%, are severely or impossibly unaffordable.`),
          step("nations", "03", "Country by country", `${d(top3[0])}, ${d(top3[1])} and ${d(top3[2])} have <span class="accent">the least affordable homes</span>.`,
            `The US median across its markets is <b ${s(us.source)}>${l(us.median_multiple)}</b>, among the lowest of the eight places surveyed.`),
          step("deposit", "04", "Saving a deposit", `A 20% deposit in ${d(M.market)} takes <span class="accent"><b ${s(M.source)}>${l(j(M.median_multiple, 0.2, 0.1))} years</b></span> to save.`,
            `That assumes a household on the local median income saves 10% of it each year. In ${d(k.market)} the same deposit takes <b ${s(k.source)}>${l(j(k.median_multiple, 0.2, 0.1))} years</b>.`),
          step("uk", "05", "Close-up · England", `In Kensington and Chelsea, a home costs <span class="accent"><b ${s(kc.source)}>${l(kc.ratio)} times</b></span> a full-time salary.`,
            `The ONS measure uses one worker's earnings, so it runs higher than Demographia's. England as a whole is <b ${s(eng.source)}>${l(eng.ratio)}</b>.`),
          step("bubble", "06", "Bubble risk", `Expensive isn't the same as <span class="accent">overvalued</span>.`,
            `UBS rates Hong Kong's bubble risk as <b ${s(hkRisk.source)}>${d(hkRisk.risk.toLowerCase())}</b>, while Miami, far cheaper relative to income, is rated <b ${s(miami.source)}>${d(miami.risk.toLowerCase())}</b>.`),
          step("end", "07", "Explore", `Find <span class="accent">your market</span>.`,
            "The dashboard has the full map, a deposit calculator for every market, the ONS ratios and every source.",
            '<p style="margin-top:24px"><span class="em-toggle"><button type="button" class="em-todash">Open the dashboard</button></span></p>'),
        ].join("");
      }
      function storyVis(e) {
        if (e === "top" || e === "end")
          return `<p class="vt">Median multiple · Q3 2025</p><div class="vbig" ${s(M.source)}>${l(M.median_multiple)}×</div><p class="vsub">${d(M.market)}, the least affordable of ${r.length} markets. A multiple of ${l(i[0].max)} or less counts as affordable.</p>`;
        if (e === "none") return `<p class="vt">${r.length} markets by rating · Q3 2025</p><div>${t.querySelector("#hs-dist").innerHTML}</div>`;
        if (e === "nations") return '<p class="vt">National median multiple · Q3 2025</p><div class="em-bars"></div>';
        if (e === "deposit") return '<p class="vt">Years to save a 20% deposit at 10% of income</p><div class="em-bars"></div>';
        if (e === "uk") return '<p class="vt">House price to earnings · ONS 2025</p><div class="em-bars"></div>';
        if (e === "bubble") return `<p class="vt">UBS bubble risk · 2025</p><div class="hs-risk">${t.querySelector("#hs-risk").innerHTML}</div>`;
        return "";
      }
      function K(e, a, o, g, m = !1) {
        return `<div class="em-kpi"><p class="em-eyebrow">${d(e)}</p><div class="big${m ? " accent" : ""}" ${s(g)}>${d(a)}</div><p class="sub">${d(o)}</p></div>`;
      }
    },
  };
export { He as default };
