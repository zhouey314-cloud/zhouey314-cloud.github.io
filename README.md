# Ethan Zhou — Portfolio

Public site: [zhouey314-cloud.github.io](https://zhouey314-cloud.github.io/). The home page keeps six Flagship projects; [Projects / Lab](https://zhouey314-cloud.github.io/projects.html) indexes selected Supporting, Open Source and Lab work with status, evidence and limits.

## Local check

This is a static site. From the repository root:

```bash
node tests/check-site.mjs
python3 -m http.server 8000
```

Open `http://localhost:8000/` and `http://localhost:8000/projects.html`. The Node check verifies required pages, local links and assets, the six Flagship cards, case sections and sitemap entries. It does not replace browser or external-link QA.

## Deployment

GitHub Pages serves the `main` branch at the root URL. [Portfolio static checks](.github/workflows/portfolio-check.yml) run on repository updates; GitHub's Pages workflow handles publication.

## Evidence and reuse boundary

Public demos and images illustrate project scope; they do not establish customer production use or acceptance. The WeChat QR and email on the contact section are intentional public contacts. This repository does not specify a blanket reuse license for text or media; check asset provenance before reuse. Linked projects have their own licenses.
