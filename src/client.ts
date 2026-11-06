import {
  ChartQueryApiError,
  ChartQueryConfigurationError,
  ChartQueryResponseDecodingError,
  ChartQuerySerializationError,
  ChartQueryTransportError,
  ChartQueryJobTimeoutError,
} from "./errors.js";
import { ENDPOINTS, type EndpointName } from "./endpoints.js";
import type * as Params from "./params.js";
import { encodeQueryPairs, serializeRequest } from "./serialization.js";
import type {
  ApiResponse,
  BatchOptions,
  BatchResult,
  BinaryResponse,
  HttpMethod,
  JsonResponse,
  RawResponse,
  RequestOptions,
  ChartQueryClientOptions,
  ChartQueryFetch,
  WaitForJobOptions,
} from "./types.js";
import { VERSION } from "./version.js";

export const DEFAULT_BASE_URL = "https://api.chartquery.com";
export const DEFAULT_TIMEOUT_MS = 120_000;
/** Retries after a network error or a 408, 429, 500, 502, 503 or 504 response. */
export const MAX_RETRIES = 3;
/** Delay before the first retry, in milliseconds. */
export const DEFAULT_RETRY_DELAY_MS = 1_000;
/** Each retry waits this many times longer than the previous one (a Retry-After header wins). */
export const RETRY_BACKOFF_FACTOR = 1.5;
/** Longest wait between two attempts, in milliseconds. */
export const MAX_RETRY_DELAY_MS = 30_000;
/** Tasks run at the same time by batch(). */
export const DEFAULT_CONCURRENCY = 10;
const RETRYABLE_STATUSES = new Set([408, 500, 502, 503, 504]);

/**
 * Server errors and plan rate limits are retried. The API reports rate limits as 401 (or 429) with a
 * "Rate limit exceeded" message; per-key quotas ("…: quota daily") do not reset within seconds, so they are not.
 */
function isRetryable(rawResponse: RawResponse): boolean {
  if (RETRYABLE_STATUSES.has(rawResponse.status)) return true;
  if (rawResponse.status !== 401 && rawResponse.status !== 429) return false;
  const message = (
    createApiError(rawResponse).errorMessage ?? ""
  ).toLowerCase();
  if (message.includes("quota")) return false;
  return (
    message.includes("rate limit") ||
    (rawResponse.status === 429 && message === "")
  );
}
const API_KEY_ENVIRONMENT_VARIABLE = "CHARTQUERY_API_KEY";

type EmptyParams = Params.EmptyParams;

/**
 * Official ChartQuery API client. Create one instance and reuse it.
 */
export class ChartQueryClient {
  readonly #apiKey: string;
  readonly #baseUrl: string;
  readonly #timeout: number;
  readonly #maxRetries: number;
  readonly #retryDelay: number;
  readonly #headers: Readonly<Record<string, string>>;
  readonly #fetch: ChartQueryFetch;

  constructor(options: ChartQueryClientOptions = {}) {
    if (
      typeof options !== "object" ||
      options === null ||
      Array.isArray(options)
    ) {
      throw new ChartQueryConfigurationError(
        "ChartQueryClient options must be an object.",
      );
    }
    const apiKey =
      options.apiKey ?? readEnvironment(API_KEY_ENVIRONMENT_VARIABLE);
    if (typeof apiKey !== "string" || apiKey.trim().length === 0) {
      throw new ChartQueryConfigurationError(
        `A non-blank ChartQuery API key is required. Pass apiKey or set ${API_KEY_ENVIRONMENT_VARIABLE}.`,
      );
    }
    try {
      new Headers({ "x-api-key": apiKey });
    } catch (cause) {
      throw new ChartQueryConfigurationError(
        "The ChartQuery API key cannot be used in an HTTP header.",
        { cause },
      );
    }

    const baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
    let parsedBaseUrl: URL;
    try {
      parsedBaseUrl = new URL(baseUrl);
    } catch (cause) {
      throw new ChartQueryConfigurationError(
        "baseUrl must be an absolute URL.",
        { cause },
      );
    }
    if (
      parsedBaseUrl.protocol !== "https:" &&
      parsedBaseUrl.protocol !== "http:"
    ) {
      throw new ChartQueryConfigurationError("baseUrl must use http or https.");
    }

    const timeout = options.timeout ?? DEFAULT_TIMEOUT_MS;
    if (
      typeof timeout !== "number" ||
      !Number.isFinite(timeout) ||
      timeout < 0
    ) {
      throw new ChartQueryConfigurationError(
        "timeout must be a non-negative number of milliseconds.",
      );
    }

    const maxRetries = options.maxRetries ?? MAX_RETRIES;
    if (!Number.isInteger(maxRetries) || maxRetries < 0) {
      throw new ChartQueryConfigurationError(
        "maxRetries must be a non-negative integer.",
      );
    }
    const retryDelayMs = options.retryDelay ?? DEFAULT_RETRY_DELAY_MS;
    if (
      typeof retryDelayMs !== "number" ||
      !Number.isFinite(retryDelayMs) ||
      retryDelayMs < 0
    ) {
      throw new ChartQueryConfigurationError(
        "retryDelay must be a non-negative number of milliseconds.",
      );
    }

    const fetchImplementation = options.fetch ?? globalThis.fetch;
    if (typeof fetchImplementation !== "function") {
      throw new ChartQueryConfigurationError(
        "A Fetch-compatible transport is required.",
      );
    }

    this.#apiKey = apiKey;
    this.#baseUrl = baseUrl.replace(/\/+$/, "");
    this.#timeout = timeout;
    this.#maxRetries = maxRetries;
    this.#retryDelay = retryDelayMs;
    this.#headers = Object.freeze({ ...(options.headers ?? {}) });
    this.#fetch = options.fetch ?? globalThis.fetch.bind(globalThis);
  }

