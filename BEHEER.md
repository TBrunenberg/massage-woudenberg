# Beheer – Massage Woudenberg by Jaïrus

Voor Tygo. Zo zit de site in elkaar en zo zet je hem (opnieuw) online.

## Hoe het werkt
- `content/` – alle bewerkbare inhoud (YAML en Markdown). Dit past de klant aan via `/admin`.
- `templates/` – het goedgekeurde ontwerp, met alleen de inhoud vervangen door variabelen. Hier verandert de klant niets aan.
- `build.py` – bouwt `content/` + `templates/` naar `dist/` (dezelfde bestandsnamen als het ontwerp).
- `admin/` – het beheerscherm (Decap CMS 3.17.3, vastgezet).
- `.github/workflows/publiceren.yml` – bij elke wijziging bouwt GitHub de site en zet hem op GitHub Pages.

Elke opslag in het beheerscherm = een wijziging (commit) op GitHub = na ongeveer 1 minuut live.

## Lokaal bouwen en bekijken
```
pip install -r requirements.txt
python build.py
python -m http.server -d dist 8000   # open http://localhost:8000
```

## Wat de klant kan aanpassen
- Praktijkgegevens: telefoon, e-mail, adres, reserveringslink, socials, jaren ervaring, Google-score en het aantal reviews (overal tegelijk)
- Tarieven: prijs per 30 en 60 minuten (overal tegelijk), rittenkaarten (toevoegen en verwijderen), informatieblokken
- Reviews op de homepage (toevoegen en verwijderen)
- Homepage: grote titel, introtekst, zin naast de foto
- Per massage: alle teksten, labels, voordelen, de "let op"-opmerking
- Nieuws: berichten toevoegen met datum, samenvatting en foto. Zodra er een bericht is, verschijnen de pagina Nieuws, een nieuwsblok op de homepage en een link in de footer. Zonder berichten zie je niets.

**Niet via het beheerscherm** (vraag aan Tygo): nieuwe massages (daar hoort een eigen illustratie bij), de teksten van Wie ben ik, Intake, Cadeaubon, de "in de buurt"-pagina's, de voorwaarden en de privacyverklaring, en de opbouw of de vormgeving.

## Online zetten (eenmalig)
1. **GitHub**: repository `massage-woudenberg` op het account van Tygo (openbaar; dat is nodig voor gratis GitHub Pages).
2. **GitHub Pages**: Settings → Pages → Source: *GitHub Actions*. De site komt dan op
   `https://tygolbrunenberg-ai.github.io/massage-woudenberg/`.
3. **Login (DecapBridge, gratis: 3 sites, 10 gebruikers per site)**:
   - Maak een account op decapbridge.com → *Create new site*.
   - Git provider: GitHub, repo `tygolbrunenberg-ai/massage-woudenberg`, plus een fine-grained GitHub-token met alleen toegang tot deze repo (Contents: Read and write, Pull requests: Read and write).
   - Decap CMS login URL: `https://<site>/admin/index.html`, auth type *Classic* (e-mail + wachtwoord).
   - Neem het `backend:`-blok dat DecapBridge geeft over in `admin/config.yml` (vervangt `REPO_PLACEHOLDER` / `DECAPBRIDGE_SITE_ID`) en vul `site_url`/`display_url` in.
   - Nodig Jaïrus uit via *Collaborators* (massagewoudenberg@gmail.com). Hij kiest zelf een wachtwoord.
   - Let op: het gratis account van DecapBridge telt 3 sites. Voor meer klanten kost Professional $9 per maand (check de actuele prijs).
4. **Eigen domein** (later, op naam van de klant): Settings → Pages → Custom domain, en bij de domeinregistrar een CNAME naar `tygolbrunenberg-ai.github.io`. Zet daarna `site_url` en de login-URL in DecapBridge op het nieuwe domein.

Er staan geen wachtwoorden of tokens in deze repository. Het token staat alleen bij DecapBridge.

## Iets terugzetten
Elke wijziging is een commit. Op GitHub: open het bestand in `content/` → *History* → kies de vorige versie en zet die terug (of `git revert <commit>`). Na de push staat de oude versie weer live.

## Controle bij oplevering
- Met de oorspronkelijke inhoud zijn alle 24 gebouwde pagina's byte voor byte gelijk aan het goedgekeurde ontwerp.
- Wijzigtest gedaan: prijs, telefoonnummer, adres, rittenkaart verwijderd, review toegevoegd, voordeel toegevoegd, opmerking aan/uit, nieuwsberichten met en zonder foto.
