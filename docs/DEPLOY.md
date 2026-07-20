# Deploy guide — ct-agentic-connect

How to run the minimum-cart **API Extension** against the same commercetools Project as [zero-to-ct-storefront](https://github.com/tomasz-miller/zero-to-ct-storefront).

> **Warning:** Once the Extension is registered, **every** Cart Create/Update in that Project goes through it (Merchant Center included). A high `MIN_CART_CENT_AMOUNT` can break storefront demos. Prefer a low threshold for shared demo projects, or deploy to a dedicated Project first.

## Prerequisites

- Node.js 22 + npm
- GitHub repo: https://github.com/tomasz-miller/ct-agentic-connect (this code)
- API client with at least `manage_extensions` (and usual project scopes used by post-deploy)
- Optional: [ngrok](https://ngrok.com/) for local HTTP destination before Connect hosting

## Option A — Local service + public tunnel (fastest smoke test)

1. Configure `service/.env` from `.env.example` (use the **Admin** / Integration client for the storefront Project if registering the Extension yourself).
2. Start the service:

```bash
cd service
npm install
npm run build
npm start
# listens on :8080 — Extension path is POST /service
```

3. Expose it:

```bash
ngrok http 8080
# note https://xxxx.ngrok-free.app
```

4. Register the Extension (URL must include `/service`):

```bash
export CONNECT_SERVICE_URL="https://xxxx.ngrok-free.app/service"
cd service && npm run build && npm run connector:post-deploy
```

Or create Extension `ct-agentic-connect-cartUpdate` in Merchant Center → Settings → Developer settings → Extensions.

5. Smoke from the storefront: add a cheap line item so `totalPrice.centAmount` &lt; `MIN_CART_CENT_AMOUNT` — Cart update should fail with `InvalidInput`.

6. Remove when done:

```bash
cd service && npm run connector:pre-undeploy
# stop ngrok
```

## Option B — commercetools Connect hosting (durable)

Official flow: [Get started with Connect](https://docs.commercetools.com/connect/getting-started) · [Connector development workflow](https://docs.commercetools.com/certifications/build-and-deploy-custom-connector/connector-development-workflow).

### 1. Git tag

Connectors reference a **repository URL + git tag**:

```bash
git tag v0.1.0
git push origin v0.1.0
```

If the GitHub repo is private, grant read access to the [connect-mu](https://github.com/connect-mu) machine user.

### 2. Create ConnectorStaged

In Merchant Center: **Manage organizations & teams** → Organization → **Connect** → **Organization connectors** → **Create Connector**.

Or via Connect API `POST /connectors/drafts` with something like:

```json
{
  "key": "ct-agentic-connect-min-cart",
  "name": "CT Agentic Connect — Min Cart Value",
  "description": "API Extension service enforcing a configurable minimum cart totalPrice",
  "creator": {
    "name": "Columbus",
    "email": "your-email@example.com",
    "company": "Columbus",
    "title": "Engineering",
    "noOfDevelopers": 1
  },
  "repository": {
    "url": "https://github.com/tomasz-miller/ct-agentic-connect.git",
    "tag": "v0.1.0"
  },
  "privateProjects": ["europe-west1.gcp:YOUR_PROJECT_KEY"],
  "supportedRegions": ["europe-west1.gcp"]
}
```

Replace `YOUR_PROJECT_KEY` with the zero-to-ct-storefront Project key. Keep the Connector **private** for this PoC (no marketplace certification required).

### 3. Preview / publish for private use / deploy

1. Request **Previewable** (or publish for private use) as needed for your org.
2. **Deploy** the Connector into the storefront Project.
3. Fill secured configuration: `CTP_PROJECT_KEY`, `CTP_CLIENT_ID`, `CTP_CLIENT_SECRET`, `CTP_SCOPE`.
4. Optional: `MIN_CART_CENT_AMOUNT`, `MIN_CART_CURRENCY`, `CTP_REGION`.
5. Confirm `post-deploy` created Extension key `ct-agentic-connect-cartUpdate`.

### 4. Verify with the storefront

1. Open https://zero-to-ct-storefront.vercel.app/ (or local `pnpm dev`).
2. Add items until total is below the configured minimum — add-to-cart / quantity change should error.
3. Raise the cart above the minimum — updates succeed; checkout still works.

## Scopes cheat sheet

| Purpose | Scopes (typical) |
|---------|------------------|
| post-deploy Extension CRUD | `manage_extensions` |
| Runtime service (this PoC) | No CT API calls at request time — validation is local to the Extension payload |

Use a dedicated Integration API client for Connect; do not reuse Frontend B2C client secrets in Connect secured config.

## Rollback

- Connect: undeploy / uninstall the Deployment (runs `pre-undeploy` → deletes Extension).
- Local: `npm run connector:pre-undeploy` or delete Extension in Merchant Center.