  /**
   * Sends any request to the ChartQuery API. Use it for endpoints released after this SDK version.
   * GET parameters travel in the query string; POST parameters travel in a JSON body.
   */
  async request<T = any>(
    method: HttpMethod,
    path: string,
    params?: Readonly<Record<string, unknown>> | null,
    options?: RequestOptions | null,
  ): Promise<ApiResponse<T>> {
    return this.#send<T>(method, path, params, options, "any");
  }

  /**
   * Runs `task` for every item with at most `concurrency` tasks in flight (default 10) and returns one result per
   * item, in input order. A failing item never stops the others.
   *
   * ```ts
   * const results = await client.batch(ids, (id) => client.someEndpoint({ query: id }));
   * ```
   */
  async batch<I, T>(
    items: Iterable<I>,
    task: (item: I, index: number) => Promise<T>,
    options: BatchOptions = {},
  ): Promise<BatchResult<T>[]> {
    const list = [...items];
    const concurrency = options.concurrency ?? DEFAULT_CONCURRENCY;
    if (!Number.isInteger(concurrency) || concurrency < 1) {
      throw new ChartQueryConfigurationError(
        "concurrency must be a positive integer.",
      );
    }
    const results: BatchResult<T>[] = new Array(list.length);
    let next = 0;
    const worker = async (): Promise<void> => {
      while (next < list.length) {
        const index = next++;
        options.signal?.throwIfAborted();
        try {
          results[index] = {
            status: "fulfilled",
            index,
            value: await task(list[index]!, index),
          };
        } catch (reason) {
          results[index] = { status: "rejected", index, reason };
        }
      }
    };
    await Promise.all(
      Array.from({ length: Math.min(concurrency, list.length) }, worker),
    );
    return results;
  }

  /**
   * Barcode. Generate a barcode image via GET. Output: SVG (default) or PNG. Supports 25+ formats: EAN-13, Code 128, ITF-14, GS1-128, postal codes and more. Credit cost: 3 credits per call.
   *
   * `GET / POST /v1/barcode`
   */
  barcode<T = any>(
    params: Params.BarcodeParams,
    options?: RequestOptions | null,
  ): Promise<ApiResponse<T>> {
    return this.#call("barcode", params, options) as Promise<ApiResponse<T>>;
  }

  /**
   * Chart. Render a Chart.js image via GET. Pass the full chart object as URL-encoded JSON in query. Prefer format png for ChatGPT. POST sends the same object as a JSON body, not query. Credit cost: 5 credits per call.
   *
   * `GET / POST /v1/chart`
   */
  chart<T = any>(
    params: Params.ChartParams,
    options?: RequestOptions | null,
  ): Promise<ApiResponse<T>> {
    return this.#call("chart", params, options) as Promise<ApiResponse<T>>;
  }

  /**
   * Chart AI. Describe a chart in plain English via GET and get a rendered image back. Powered by AI. Credit cost: 10 credits per call.
   *
   * `GET / POST /v1/chart/ai`
   */
  chartAi<T = any>(
    params: Params.ChartAiParams,
    options?: RequestOptions | null,
  ): Promise<JsonResponse<T>> {
    return this.#call("chart_ai", params, options) as Promise<JsonResponse<T>>;
  }

