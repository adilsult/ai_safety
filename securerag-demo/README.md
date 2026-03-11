# SecureRAG Auditor (Demo)

Enterprise-focused AI security demo showing how to detect and prevent permission leakage in RAG systems.

Core concept:
- Compare vulnerable RAG vs permission-verified RAG side-by-side.
- Simulate red-team attacks and show protection outcomes.
- Keep a full audit trail for compliance and enterprise trust.

All data in this repository is synthetic demo data.

## Tech Stack
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Zustand
- Framer Motion
- Recharts
- Sonner (toast notifications)

## Quick Start
```bash
npm install
npm run dev
```

Open:
- `http://localhost:3000`

## Main Routes
- `/` Landing page
- `/overview` Risk dashboard
- `/playground` Insecure vs Secure RAG comparison
- `/redteam` Red-team attack simulator
- `/audit` Audit log + detail modal
- `/docs` How it works (architecture + integration guide)

## Demo Highlights
- Role switcher for 4 personas (`CEO`, `Sales Rep`, `Support Analyst`, `External Partner`)
- Structured field-level redaction + regex fallback
- Deterministic prompt-injection confidence scoring
- Red-team outcomes based on actual response behavior (`blocked`, `partial`, `clean`)
- Live audit entries from Playground and Red Team

## Keyboard Shortcuts
- `Cmd/Ctrl + K` Open quick query modal
- `R` Trigger scan on Overview page

## 5-Minute Demo Script
1. Go to `/overview` and run a scan (`Run New Scan` or `R`).
2. Go to `/playground`, switch to `Support Analyst`, ask about executive salaries.
3. Show leakage in `Insecure RAG` vs safe response in `SecureRAG`.
4. Go to `/redteam`, run several attacks (`001`–`011`) and show blocked/partial/processed outcomes.
5. Go to `/audit`, open a recent row, show permission analysis + timeline + compliance note.
6. Go to `/docs` for architecture and integration tabs (OpenAI/Anthropic/LangChain/LlamaIndex).

## Build Check
```bash
npm run lint
npm run build
```

## Presentation Note
This demo is designed for enterprise security conversations. It is not connected to a real LLM or production customer data.
