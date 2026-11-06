# Economy Monitor

Twelve open-data dashboards on the systems behind everyday life. Every number links to the report it came from, and all the data is free to download.

| Dashboard | What it shows |
|---|---|
| [Chokepoints](chokepoints/) | Ships and oil through the world's narrow sea routes, and what the 2026 closure of the Strait of Hormuz did to them |
| [Electricity Mix & Grid Carbon](electricity/) | What 195 countries make their electricity from, and how much carbon each kilowatt-hour carries |
| [The Air We Breathe](air/) | Fine-particle pollution in every country against the WHO guideline, and the deaths linked to it |
| [Housing Affordability](housing/) | What homes cost against what households earn, in 96 major markets |
| [Water Stress](water/) | How much of their renewable freshwater countries withdraw, and who lacks safe drinking water |
| [The Scam Economy](scams/) | Money lost to scams, as reported to national agencies and estimated by surveys |
| [Where the Internet Lives](internet/) | Submarine cables, cloud regions, AI compute, and the power and water data centres use |
| [Who Owns Orbit](orbit/) | Who launches objects into space, and what is up there now |
| [Food Prices & Hunger](food/) | Who goes hungry, who can afford a healthy diet, and how fast food prices are rising, country by country |
| [Debt vs Public Services](debt/) | What governments pay in interest on their debts, against what they spend on health and education |
| [Extreme Heat](heat/) | How hot the world is getting, which countries face the most dangerous heat, and what it costs in lives and work |
| [Critical Minerals](minerals/) | Where the minerals in batteries, phones and power grids are mined and refined, and who controls them |

## Running it locally

The site is plain HTML, CSS and JavaScript with no build step. Serve the folder with any static web server, or use the included one (Node.js 18 or later):

```sh
node scripts/serve.mjs
```

Then open http://localhost:8765/. Opening the HTML files directly from disk won't work, because browsers block the dashboards' scripts and data on `file://` pages.

## The data

Each dashboard's tables are in `data/<dashboard>/` as CSV and JSON, with a `sources.json` listing every publisher, and a data page that links to them. [METHODOLOGY.md](METHODOLOGY.md) explains how each dashboard's figures are made and what they leave out. The Food, Debt, Heat and Minerals tables can be rebuilt from fresh downloads with the scripts in [scripts/build/](scripts/build/README.md).

## Licences

- **Code:** MIT, see [LICENSE](LICENSE).
- **Data:** our compilation is CC BY 4.0. Some underlying data has stricter terms, notably TeleGeography's cable data, which is non-commercial. See [DATA_LICENSE.md](DATA_LICENSE.md).

## Contributing

Corrections with a link to a better source are very welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

Made by [jahitjanberk](https://github.com/jahitjanberk). More on the [About page](about/).