  /**
   * Chart Render. Render a previously saved chart by ID. Public, no API key required. Supports URL overrides for templates (?data1=, ?labels=, ?title=…).
   *
   * `GET /v1/chart/render/{id}`
   */
  chartRender<T = any>(
    params: Params.ChartRenderParams,
    options?: RequestOptions | null,
  ): Promise<ApiResponse<T>> {
    return this.#call("chart_render", params, options) as Promise<
      ApiResponse<T>
    >;
  }

  /**
   * Chart View. View a previously saved chart as an interactive HTML page. Public, no API key required. Iframe-embeddable.
   *
   * `GET /v1/chart/view/{id}`
   */
  chartView<T = any>(
    params: Params.ChartViewParams,
    options?: RequestOptions | null,
  ): Promise<JsonResponse<T>> {
    return this.#call("chart_view", params, options) as Promise<
      JsonResponse<T>
    >;
  }

  /**
   * Diagram. Render a diagram via GET. Use type (mermaid, d2, …), query (source code), and format=png for ChatGPT. POST uses diagram_type and diagram_source instead. Credit cost: 5 credits per call.
   *
   * `GET / POST /v1/diagram`
   */
  diagram<T = any>(
    params: Params.DiagramParams,
    options?: RequestOptions | null,
  ): Promise<ApiResponse<T>> {
    return this.#call("diagram", params, options) as Promise<ApiResponse<T>>;
  }

  /**
   * Diagram AI. Describe a diagram in plain English via GET and get a rendered image back. Powered by AI. Credit cost: 10 credits per call.
   *
   * `GET / POST /v1/diagram/ai`
   */
  diagramAi<T = any>(
    params: Params.DiagramAiParams,
    options?: RequestOptions | null,
  ): Promise<JsonResponse<T>> {
    return this.#call("diagram_ai", params, options) as Promise<
      JsonResponse<T>
    >;
  }

  /**
   * Diagram Render. Render a previously saved diagram by ID. Public, no API key required. Supports ?format= and ?query= overrides.
   *
   * `GET /v1/diagram/render/{id}`
   */
  diagramRender<T = any>(
    params: Params.DiagramRenderParams,
    options?: RequestOptions | null,
  ): Promise<ApiResponse<T>> {
    return this.#call("diagram_render", params, options) as Promise<
      ApiResponse<T>
    >;
  }

  /**
   * Diagram View. View a previously saved diagram as an HTML page. Public, no API key required. Iframe-embeddable with inline SVG rendering.
   *
   * `GET /v1/diagram/view/{id}`
   */
  diagramView<T = any>(
    params: Params.DiagramViewParams,
    options?: RequestOptions | null,
  ): Promise<JsonResponse<T>> {
    return this.#call("diagram_view", params, options) as Promise<
      JsonResponse<T>
    >;
  }

  /**
   * Jobs. Poll the status, progress (0–100) and result of a job started with is_async=true. Polling is free. Poll until status is terminal: CompletedJob, Error, NotFound or BadRequest.
   *
   * `GET /v1/jobs/{id}`
   */
  jobs<T = any>(
    params: Params.JobsParams,
    options?: RequestOptions | null,
  ): Promise<JsonResponse<T>> {
    return this.#call("jobs", params, options) as Promise<JsonResponse<T>>;
  }

  /**
   * Label Preview. Preview a thermal label via GET. Pass the same label object as a URL-encoded JSON string in query. Inside that JSON, text items use content and size (1-10), not text or fontSize. Prefer format=png for ChatGPT. Credit cost: 3 credits per call.
   *
   * `GET / POST /v1/label`
   */
  label<T = any>(
    params: Params.LabelParams,
    options?: RequestOptions | null,
  ): Promise<ApiResponse<T>> {
    return this.#call("label", params, options) as Promise<ApiResponse<T>>;
  }

  /**
   * Label Compile. Compile a label to printer commands (tsc, zpl, epl, …). POST width, language, and elements. Text uses content and size (1-10), not text or fontSize. No barcode element. Example: {"width":40,"height":30,"unit":"mm","language":"zpl","element… Credit cost: 3 credits per call.
   *
   * `POST /v1/label/compile`
   */
  labelCompile<T = any>(
    params: Params.LabelCompileParams,
    options?: RequestOptions | null,
  ): Promise<JsonResponse<T>> {
    return this.#call("label_compile", params, options) as Promise<
      JsonResponse<T>
    >;
  }

