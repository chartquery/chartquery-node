# ChartQuery Node.js SDK

The official Node.js and TypeScript SDK for the [ChartQuery](https://www.chartquery.com) chart and QR code API.

Generate chart images, diagrams, barcodes, QR codes and thermal labels on demand. PNG, SVG or PDF output.

The SDK exposes **20 typed methods**, one per documented endpoint, plus a generic `request()` for anything else.

## Requirements

- Node.js 20 or newer

## Installation

```sh
npm install @chartquery/sdk
```

The SDK works with TypeScript and JavaScript (ES modules). The examples below use TypeScript; JavaScript users can use the same API by omitting TypeScript-only syntax.

## Get your API key

[Sign up for ChartQuery](https://app.chartquery.com/register) or sign in to your existing account, then copy your API key from the [dashboard](https://app.chartquery.com). Store it securely, for example in the `CHARTQUERY_API_KEY` environment variable, which the client reads by default.

## Quick start

```ts
import { ChartQueryClient } from "@chartquery/sdk";

const client = new ChartQueryClient({ apiKey: process.env.CHARTQUERY_API_KEY });

const response = await client.chartAi({
  prompt: "Monthly revenue 2026 as a bar chart: Jan 10, Feb 14, Mar 18",
});
console.log(response.data);
```

Every method takes a parameter object that mirrors the [API reference](https://app.chartquery.com/openapi) (snake_case names, exactly as documented) and an optional `RequestOptions` object.

## Binary responses

Some endpoints return a file (image, PDF…) instead of JSON. Their methods return an `ApiResponse`, so check `kind`:

```ts
import { writeFile } from "node:fs/promises";

const response = await client.qrcode({
  data: "https://chartquery.com",
  format: "png",
});
if (response.kind === "binary") {
  await writeFile("qrcode.png", response.bytes);
} else {
  console.log(response.data);
}
```

## Async jobs

Any call accepts `is_async: true` (useful past the 60-second server limit): the response is then a `job_id`. `waitForJob()` polls `GET /v1/jobs/{id}` until the job reaches a terminal status (`CompletedJob`, `Error`, `NotFound`, `BadRequest`):

```ts
const submitted = await client.chartAi({
  prompt: "Monthly revenue 2026 as a bar chart: Jan 10, Feb 14, Mar 18",
  is_async: true,
});
const job = await client.waitForJob(submitted.data.job_id, {
  onProgress: (j) => console.log(`${j.status} ${j.progress ?? 0}%`),
});
console.log(JSON.stringify(job.data, null, 2));
```

## GET or POST

Methods use GET when the endpoint supports it: parameters travel in the query string. POST sends the same parameters as a JSON body.

```ts
await client.barcode({ data: "test" }, { method: "POST" });
```

`null`, `undefined` and empty arrays are omitted, `false` and `0` are sent, and arrays repeat the parameter name (`a=1&a=2`).

## Any endpoint

`request()` reaches any path, including endpoints released after this SDK version:

```ts
const response = await client.request("GET", "/v1/usage");
```

## Responses

- `JsonResponse` — `kind: "json"`, the parsed body in `data` (pass a type argument to type it: `client.chartAi<MyType>(…)`).
- `BinaryResponse` — `kind: "binary"`, the body in `bytes` and its `contentType`.

Both keep the buffered `rawResponse` (status, headers, content type, body bytes).

## Errors

```ts
import { ChartQueryApiError } from "@chartquery/sdk";

try {
  await client.chartAi({
    prompt: "Monthly revenue 2026 as a bar chart: Jan 10, Feb 14, Mar 18",
  });
} catch (error) {
  if (error instanceof ChartQueryApiError) {
    console.error(error.status, error.message, error.responseBody);
  }
  throw error;
}
```

| Error                             | When                                                                          |
| --------------------------------- | ----------------------------------------------------------------------------- |
| `ChartQueryConfigurationError`    | Missing API key, invalid options or unsupported method.                       |
| `ChartQuerySerializationError`    | A required parameter is missing or a value can't be sent.                     |
| `ChartQueryTransportError`        | Network failure or client-side timeout.                                       |
| `ChartQueryApiError`              | The API answered with a non-2xx status (`status`, `message`, `responseBody`). |
| `ChartQueryResponseDecodingError` | A success response could not be decoded.                                      |

All of them extend `ChartQueryError`. Common statuses: `400` invalid parameters, `401` invalid API key, `402` no credits left, `429` rate limit exceeded.

## Retries

Requests are retried up to 3 times after a network error, a `408`, `500`, `502`, `503` or `504`, or a rate limit — which the API returns as `401` (or `429`) with a `Rate limit exceeded` message. Per-key quota errors (`…: quota daily`) are not retried, nor are `400`, `402`, `404` or client-side timeouts. The delay starts at 1 second and grows 1.5× per retry (capped at 30 seconds); a `Retry-After` header wins.

```ts
const client = new ChartQueryClient({ maxRetries: 5, retryDelay: 500 });

// or for one request
await client.chartAi(
  { prompt: "Monthly revenue 2026 as a bar chart: Jan 10, Feb 14, Mar 18" },
  { maxRetries: 0 },
);
```

## Batch requests

`batch()` runs a task per item with at most 10 in flight (`concurrency`), and returns one result per item in input order, shaped like `Promise.allSettled`. One failure never stops the others.

```ts
const inputs = [
  "Monthly revenue 2026 as a bar chart: Jan 10, Feb 14, Mar 18",
  "Market share as a pie chart: A 40, B 35, C 25",
];
const results = await client.batch(
  inputs,
  (prompt) => client.chartAi({ prompt }),
  { concurrency: 5 },
);

for (const result of results) {
  if (result.status === "fulfilled") console.log(result.value.data);
  else console.error(inputs[result.index], result.reason);
}
```

| Constant                 | Default  | Description                                                     |
| ------------------------ | -------- | --------------------------------------------------------------- |
| `DEFAULT_CONCURRENCY`    | `10`     | Tasks run at the same time by batch                             |
| `DEFAULT_TIMEOUT_MS`     | `120000` | Request timeout (milliseconds)                                  |
| `MAX_RETRIES`            | `3`      | Retry attempts after a network error, a 408/5xx or a rate limit |
| `RETRY_BACKOFF_FACTOR`   | `1.5`    | Exponential backoff multiplier                                  |
| `DEFAULT_RETRY_DELAY_MS` | `1000`   | Delay before the first retry (milliseconds)                     |

## Timeouts and cancellation

```ts
const client = new ChartQueryClient({ timeout: 60_000 }); // default 120000 ms, 0 disables

await client.chartAi(
  { prompt: "Monthly revenue 2026 as a bar chart: Jan 10, Feb 14, Mar 18" },
  {
    signal: AbortSignal.timeout(30_000),
  },
);
```

## Advanced: custom Fetch transport

```ts
import { ChartQueryClient, type ChartQueryFetch } from "@chartquery/sdk";

const loggingFetch: ChartQueryFetch = async (input, init) => {
  const response = await fetch(input, init);
  console.log(init.method, String(input), response.status);
  return response;
};

const client = new ChartQueryClient({ fetch: loggingFetch });
```

## Endpoints

20 methods, generated from the [OpenAPI document](https://app.chartquery.com/openapi).

| Method            | HTTP                          | Description                                                                                                                                  |
| ----------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `barcode()`       | GET / POST `/v1/barcode`      | Generate a barcode image via GET. Output: SVG (default) or PNG. Supports 25+ formats: EAN-13, Code 128, ITF-14, GS1-128, postal codes and m… |
| `chart()`         | GET / POST `/v1/chart`        | Render a Chart.js image via GET. Pass the full chart object as URL-encoded JSON in query. Prefer format png for ChatGPT. POST sends the sam… |
| `chartAi()`       | GET / POST `/v1/chart/ai`     | Describe a chart in plain English via GET and get a rendered image back. Powered by AI.                                                      |
| `chartRender()`   | GET `/v1/chart/render/{id}`   | Render a previously saved chart by ID. Public, no API key required. Supports URL overrides for templates (?data1=, ?labels=, ?title=…).      |
| `chartView()`     | GET `/v1/chart/view/{id}`     | View a previously saved chart as an interactive HTML page. Public, no API key required. Iframe-embeddable.                                   |
| `diagram()`       | GET / POST `/v1/diagram`      | Render a diagram via GET. Use type (mermaid, d2, …), query (source code), and format=png for ChatGPT. POST uses diagram_type and diagram_so… |
| `diagramAi()`     | GET / POST `/v1/diagram/ai`   | Describe a diagram in plain English via GET and get a rendered image back. Powered by AI.                                                    |
| `diagramRender()` | GET `/v1/diagram/render/{id}` | Render a previously saved diagram by ID. Public, no API key required. Supports ?format= and ?query= overrides.                               |
| `diagramView()`   | GET `/v1/diagram/view/{id}`   | View a previously saved diagram as an HTML page. Public, no API key required. Iframe-embeddable with inline SVG rendering.                   |
| `jobs()`          | GET `/v1/jobs/{id}`           | Poll the status, progress (0–100) and result of a job started with is_async=true. Polling is free. Poll until status is terminal: Completed… |
| `label()`         | GET / POST `/v1/label`        | Preview a thermal label via GET. Pass the same label object as a URL-encoded JSON string in query. Inside that JSON, text items use content… |
| `labelCompile()`  | POST `/v1/label/compile`      | Compile a label to printer commands (tsc, zpl, epl, …). POST width, language, and elements. Text uses content and size (1-10), not text or…  |
| `labelConvert()`  | POST `/v1/label/convert`      | Convert printer commands from one language to another. POST source, from, and to. from is the source language (tsc, zpl, epl, …). to is the… |
| `labelParse()`    | POST `/v1/label/parse`        | Parse printer commands into structured elements. POST source and language (tsc, zpl, epl, …).                                                |
| `labelRender()`   | GET `/v1/label/render/{id}`   | Render a previously saved label by ID. Public, no API key required. Supports ?format= override.                                              |
| `labelValidate()` | POST `/v1/label/validate`     | Validate printer commands. POST source (the raw commands) and language (tsc, zpl, epl, …).                                                   |
| `labelView()`     | GET `/v1/label/view/{id}`     | View a previously saved label as an HTML page. Public, no API key required. Iframe-embeddable with inline SVG rendering.                     |
| `qrcode()`        | GET / POST `/v1/qrcode`       | Generate a styled QR code via GET. Output: SVG (default) or PNG. Supports dot styles, gradients, custom corners and all QR versions.         |
| `stats()`         | GET `/v1/stats`               | Infrastructure health for an engine or endpoint over the last hour. Not scoped to your account or tenant. Enabled per account: HTTP 403 mea… |
| `usage()`         | GET `/v1/usage`               | Return this account's Chartquery usage and credit balance. No body. Requires an API key.                                                     |

## All ChartQuery SDKs

| SDK        | Package                                                                   | Install                                      |
| ---------- | ------------------------------------------------------------------------- | -------------------------------------------- |
| Node.js    | [`@chartquery/sdk`](https://www.npmjs.com/package/@chartquery/sdk)        | `npm install @chartquery/sdk`                |
| Python     | [`chartquery`](https://pypi.org/project/chartquery/)                      | `pip install chartquery`                     |
| Go         | [`chartquery-go`](https://pkg.go.dev/github.com/chartquery/chartquery-go) | `go get github.com/chartquery/chartquery-go` |
| .NET       | [`ChartQuery`](https://www.nuget.org/packages/ChartQuery)                 | `dotnet add package ChartQuery`              |
| Ruby       | [`chartquery`](https://rubygems.org/gems/chartquery)                      | `gem install chartquery`                     |
| PHP        | [`chartquery/sdk`](https://packagist.org/packages/chartquery/sdk)         | `composer require chartquery/sdk`            |
| Java       | [`chartquery-java`](https://github.com/chartquery/chartquery-java)        | build from source, see its README            |
| CLI        | [`@chartquery/cli`](https://www.npmjs.com/package/@chartquery/cli)        | `npm install -g @chartquery/cli`             |
| MCP server | [`@chartquery/mcp`](https://www.npmjs.com/package/@chartquery/mcp)        | `npx -y @chartquery/mcp`                     |

## License

MIT — see [LICENSE](LICENSE).
