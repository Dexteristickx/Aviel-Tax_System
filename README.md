# Aviel Tax System

Aviel Tax System is a modern, unified Client Intake & Tax Consultation portal designed for Aviel Alpha Secretaries Ltd and aaLawsng (Aviel Avenante Law Practice). It helps streamline tax intake questionnaires, generate interactive Tax Health Reports using Anthropic's Claude API, automatically sync clients to a centralized Google Sheet, and dispatch PDF/HTML formatted advisory reports via the Resend Email API.

## Features

1. **Dual Intake Tracks**: Separate, dynamic forms tailored for **Business** (incorporation, revenue, industry-specific compliance) and **Individual** (employment, income sources, residency tax compliance) clients.
2. **Tax Health & Risk Scoring**: Automatic client-side risk scoring logic based on Nigerian tax guidelines (CIT, PAYE, VAT, etc.).
3. **AI-Powered Reports**: Generates custom, comprehensive Tax Health Reports by passing structured intake data to the Anthropic API.
4. **Secure Vercel Functions**: Backend endpoints (`/api/report`, `/api/submit`, `/api/email`) protected by Map-based IP rate limiters and locked-down CORS origin policy.
5. **Multi-Channel Delivery**: Automatic synchronization of client data to a Google Sheet via webhooks and immediate HTML/Plaintext email report dispatch.

---

## Technology Stack

- **Frontend**: Vanilla HTML5, CSS3 (modern responsive grid, dark mode, custom glassmorphism components), and JavaScript (ES6+).
- **Backend**: Node.js Serverless Functions deployed on Vercel.
- **APIs & Tools**:
  - **Anthropic API** (Claude-3 models for advisory generation)
  - **Resend API** (Transactional emails)
  - **Google Sheets** (Customer management database webhook)

---

## Configuration & Environment Variables

To deploy or run the serverless functions locally, configure the following environment variables in Vercel or in a local `.env` file:

| Variable | Description | Example / Format |
| :--- | :--- | :--- |
| `ANTHROPIC_API_KEY` | Secret key for the Anthropic API to generate reports. | `sk-ant-api03-...` |
| `RESEND_API_KEY` | API key from Resend for email dispatch. | `re_123456...` |
| `GOOGLE_SHEET_WEBHOOK` | Target URL of the Google Sheet App Script webhook. | `https://script.google.com/macros/s/.../exec` |
| `FROM_EMAIL` | Sender address shown in generated report emails (must be verified in Resend). | `Aviel Alpha <hello@aasecretaries.com.ng>` |
| `ADMIN_EMAIL` | Destination email to receive BCC copies of all client reports. | `sprqsm001@gmail.com` |

---

## Local Development Setup

To test the application locally, you will need Node.js and the Vercel CLI installed.

### 1. Install Dependencies
Run the following command in the project root to install Node dependencies for local testing:
```bash
npm install
```

### 2. Run Vercel Dev
Use the Vercel CLI to run the development server with local serverless function support:
```bash
npx vercel dev
```
By default, this launches the server on `http://localhost:3000`.

---

## Production Deployment

This project is pre-configured for seamless deployment to **Vercel**.

1. Connect this repository to your Vercel account.
2. Add the required environment variables in the project settings on the Vercel Dashboard.
3. Configure the Node.js function settings inside the provided `vercel.json` file.
4. Deploy the main branch!

## License

This project is private and confidential property of Aviel Alpha Secretaries Ltd.