  /**
   * Label Convert. Convert printer commands from one language to another. POST source, from, and to. from is the source language (tsc, zpl, epl, …). to is the target (tsc, zpl, escpos, …). Credit cost: 5 credits per call.
   *
   * `POST /v1/label/convert`
   */
  labelConvert<T = any>(
    params: Params.LabelConvertParams,
    options?: RequestOptions | null,
  ): Promise<JsonResponse<T>> {
    return this.#call("label_convert", params, options) as Promise<
      JsonResponse<T>
    >;
  }

  /**
   * Label Parse. Parse printer commands into structured elements. POST source and language (tsc, zpl, epl, …). Credit cost: 1 credit per call.
   *
   * `POST /v1/label/parse`
   */
  labelParse<T = any>(
    params: Params.LabelParseParams,
    options?: RequestOptions | null,
  ): Promise<JsonResponse<T>> {
    return this.#call("label_parse", params, options) as Promise<
      JsonResponse<T>
    >;
  }

  /**
   * Label Render. Render a previously saved label by ID. Public, no API key required. Supports ?format= override.
   *
   * `GET /v1/label/render/{id}`
   */
  labelRender<T = any>(
    params: Params.LabelRenderParams,
    options?: RequestOptions | null,
  ): Promise<ApiResponse<T>> {
    return this.#call("label_render", params, options) as Promise<
      ApiResponse<T>
    >;
  }

  /**
   * Label Validate. Validate printer commands. POST source (the raw commands) and language (tsc, zpl, epl, …). Credit cost: 1 credit per call.
   *
   * `POST /v1/label/validate`
   */
  labelValidate<T = any>(
    params: Params.LabelValidateParams,
    options?: RequestOptions | null,
  ): Promise<JsonResponse<T>> {
    return this.#call("label_validate", params, options) as Promise<
      JsonResponse<T>
    >;
  }

  /**
   * Label View. View a previously saved label as an HTML page. Public, no API key required. Iframe-embeddable with inline SVG rendering.
   *
   * `GET /v1/label/view/{id}`
   */
  labelView<T = any>(
    params: Params.LabelViewParams,
    options?: RequestOptions | null,
  ): Promise<JsonResponse<T>> {
    return this.#call("label_view", params, options) as Promise<
      JsonResponse<T>
    >;
  }

  /**
   * QR Code. Generate a styled QR code via GET. Output: SVG (default) or PNG. Supports dot styles, gradients, custom corners and all QR versions. Credit cost: 3 credits per call.
   *
   * `GET / POST /v1/qrcode`
   */
  qrcode<T = any>(
    params: Params.QrcodeParams,
    options?: RequestOptions | null,
  ): Promise<ApiResponse<T>> {
    return this.#call("qrcode", params, options) as Promise<ApiResponse<T>>;
  }

  /**
   * Stats. Infrastructure health for an engine or endpoint over the last hour. Not scoped to your account or tenant. Enabled per account: HTTP 403 means contact support to activate it.
   *
   * `GET /v1/stats`
   */
  stats<T = any>(
    params?: Params.StatsParams | null,
    options?: RequestOptions | null,
  ): Promise<JsonResponse<T>> {
    return this.#call("stats", params, options) as Promise<JsonResponse<T>>;
  }

  /**
   * Usage. Return this account's Chartquery usage and credit balance. No body. Requires an API key.
   *
   * `GET /v1/usage`
   */
  usage<T = any>(
    params?: EmptyParams | null,
    options?: RequestOptions | null,
  ): Promise<JsonResponse<T>> {
    return this.#call("usage", params, options) as Promise<JsonResponse<T>>;
  }

