# Hidden parametri & linkovi (course / package / eid)

## Kako funkcioniše
Korisnik NE bira course/package u formi. Vrednosti dolaze iz **URL-a**, a koja je
vrednost zavisi od **kog linka je lead došao** (svaka kombinacija ima svoj link,
zakucan na email/dugme/stranicu posle kupovine).

Forma čita parametre iz **`#` (hash)** ili **`?` (query)** — hash ima prednost.
Typeform linkovi koriste `#`, pa ih i mi podržavamo (vidi `getHidden()` u form.js).

- `course`  — koji kurs
- `package` — koji paket (neki kursevi nemaju package)
- `eid`     — jedinstveni ID osobe; **NIJE prisutan ni u jednom marketing linku**
  (ostaje prazan; ako se negde koristi, dolazi iz drugog flow-a, npr. email linka)

## Vrednosti
**course:** `webdesign`, `webflow`, `uiuxdesign`, `logodesign`, `motiondesign`, `aiwebdesign`, `instantklijenti`
**package:** `starter`, `pro`, `ultra`, `starter12`

## Original Typeform linkovi
Baza: `https://naucidizajn.typeform.com/to/AGLMXbqN#course=...&package=...`

| Kurs | Paketi |
|------|--------|
| Web Design | starter, pro, ultra, starter12 |
| Webflow | starter, pro, ultra, starter12 |
| UI UX Design (`uiuxdesign`) | starter, pro, ultra, starter12 |
| Logo Design (`logodesign`) | starter, pro, ultra, starter12 |
| Motion Design (`motiondesign`) | starter |
| AI Web Design (`aiwebdesign`) | — (bez package) |
| Instant klijenti (`instantklijenti`) | — (bez package) |

## Novi linkovi (posle deploy-a na GitHub Pages)
Zameni bazu, parametri ostaju ISTI. Primer:
```
https://<github-user>.github.io/<repo>/#course=webdesign&package=pro
https://<github-user>.github.io/<repo>/#course=uiuxdesign&package=starter
https://<github-user>.github.io/<repo>/#course=aiwebdesign
```
(Ako ide custom domen, npr. `forma.naucidizajn.com`, baza je taj domen + `/#course=...`)

## Webflow napomena
Ako forma ide kao zaseban link (kao i sad na Typeform-u) — samo zameni Typeform
bazu novom. Ako ide u iframe na jednoj Webflow stranici, hash mora da se prosledi
u `src` iframe-a (mogu da dodam JS koji to prenese sa parent stranice).
