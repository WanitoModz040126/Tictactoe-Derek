# Derek Snake Game

Dark, Material 3 inspired Snake game. Node.js + Express server, hardened
with `helmet` (security headers) at `express-rate-limit` (basic anti-DDoS).

Created By **Jhon Dherick Pableo Rosal**

## Laro / Gameplay

- Standard snake: gumagalaw gamit ang `WASD` o arrow keys, lumalabas sa
  isang gilid ay lumalabas naman sa kabila (wrap-around).
- Bawat apple na nakain = **+5%** sa Growth meter (20 segments total).
- Pagkatapos makain ang **19th apple** → 95% ang meter.
- Ang **20th apple** na mag-spawn ay hindi na totoong apple — sa sandaling
  makain ito, sasabog at lalabas ang "You Lose" popup.
- Pagpindot ng **Try Again** → mag-o-overlay ng black screen sa loob ng
  laro at magpe-play ng random video (`assets/1.mp4` hanggang `6.mp4`),
  may **Back** button para bumalik sa laro (fresh restart).

## Setup (local)

```bash
npm install
npm start
```

Bubukas ang server sa `http://localhost:3000`.

## Bago mag-deploy

Ilagay ang 6 na video file sa `/assets` folder:
`1.mp4, 2.mp4, 3.mp4, 4.mp4, 5.mp4, 6.mp4` (basahin ang
`assets/README.txt`).

## Deploy sa Railway

1. I-push ang buong project na ito sa isang GitHub repo.
2. Sa Railway: **New Project → Deploy from GitHub repo**.
3. Awtomatikong ma-detect ni Railway ang Node app (`npm install` +
   `npm start`, tulad ng nakalagay sa `Procfile`).
4. Walang kailangang environment variable — gumagamit lang ng
   `process.env.PORT` na awtomatikong ibinibigay ni Railway.
5. Deploy, then buksan ang generated `*.up.railway.app` domain.

## Security notes

- `helmet` — Content-Security-Policy, no-sniff, frame-deny, atbp.
- `express-rate-limit` — limitado ang requests kada IP kada minuto
  (pangkalahatan + hiwalay na limiter para sa `/assets`).
- Walang dynamic na routes na tumatanggap ng user input o file
  upload, kaya wala ring paraan para may mag-deface sa site sa
  runtime — static files lang ang sino-serve.
- Static serving ay `dotfiles: "deny"` at walang directory listing.