  /**
   * Polls `GET /v1/jobs/{id}` until the job reaches a terminal status
   * (CompletedJob, Error, NotFound, BadRequest) and returns the final job document.
   */
  async waitForJob<T = any>(
    jobId: string,
    options: WaitForJobOptions = {},
  ): Promise<JsonResponse<T>> {
    if (typeof jobId !== "string" || jobId.trim().length === 0) {
      throw new ChartQuerySerializationError(
        "A non-blank job id is required.",
        "id",
      );
    }
    let delayMs = options.intervalMs ?? 3_000;
    const maxDelayMs = Math.max(delayMs, MAX_POLL_INTERVAL_MS);
    const timeoutMs = options.timeoutMs ?? 43_200_000;
    const startedAt = Date.now();
    let last: JsonResponse<T> | undefined;
    for (;;) {
      options.signal?.throwIfAborted();
      const response = await this.request<T>(
        "GET",
        "/v1/jobs/{id}",
        { id: jobId },
        options.signal ? { signal: options.signal } : null,
      );
      if (response.kind !== "json") {
        throw new ChartQueryResponseDecodingError(
          "The job endpoint did not return JSON.",
          response.rawResponse,
        );
      }
      last = response;
      options.onProgress?.(last.data);
      const status = (last.data as { status?: unknown } | null)?.status;
      if (typeof status === "string" && JOB_TERMINAL_STATUSES.includes(status))
        return last;
      if (Date.now() - startedAt + delayMs > timeoutMs) {
        throw new ChartQueryJobTimeoutError(jobId, last);
      }
      await sleep(delayMs, options.signal ?? undefined);
      delayMs = Math.min(delayMs * 1.5, maxDelayMs);
    }
  }

