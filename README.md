# India AI Summit - Sessions

MongoDB-backed session data with a React frontend to view and edit transcripts.

**Repo:** [summit-data](https://github.com/apexneural-PraveenJogi/summit-data)

## Push this code to summit-data

If this folder is your working copy and you want it to become the summit-data repo:

```bash
git clone https://github.com/apexneural-PraveenJogi/summit-data.git summit-data-repo
# Copy all files from this folder into summit-data-repo (overwriting if needed)
cd summit-data-repo
git add .
git commit -m "Add full app: Node API, React frontend, migrations, Docker"
git push origin main
```

Or from this folder (if it is already a git repo):

```bash
git remote add origin https://github.com/apexneural-PraveenJogi/summit-data.git
git branch -M main
git push -u origin main
```

## Clone and use this code

```bash
git clone https://github.com/apexneural-PraveenJogi/summit-data.git
cd summit-data
```

## Docker

```bash
docker build -t summit-data .
docker run -p 3000:3000 -e MONGODB_URI="mongodb://..." summit-data
```

Set `MONGODB_URI` (and optionally `MONGODB_DB`, `MONGODB_COLLECTION`) for your MongoDB instance. Run migrations before or after first start (e.g. in another container or host with Node).

## Setup (local)

```bash
npm install
cp .env.example .env   # Set MONGODB_URI
npm run migrate:up     # Seed MongoDB
```

## Run

**Development** (API + Vite dev server with hot reload):

```bash
npm run dev
```

- API: http://localhost:3000
- Frontend: http://localhost:5173 (proxies /api to 3000)

**Production** (build + serve):

```bash
npm run build
npm run server
```

- App: http://localhost:3000

## Features

- List sessions with search (title, speakers, description)
- Pagination
- Expand session to see details
- Edit transcript inline, save to MongoDB
- Dark theme UI

## Environment

| Variable | Default |
|----------|---------|
| MONGODB_URI | `mongodb://mongo:...@indian-ai-summit-sessions-ltrzho:27017` |
| MONGODB_DB | `indiaai` |
| MONGODB_COLLECTION | `sessions` |
| PORT | `3000` |
