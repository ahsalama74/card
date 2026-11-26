# Talin Digital Business Card: Ahmed Salama

A static, single-page business card. HTML, CSS and vanilla JavaScript only. No build step, no backend, no subscriptions.

## What is in the package

| File | Purpose |
|---|---|
| `index.html` | The card page and link-preview tags |
| `styles.css` | Talin brand styling (mobile first) |
| `app.js` | Buttons, Share, QR code, QR downloads |
| `config.js` | **Your contact details. Edit this to update the card** |
| `ahmed-salama.vcf` | The file phones save as a contact |
| `assets/ahmed-salama.jpg` | Your headshot (480 x 480) |
| `assets/` | Official Talin logo, icons, background, preview image, QR library (MIT) |
| `.nojekyll` | Tells GitHub Pages to serve files as they are |
| `CNAME.example` | Template for the custom domain |

## 1. Confirmed details

Name, title, company, mobile and WhatsApp (+20 122 218 0080), email, website, LinkedIn (linkedin.com/in/salamaahmed) and Cairo, Egypt were confirmed by Ahmed. The headshot is `assets/ahmed-salama.jpg` and is also embedded (200 px) in the saved contact.

## 2. Deploy on GitHub Pages

1. Create a GitHub repository (for example `card`). Public is required on the free plan.
2. Upload every file in this folder to the repository root (drag and drop works on github.com).
3. Open **Settings > Pages**. Under **Build and deployment**, choose **Deploy from a branch**, branch `main`, folder `/ (root)`, then **Save**.
4. After a minute the card is live at `https://<your-account>.github.io/<repository>/`.

## 3. Use card.talindata.com

1. In your DNS provider for `talindata.com`, add a **CNAME** record: host `card`, value `<your-account>.github.io`.
2. In **Settings > Pages > Custom domain**, enter `card.talindata.com` and save. Tick **Enforce HTTPS** when it becomes available.
3. Rename `CNAME.example` to `CNAME` (keeps the domain setting after uploads).
4. The preview tags in `index.html` already use `https://card.talindata.com/`. If you use a different address, replace it in these places: `canonical`, `og:url`, `og:image`, `twitter:image`.

## 4. Update details later

- Change `config.js` for the buttons and details shown on the page.
- Change `ahmed-salama.vcf` so the saved contact matches.
- If the title or name changes, also update `<title>` and the `og:` / `twitter:` tags in `index.html`. Link previews read the HTML only, not `config.js`.
- The saved contact already includes a 200 px photo (`PHOTO` line). To change it, replace that line with a new base64 JPEG.

## 5. QR code

The QR code is drawn in the browser from the address the card is opened at, so it always matches the live URL. Open the live card, then use **Download PNG** (presentations, 1,584 px) or **Download SVG** (print, scales without loss). Download it from the final address (`card.talindata.com`), not from a preview or local copy. To force a specific address, set `cardUrl` in `config.js`. Test every printed code with a phone before printing in bulk.

## 6. Link previews (WhatsApp, LinkedIn)

Platforms cache previews. After deploying or changing preview tags, refresh LinkedIn at linkedin.com/post-inspector. For WhatsApp, send the link to yourself in a new chat. The preview image is `assets/og-image.jpg` (1200 x 630).

## Notes

- **Save Contact** uses a standard vCard 3.0 file. iPhone opens its contact screen; Android downloads the file and offers to open it in Contacts.
- **Share** uses the phone's share sheet. Browsers without one copy the link.
- Fonts: the card uses the device's own system font, so nothing external loads. Raleway was delivered only in Thin and Italic, so it is not used on the card.
- Tested at 320, 390 and 1280 px wide in Chromium. Please also test once on your iPhone (Safari) and an Android phone (Chrome) after deploying.
- The QR library is `qrcode-generator` 1.4.4 by Kazuhiko Arase (MIT). "QR Code" is a registered trademark of Denso Wave.