  async #call(
    name: EndpointName,
    params: Readonly<object> | null | undefined,
    options: RequestOptions | null | undefined,
  ): Promise<ApiResponse> {
    const endpoint = ENDPOINTS[name];
    const supported: readonly HttpMethod[] = endpoint.methods;
    const method = options?.method ?? supported[0] ?? "GET";
    if (!supported.includes(method)) {
      throw new ChartQueryConfigurationError(
        `${endpoint.path} supports ${supported.join(", ")}, not ${method}.`,
      );
    }
    const values = (params ?? {}) as Readonly<Record<string, unknown>>;
    for (const name of endpoint.required as readonly string[]) {
      if (values[name] === undefined || values[name] === null) {
        throw new ChartQuerySerializationError(
          `The "${name}" parameter is required.`,
          name,
        );
      }
    }
    return this.#send(
      method,
      endpoint.path,
      values,
      { ...options, method },
      endpoint.response,
    );
  }

  async #send<T>(
    method: HttpMethod,
    path: string,
    params: Readonly<Record<string, unknown>> | null | undefined,
    options: RequestOptions | null | undefined,
    expected: "json" | "any",
  ): Promise<ApiResponse<T>> {
    if (method !== "GET" && method !== "POST") {
      throw new ChartQueryConfigurationError(
        `Unsupported HTTP method: ${String(method)}.`,
      );
    }
    if (typeof path !== "string" || !path.startsWith("/")) {
      throw new ChartQueryConfigurationError(
        'The request path must start with "/".',
      );
    }
    const serialized = serializeRequest(method, path, params);
    const url = new URL(this.#baseUrl + serialized.path);
    if (serialized.query.length > 0)
      url.search = encodeQueryPairs(serialized.query);

    const headers = new Headers({
      Accept: "application/json, */*;q=0.8",
      "User-Agent": `chartquery-node/${VERSION}`,
      ...this.#headers,
      ...(options?.headers ?? {}),
      "x-api-key": this.#apiKey,
    });
    const init: RequestInit = { method, headers, redirect: "manual" };
    if (serialized.body !== undefined) {
      headers.set("Content-Type", "application/json");
      init.body = JSON.stringify(serialized.body);
    }

    const timeout = options?.timeout ?? this.#timeout;
    const maxRetries = options?.maxRetries ?? this.#maxRetries;
    let rawResponse: RawResponse;
    for (let attempt = 0; ; attempt++) {
      options?.signal?.throwIfAborted();
      const signals: AbortSignal[] = [];
      if (options?.signal) signals.push(options.signal);
      const deadline = timeout > 0 ? AbortSignal.timeout(timeout) : undefined;
      if (deadline) signals.push(deadline);
      if (signals.length > 0)
        init.signal =
          signals.length === 1 ? signals[0]! : AbortSignal.any(signals);

      try {
        const response = await this.#fetch(url, init);
        const body = new Uint8Array(await response.arrayBuffer());
        rawResponse = createRawResponse(response, body);
      } catch (cause) {
        if (options?.signal?.aborted) throw cause;
        if (deadline?.aborted) {
          throw new ChartQueryTransportError(
            `ChartQuery request timed out after ${timeout} ms.`,
            cause,
          );
        }
        if (attempt < maxRetries) {
          await sleep(
            retryDelay(this.#retryDelay, attempt, undefined),
            options?.signal ?? undefined,
          );
          continue;
        }
        throw new ChartQueryTransportError(
          "ChartQuery request failed before an HTTP response body was received.",
          cause,
        );
      }

      if (rawResponse.status >= 200 && rawResponse.status <= 299) break;
      if (isRetryable(rawResponse) && attempt < maxRetries) {
        const retryAfter = rawResponse.headers.get("retry-after")?.[0];
        await sleep(
          retryDelay(this.#retryDelay, attempt, retryAfter),
          options?.signal ?? undefined,
        );
        continue;
      }
      throw createApiError(rawResponse);
    }
    return decodeSuccessResponse<T>(rawResponse, expected);
  }
}

function retryDelay(
  baseMs: number,
  attempt: number,
  retryAfter: string | undefined,
): number {
  const seconds = retryAfter === undefined ? Number.NaN : Number(retryAfter);
  if (Number.isFinite(seconds) && seconds >= 0)
    return Math.min(seconds * 1_000, 60_000);
  return Math.min(baseMs * RETRY_BACKOFF_FACTOR ** attempt, MAX_RETRY_DELAY_MS);
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = (): void => {
      clearTimeout(timer);
      reject(signal?.reason);
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function readEnvironment(name: string): string | undefined {
  const env = (
    globalThis as { process?: { env?: Record<string, string | undefined> } }
  ).process?.env;
  const value = env?.[name];
  return value === undefined || value === "" ? undefined : value;
}

function createRawResponse(response: Response, body: Uint8Array): RawResponse {
  const headers = new Map<string, readonly string[]>();
  for (const [name, value] of response.headers) {
    headers.set(name.toLowerCase(), Object.freeze([value]));
  }
  const getSetCookie = (
    response.headers as Headers & { getSetCookie?: () => string[] }
  ).getSetCookie;
  if (typeof getSetCookie === "function") {
    const values = getSetCookie.call(response.headers);
    if (values.length > 0)
      headers.set("set-cookie", Object.freeze([...values]));
  }
  return {
    status: response.status,
    statusText: response.statusText,
    headers,
    contentType: response.headers.get("content-type"),
    body,
  };
}

function createApiError(rawResponse: RawResponse): ChartQueryApiError {
  const parsed = tryParseJson(rawResponse.body);
  const objectBody =
    parsed.ok && isJsonObject(parsed.value) ? parsed.value : null;
  let errorMessage: string | undefined;
  for (const key of ["error", "message", "error_message", "detail"]) {
    const value = objectBody?.[key];
    if (typeof value === "string" && value.length > 0) {
      errorMessage = value;
      break;
    }
  }
  return new ChartQueryApiError({
    rawResponse,
    ...(parsed.ok ? { responseBody: parsed.value } : {}),
    ...(errorMessage === undefined ? {} : { errorMessage }),
  });
}

function decodeSuccessResponse<T>(
  rawResponse: RawResponse,
  expected: "json" | "any",
): ApiResponse<T> {
  if (!isJsonMediaType(rawResponse.contentType)) {
    if (expected === "json") {
      throw new ChartQueryResponseDecodingError(
        "ChartQuery returned a successful non-JSON response for a JSON operation.",
        rawResponse,
        new TypeError(
          `Unexpected content type: ${rawResponse.contentType ?? "none"}.`,
        ),
      );
    }
    const binary: BinaryResponse = {
      kind: "binary",
      bytes: rawResponse.body,
      contentType: rawResponse.contentType,
      rawResponse,
    };
    return binary;
  }
  const parsed = tryParseJson(rawResponse.body);
  if (!parsed.ok) {
    throw new ChartQueryResponseDecodingError(
      "ChartQuery returned a successful JSON response that could not be decoded.",
      rawResponse,
      parsed.cause,
    );
  }
  const json: JsonResponse<T> = {
    kind: "json",
    data: parsed.value as T,
    rawResponse,
  };
  return json;
}

function isJsonMediaType(contentType: string | null): boolean {
  if (contentType === null) return false;
  const mediaType = contentType.split(";", 1)[0]?.trim().toLowerCase();
  return (
    mediaType === "application/json" || Boolean(mediaType?.endsWith("+json"))
  );
}

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function tryParseJson(
  body: Uint8Array,
): { ok: true; value: unknown } | { ok: false; cause: unknown } {
  try {
    return { ok: true, value: JSON.parse(new TextDecoder().decode(body)) };
  } catch (cause) {
    return { ok: false, cause };
  }
}

export const JOB_TERMINAL_STATUSES: readonly string[] = [
  "CompletedJob",
  "Error",
  "NotFound",
  "BadRequest",
];
const MAX_POLL_INTERVAL_MS = 60_000;
