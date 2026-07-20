# ct-agentic-connect

[![Columbus](https://raw.githubusercontent.com/tomasz-miller/commercetools-agentic-playbook/main/assets/columbus-logotype.svg)](https://www.columbusglobal.com/)

Agentic PoC: a commercetools **Connect `service` application** that registers an **API Extension** on Cart Create/Update and enforces a configurable **minimum cart value**.

Companion to [zero-to-ct-storefront](https://github.com/tomasz-miller/zero-to-ct-storefront) (same CT project later) and documented in [commercetools-agentic-playbook](https://github.com/tomasz-miller/commercetools-agentic-playbook).

Built with the official [Connect TypeScript starter](https://docs.commercetools.com/connect/development) and intended to demonstrate the [`commercetools-connect`](https://docs.commercetools.com/dev-tooling/skills/commercetools-connect) skill surface.

## What it does

| Piece | Behaviour |
|-------|-----------|
| HTTP `/service` | Receives API Extension payloads for `resource.typeId = cart` |
| Validation | If the cart has line items and `totalPrice.centAmount` &lt; `MIN_CART_CENT_AMOUNT`, returns HTTP **400** with Extension `errors[]` |
| Empty carts | Always allowed (create / clear still works) |
| Currency filter | Optional `MIN_CART_CURRENCY` — when set, only that currency is enforced |
| `post-deploy` | Creates/replaces Extension key `ct-agentic-connect-cartUpdate` pointing at the Connect service URL |

Default minimum: **1000** centAmount (= **10.00** in major units for 2-fraction currencies).

## Repository layout

```text
connect.yaml          # Connect deployment config (service only)
service/              # Connect service application (Node 22, npm)
  src/
    controllers/      # Extension routing + cart handler
    services/         # Min-cart business rule (unit-tested)
    connector/        # post-deploy / pre-undeploy Extension lifecycle
```

Connect builds with **npm** (or Yarn if a lockfile is present) — not pnpm. See [supported runtimes](https://docs.commercetools.com/connect/supported-runtimes).

## Local development

```bash
cd service
cp .env.example .env   # fill CTP_* credentials (manage_extensions for post-deploy)
npm install
npm test
npm run build
npm run start:dev      # listens on :8080
```

Smoke the Extension payload:

```bash
curl -sS -X POST http://localhost:8080/service \
  -H 'content-type: application/json' \
  -d '{
    "action": "Update",
    "resource": {
      "typeId": "cart",
      "id": "demo",
      "obj": {
        "id": "demo",
        "lineItems": [{ "id": "li-1" }],
        "totalPrice": {
          "type": "centPrecision",
          "currencyCode": "EUR",
          "centAmount": 500,
          "fractionDigits": 2
        }
      }
    }
  }'
```

Expect HTTP 400 and an `InvalidInput` error mentioning the minimum.

## Deploying with Connect

1. Push this repo to GitHub (already: `tomasz-miller/ct-agentic-connect`).
2. In Merchant Center / Connect: create a Connector from the repo, deploy to the **same project** as zero-to-ct-storefront.
3. Provide secured config: `CTP_PROJECT_KEY`, `CTP_CLIENT_ID`, `CTP_CLIENT_SECRET`, `CTP_SCOPE` (include `manage_extensions`).
4. Optional standard config: `MIN_CART_CENT_AMOUNT`, `MIN_CART_CURRENCY`, `CTP_REGION`.
5. After deploy, `post-deploy` registers the Extension. Cart updates below the minimum fail at the API (storefront BFF will surface the error).

Local tunnel alternative (before Connect deploy): expose `:8080` (ngrok/cloudflared), create the Extension manually or set `CONNECT_SERVICE_URL` and run `npm run connector:post-deploy`.

## Wiring to zero-to-ct-storefront

No storefront code change is required for the rule to apply — Extensions run on **all** Cart API traffic for the project. Optional follow-ups:

- Map Extension `InvalidInput` messages to a clearer cart UI banner
- Align `MIN_CART_CURRENCY` with the active market (DE→EUR, GB→GBP, US→USD) via separate deployments or a multi-currency rule later

## License

[MIT](./service/LICENSE) (from Connect starter templates)

---

Published by [Columbus](https://www.columbusglobal.com/) — enablement PoC for agentic commercetools delivery.
