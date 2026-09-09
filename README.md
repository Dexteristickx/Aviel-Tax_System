# Aviel Alpha — Integrated Tax System

**AI-powered tax consultation and reporting system with PDF report generation.**

Live: [aviel-tax-system.vercel.app](https://aviel-tax-system.vercel.app)

---

## What It Does

A full-stack tax management system for Aviel Alpha Secretaries Ltd. Clients submit intake forms, the system forwards data to a Google Sheets webhook for processing, and generates branded PDF tax analysis reports that clients can download. Includes rate limiting and CORS security on the serverless API layer.

---

## Features

- **Tax Intake Form** — detailed client data collection
- **Google Sheets Integration** — form submissions piped to a live spreadsheet for accountant review
- **PDF Report Generation** — branded, downloadable tax analysis reports
- **Email Notifications** — automated email on submission
- **Serverless API** — Vercel Functions for form handling, PDF generation, and email
- **Rate Limiting** — per-IP submission throttle (10 requests/minute)
- **CORS Security** — locked to `aasecretaries.com.ng` in production

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | HTML5 + CSS3 + JavaScript |
| API | Vercel Serverless Functions (Node.js) |
| PDF | Custom PDF generator (`_lib/pdf-generator.js`) |
| Email | Serverless email function |
| Data | Google Sheets webhook |
| Deployed | Vercel |

---

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /api/submit` | Submit intake form, forward to Google Sheets |
| `POST /api/report` | Generate tax analysis report |
| `GET /api/download-pdf` | Download generated PDF report |
| `POST /api/email` | Send confirmation email to client |

---

## Environment Variables

```
GOOGLE_SHEETS_WEBHOOK_URL=your_webhook_url
EMAIL_API_KEY=your_email_key
```

---

## Run Locally

```bash
git clone https://github.com/Dexteristickx/Aviel-Tax_System
cd Aviel-Tax_System
npm install
vercel dev
```

---

## Author

**Dickson Okiemute Tetteh** — Fullstack Developer
- GitHub: [@Dexteristickx](https://github.com/Dexteristickx)
