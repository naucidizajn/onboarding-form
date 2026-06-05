# Upitnik za nove studente — custom forma (zamena za Typeform)

Statička HTML/CSS/JS replika Typeform forme `AGLMXbqN`. Hostuje se na GitHub
Pages, embeduje u Webflow. Na submit šalje JSON na Make webhook.

## Fajlovi
| Fajl | Šta je |
|---|---|
| `index.html` | Ulazna stranica |
| `style.css` | Stil (tema izvučena 1:1 sa Typeform-a) |
| `form.js` | Sva pitanja + logika + slanje na webhook |

## 1. Postavi Make webhook (OBAVEZNO)
1. U Make-u napravi scenario → modul **Webhooks → Custom webhook** → kopiraj adresu.
2. Otvori `form.js`, na vrhu zalepi adresu u:
   ```js
   const WEBHOOK_URL = "https://hook.eu2.make.com/xxxxxxxx";
   ```
3. (Opciono) postavi `const DEBUG = false;` kad završiš testiranje.

## 2. Šta forma šalje (payload za Make)
```json
{
  "form": "Upitnik za nove studente",
  "form_id": "AGLMXbqN",
  "submitted_at": "2026-06-05T12:00:00.000Z",
  "hidden": { "course": "...", "package": "...", "eid": "..." },
  "answers": [
    { "ref": "ime", "question": "Tvoje ime", "type": "short_text", "answer": "Marko" }
  ]
}
```
- `hidden` se puni iz URL parametara: `...?course=X&package=Y&eid=Z`
- Svaki odgovor ima stabilan `ref` (npr. `ime`, `email`, `pol`) — koristi to u Make-u.

## 3. GitHub Pages
1. Napravi repo, ubaci `index.html`, `style.css`, `form.js`.
2. Settings → Pages → Source: `main` / root → Save.
3. Forma je živa na `https://<user>.github.io/<repo>/`.

## 4. Webflow embed
Embed element sa iframe-om ka GitHub Pages URL-u (vidi uputstvo u chatu).

## Lokalno testiranje
```
npx serve -l 4321 .
```
Otvori http://localhost:4321 — na submit pogledaj F12 konzolu (DEBUG payload).
