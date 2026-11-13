# Security

Ledger Monitor is a static site: plain HTML, CSS, JavaScript and data files. It has no accounts, no cookies and no server-side code, and it collects no personal data. Nothing you type into a search box leaves your browser; the only thing the site stores there is your light or dark theme choice. The pages load nothing from other sites, and a Content-Security-Policy enforces that (see [`_headers`](_headers)).

## Reporting a problem

If you find a security problem, such as a way to run script on the site, a weakness in the Content-Security-Policy or the embed page, or something unsafe in the helper scripts under `scripts/`, please report it privately:

**[Report a vulnerability](https://github.com/jahitjanberk/ledger-monitor/security/advisories/new)** (GitHub's private reporting form; only the maintainer sees it)

Please don't open a public issue for a security problem. You should get a reply within a week. Once it is fixed, the fix is noted in the change list on the [About page](about/index.html), with credit if you would like it.

Wrong or out-of-date numbers aren't security problems. Report those with an ordinary [issue](https://github.com/jahitjanberk/ledger-monitor/issues/new/choose).

## Supported versions

Only the current `main` branch, which is what the live site serves.
