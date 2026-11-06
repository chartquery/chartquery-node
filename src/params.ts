// Generated from the ChartQuery OpenAPI document. Do not edit by hand.

import type { OpenString } from "./types.js";

/** Parameters for operations that take none. */
export type EmptyParams = Record<string, never>;

/** Parameters for `barcode()` — `GET / POST /v1/barcode`. */
export interface BarcodeParams {
  /** The data to encode in the barcode. Examples by type: */
  data: string;
  /** Barcode format. Default: code128. Default: `"code128"`. */
  type?:
    | OpenString<
        | "code128"
        | "code39"
        | "code39ext"
        | "code93"
        | "code93ext"
        | "ean13"
        | "ean8"
        | "ean5"
        | "ean2"
        | "upca"
        | "upce"
        | "itf"
        | "itf14"
        | "codabar"
        | "msi"
        | "pharmacode"
        | "code11"
        | "gs1-128"
        | "gs1-databar"
        | "gs1-databar-limited"
        | "gs1-databar-expanded"
        | "identcode"
        | "leitcode"
        | "postnet"
        | "planet"
        | "plessey"
      >
    | undefined;
  /** Bar height in pixels. Default: 80. Typical values: 50 (compact), 80 (standard), 100–120 (tall labels). Example: ?height=100 */
  height?: number | undefined;
  /** Bar color as a CSS color string. Default: #000. Examples: ?color=%231e293b (dark slate), ?color=%230f172a (near black), ?color=%237c3aed (purple), ?color=%23dc2626 (red). Use %23 to URL-encode the # character. */
  color?: string | undefined;
  /** Show human-readable text below the bars. Example: ?show_text=true. Combine with font_size and text_align for print labels. */
  show_text?: boolean | undefined;
  /** Position of the human-readable text label. Default: bottom. Example: ?text_position=top Default: `"bottom"`. */
  text_position?: OpenString<"bottom" | "top"> | undefined;
  /** Horizontal alignment of the text label. Default: center. Example: ?text_align=left Default: `"center"`. */
  text_align?: OpenString<"center" | "left" | "right"> | undefined;
  /** Font size of the text label in pixels. Default: 14. Example: ?font_size=12 */
  font_size?: number | undefined;
  /** Font family of the text label. Default: monospace. Examples: ?font_family=monospace, ?font_family=sans-serif, ?font_family=Arial */
  font_family?: string | undefined;
  /** Width multiplier per module (bar). Default: 2. Increase for wider, more scannable barcodes. Example: ?bar_width=3 */
  bar_width?: number | undefined;
  /** Extra horizontal spacing between bars in pixels. Default: 0. Example: ?bar_gap=1 */
  bar_gap?: number | undefined;
  /** Background fill color. Default: #fff. Use transparent for no background. Example: ?background=%23f8fafc */
  background?: string | undefined;
  /** Uniform margin around the barcode in pixels. Default: 10. Overridden per side by margin_top/bottom/left/right. Example: ?margin=6 */
  margin?: number | undefined;
  /** Top margin in pixels (overrides margin). Example: ?margin_top=4 */
  margin_top?: number | undefined;
  /** Bottom margin in pixels (overrides margin). Example: ?margin_bottom=4 */
  margin_bottom?: number | undefined;
  /** Left margin in pixels (overrides margin). Example: ?margin_left=8 */
  margin_left?: number | undefined;
  /** Right margin in pixels (overrides margin). Example: ?margin_right=8 */
  margin_right?: number | undefined;
  /** Rotate the barcode by 0, 90, 180 or 270 degrees. Default: 0. Use 90 or 270 for vertical label orientation. Example: ?rotation=90 */
  rotation?: number | undefined;
  /** Add horizontal bearer bars above and below the barcode. Required for ITF-14. Default: false. Example: ?bearer_bars=true */
  bearer_bars?: boolean | undefined;
  /** Measurement unit for dimensions. Default: px. Use mm, in or cm for print-ready output. Example: ?unit=mm Default: `"px"`. */
  unit?: OpenString<"px" | "mm" | "in" | "cm"> | undefined;
  /** Accessible label added as aria-label on the SVG element. Improves screen reader support. Example: ?aria_label=EAN-13+barcode+for+product+4006381333931 */
  aria_label?: string | undefined;
  /** SVG <title> element for tooltip and accessibility. Example: ?title=Product+Barcode */
  title?: string | undefined;
  /** SVG <desc> element for extended accessibility description. Example: ?desc=EAN-13+encoding+GTIN+for+Nivea+cream+75ml */
  desc?: string | undefined;
  /** Output format. Default: svg. Use png to get a raster image. SVG is lossless and scalable; PNG is pixel-based and suitable for email, PDF or messaging. Example: ?format=png Default: `"svg"`. */
  format?: OpenString<"svg" | "png"> | undefined;
  /** Set share=true to persist the config and receive JSON instead of an image: { id, render_url, view_url, embed_url, expires_in }. Free plan: 3-day expiry with watermark. Paid plan: 6-month expiry, no branding. Default: `false`. */
  share?: boolean | undefined;
  /** Comma-separated list of fields to keep in the response, with dot notation for nested fields (e.g. name,location.city). Does not change the credit cost. */
  fields?: string | undefined;
  /** Process the request asynchronously: the response is a job_id to poll on /v1/jobs/{id} (see waitForJob). Default: `false`. */
  is_async?: boolean | undefined;
  /** Return HTTP 200 even when an error occurs; the error is then in the response body. Default: `false`. */
  soft_fail?: boolean | undefined;
}

/** Parameters for `chart()` — `GET / POST /v1/chart`. */
export interface ChartParams {
  /** Full chart config as URL-encoded JSON. Pass ?version= or ?v= separately to pin the chart version. */
  query: string;
  /** Chart.js version to use. Alias: ?v=. Only v4.x is supported. Defaults to the installed version (4.5.1). Example: "4", "4.5", "4.5.1". The installed version is always returned in the X-ChartJS-Version response header. Default: `"4.5.1"`. */
  version?: string | undefined;
  /** If true, persist the result and return share URLs instead of an image. Leave false to get the image. */
  share?: boolean | undefined;
  /** Comma-separated list of fields to keep in the response, with dot notation for nested fields (e.g. name,location.city). Does not change the credit cost. */
  fields?: string | undefined;
  /** Process the request asynchronously: the response is a job_id to poll on /v1/jobs/{id} (see waitForJob). Default: `false`. */
  is_async?: boolean | undefined;
  /** Return HTTP 200 even when an error occurs; the error is then in the response body. Default: `false`. */
  soft_fail?: boolean | undefined;
}

/** Parameters for `chartAi()` — `GET / POST /v1/chart/ai`. */
export interface ChartAiParams {
  /** Describe your chart in plain English (max 1000 chars). Be specific: mention chart type, data topic, colors, style. */
  prompt: string;
  /** Raw data for the chart. URL-encoded string, CSV, or JSON. AI will parse and structure it. */
  raw_data?: string | undefined;
  /** Override the chart title generated by AI. */
  title?: string | undefined;
  /** Override the chart subtitle. */
  subtitle?: string | undefined;
  /** Legend position or visibility. Use "false" to hide. Default: `"top"`. */
  legend?:
    | OpenString<"top" | "bottom" | "left" | "right" | "chartArea" | "false">
    | undefined;
  /** Output format. Default: "png". Default: `"png"`. */
  format?: OpenString<"png" | "svg"> | undefined;
  /** Image width in pixels (50–4000). Default: 1200. */
  width?: number | undefined;
  /** Image height in pixels (50–4000). Default: 600. */
  height?: number | undefined;
  /** Background color as a hex value. Default: #ffffff. */
  background?: string | undefined;
  /** Device pixel ratio for the rendered image. Default: 1. */
  device_pixel_ratio?: number | undefined;
  /** Set share=true to persist the config and receive JSON instead of an image: { id, render_url, view_url, embed_url, expires_in }. Free plan: 3-day expiry with watermark. Paid plan: 6-month expiry, no branding. Default: `false`. */
  share?: boolean | undefined;
  /** Comma-separated list of fields to keep in the response, with dot notation for nested fields (e.g. name,location.city). Does not change the credit cost. */
  fields?: string | undefined;
  /** Process the request asynchronously: the response is a job_id to poll on /v1/jobs/{id} (see waitForJob). Default: `false`. */
  is_async?: boolean | undefined;
  /** Return HTTP 200 even when an error occurs; the error is then in the response body. Default: `false`. */
  soft_fail?: boolean | undefined;
}

/** Parameters for `chartRender()` — `GET /v1/chart/render/{id}`. */
export interface ChartRenderParams {
  /** The chart ID returned in the X-Chart-Render-URL header when saving a chart. Format: cq-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx. */
  id: string;
  /** Override the chart title. */
  title?: string | undefined;
  /** Override X-axis labels. Comma-separated. */
  labels?: string | undefined;
  /** Override first dataset values. Comma-separated numbers. Use data2, data3… for additional datasets. */
  data1?: string | undefined;
  /** Override output width in pixels (50–4000). */
  width?: string | undefined;
  /** Override output height in pixels (50–4000). */
  height?: string | undefined;
  /** Override output format. Default: `"png"`. */
  format?: OpenString<"png" | "svg"> | undefined;
  /** Comma-separated list of fields to keep in the response, with dot notation for nested fields (e.g. name,location.city). Does not change the credit cost. */
  fields?: string | undefined;
  /** Process the request asynchronously: the response is a job_id to poll on /v1/jobs/{id} (see waitForJob). Default: `false`. */
  is_async?: boolean | undefined;
  /** Return HTTP 200 even when an error occurs; the error is then in the response body. Default: `false`. */
  soft_fail?: boolean | undefined;
}

/** Parameters for `chartView()` — `GET /v1/chart/view/{id}`. */
export interface ChartViewParams {
  /** The chart ID returned in the X-Chart-View-URL header when saving a chart. Format: cq-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx. */
  id: string;
  /** Set share=true to persist the config and receive JSON instead of an image: { id, render_url, view_url, embed_url, expires_in }. Free plan: 3-day expiry with watermark. Paid plan: 6-month expiry, no branding. Default: `false`. */
  share?: boolean | undefined;
  /** Comma-separated list of fields to keep in the response, with dot notation for nested fields (e.g. name,location.city). Does not change the credit cost. */
  fields?: string | undefined;
  /** Process the request asynchronously: the response is a job_id to poll on /v1/jobs/{id} (see waitForJob). Default: `false`. */
  is_async?: boolean | undefined;
  /** Return HTTP 200 even when an error occurs; the error is then in the response body. Default: `false`. */
  soft_fail?: boolean | undefined;
}

/** Parameters for `diagram()` — `GET / POST /v1/diagram`. */
export interface DiagramParams {
  /** Diagram language. Default: `"mermaid"`. */
  type: OpenString<
    | "mermaid"
    | "graphviz"
    | "plantuml"
    | "d2"
    | "svgbob"
    | "nomnoml"
    | "blockdiag"
    | "seqdiag"
    | "actdiag"
    | "nwdiag"
    | "bpmn"
    | "erd"
    | "excalidraw"
    | "ditaa"
    | "vega"
    | "vegalite"
    | "wavedrom"
    | "wireviz"
    | "c4plantuml"
    | "structurizr"
    | "tikz"
    | "pikchr"
    | "umlet"
    | "symbolator"
    | "packetdiag"
    | "rackdiag"
    | "bytefield"
    | "dbml"
  >;
  /** Diagram source code (URL-encoded). */
  query: string;
  /** Use png so ChatGPT can display the image. svg is for download or infinite scale. Default: `"svg"`. */
  format?: OpenString<"svg" | "png" | "jpeg" | "pdf"> | undefined;
  /** If true, persist the result and return share URLs instead of an image. Leave false to get the image. */
  share?: boolean | undefined;
  /** Comma-separated list of fields to keep in the response, with dot notation for nested fields (e.g. name,location.city). Does not change the credit cost. */
  fields?: string | undefined;
  /** Process the request asynchronously: the response is a job_id to poll on /v1/jobs/{id} (see waitForJob). Default: `false`. */
  is_async?: boolean | undefined;
  /** Return HTTP 200 even when an error occurs; the error is then in the response body. Default: `false`. */
  soft_fail?: boolean | undefined;
}

/** Parameters for `diagramAi()` — `GET / POST /v1/diagram/ai`. */
export interface DiagramAiParams {
  /** Describe your diagram in plain English (max 1000 chars). Be specific: mention the diagram type, key entities, and relationships. */
  prompt: string;
  /** Preferred diagram language. AI chooses if omitted. Examples: "mermaid", "d2", "plantuml", "graphviz". Default: `"mermaid"`. */
  diagram_type?:
    OpenString<"mermaid" | "d2" | "plantuml" | "graphviz"> | undefined;
  /** Output format. Default: "svg". Default: `"svg"`. */
  output_format?: OpenString<"svg" | "png" | "jpeg" | "pdf"> | undefined;
  /** Set share=true to persist the config and receive JSON instead of an image: { id, render_url, view_url, embed_url, expires_in }. Free plan: 3-day expiry. Paid plan: 6-month expiry. Default: `false`. */
  share?: boolean | undefined;
  /** Comma-separated list of fields to keep in the response, with dot notation for nested fields (e.g. name,location.city). Does not change the credit cost. */
  fields?: string | undefined;
  /** Process the request asynchronously: the response is a job_id to poll on /v1/jobs/{id} (see waitForJob). Default: `false`. */
  is_async?: boolean | undefined;
  /** Return HTTP 200 even when an error occurs; the error is then in the response body. Default: `false`. */
  soft_fail?: boolean | undefined;
}

/** Parameters for `diagramRender()` — `GET /v1/diagram/render/{id}`. */
export interface DiagramRenderParams {
  /** The diagram ID returned in the X-Diagram-Render-URL header when saving a diagram. Format: cq-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx. */
  id: string;
  /** Override output format. Default: `"svg"`. */
  format?: OpenString<"svg" | "png" | "jpeg" | "pdf"> | undefined;
  /** Override the diagram source code (URL-encoded). */
  query?: string | undefined;
  /** Set share=true to persist the config and receive JSON instead of an image: { id, render_url, view_url, embed_url, expires_in }. Free plan: 3-day expiry with watermark. Paid plan: 6-month expiry, no branding. Default: `false`. */
  share?: boolean | undefined;
  /** Comma-separated list of fields to keep in the response, with dot notation for nested fields (e.g. name,location.city). Does not change the credit cost. */
  fields?: string | undefined;
  /** Process the request asynchronously: the response is a job_id to poll on /v1/jobs/{id} (see waitForJob). Default: `false`. */
  is_async?: boolean | undefined;
  /** Return HTTP 200 even when an error occurs; the error is then in the response body. Default: `false`. */
  soft_fail?: boolean | undefined;
}

/** Parameters for `diagramView()` — `GET /v1/diagram/view/{id}`. */
export interface DiagramViewParams {
  /** The diagram ID returned in the X-Diagram-View-URL header when saving a diagram. Format: cq-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx. */
  id: string;
  /** Set share=true to persist the config and receive JSON instead of an image: { id, render_url, view_url, embed_url, expires_in }. Free plan: 3-day expiry with watermark. Paid plan: 6-month expiry, no branding. Default: `false`. */
  share?: boolean | undefined;
  /** Comma-separated list of fields to keep in the response, with dot notation for nested fields (e.g. name,location.city). Does not change the credit cost. */
  fields?: string | undefined;
  /** Process the request asynchronously: the response is a job_id to poll on /v1/jobs/{id} (see waitForJob). Default: `false`. */
  is_async?: boolean | undefined;
  /** Return HTTP 200 even when an error occurs; the error is then in the response body. Default: `false`. */
  soft_fail?: boolean | undefined;
}

/** Parameters for `jobs()` — `GET /v1/jobs/{id}`. */
export interface JobsParams {
  /** The job_id returned by an endpoint called with is_async=true. */
  id: string;
}

/** Parameters for `label()` — `GET / POST /v1/label`. */
export interface LabelParams {
  /** Use png so ChatGPT can display the image. svg is for download or infinite scale. Default: `"svg"`. */
  format?: OpenString<"svg" | "png"> | undefined;
  /** If true, persist the result and return share URLs instead of an image. Leave false to get the image. Default: `false`. */
  share?: boolean | undefined;
  /** Full label config as URL-encoded JSON. Must include width and elements. Text items use content and size (1-10), not text or fontSize. */
  query: string;
  /** Comma-separated list of fields to keep in the response, with dot notation for nested fields (e.g. name,location.city). Does not change the credit cost. */
  fields?: string | undefined;
  /** Process the request asynchronously: the response is a job_id to poll on /v1/jobs/{id} (see waitForJob). Default: `false`. */
  is_async?: boolean | undefined;
  /** Return HTTP 200 even when an error occurs; the error is then in the response body. Default: `false`. */
  soft_fail?: boolean | undefined;
}

/** Parameters for `labelCompile()` — `POST /v1/label/compile`. */
export interface LabelCompileParams {
  /** Label width. Required. Default unit is mm. Example: 40. Do not send query instead of width. */
  width: number;
  /** Label height in the same unit. Example: 30. Omit for receipt / continuous mode. */
  height?: number | undefined;
  /** Measurement unit for width and height. Default mm. Use mm unless you are working in printer dots. Default: `"mm"`. */
  unit?: OpenString<"mm" | "inch" | "dot"> | undefined;
  /** Printer DPI. Default 203. */
  dpi?: number | undefined;
  /** Gap between labels in mm. Ignored for receipts. */
  gap?: number | undefined;
  /** Print speed, 1-18. */
  speed?: number | undefined;
  /** Print darkness, 0-15. */
  density?: number | undefined;
  /** Print direction. 0 = normal, 1 = reversed. Default: `1`. */
  direction?: number | undefined;
  /** Number of copies. Minimum 1. */
  copies?: number | undefined;
  /** Printer profile id (tsc-te210, zebra-zd420, …). */
  printer?: string | undefined;
  /** Required array. Text items need type=text, content, and size (1-10 magnification). Do not use text, fontSize, or type=barcode. Positions x/y are in dots. Example item: {"type":"text","content":"Order: 1042","x":10,"y":10,"size":2}. */
  elements: readonly Record<string, unknown>[];
  /** Required printer language. Example: zpl or tsc. Do not omit. Default: `"tsc"`. */
  language: OpenString<
    | "tsc"
    | "zpl"
    | "epl"
    | "cpcl"
    | "dpl"
    | "sbpl"
    | "escpos"
    | "starprnt"
    | "ipl"
  >;
  /** Comma-separated list of fields to keep in the response, with dot notation for nested fields (e.g. name,location.city). Does not change the credit cost. */
  fields?: string | undefined;
  /** Process the request asynchronously: the response is a job_id to poll on /v1/jobs/{id} (see waitForJob). Default: `false`. */
  is_async?: boolean | undefined;
  /** Return HTTP 200 even when an error occurs; the error is then in the response body. Default: `false`. */
  soft_fail?: boolean | undefined;
}

/** Parameters for `labelConvert()` — `POST /v1/label/convert`. */
export interface LabelConvertParams {
  /** Raw printer commands to convert. Also send from and to. */
  source: string;
  /** Source language. Default: `"tsc"`. */
  from: OpenString<"tsc" | "zpl" | "epl" | "cpcl" | "dpl" | "sbpl" | "ipl">;
  /** Target language. Default: `"tsc"`. */
  to: OpenString<
    | "tsc"
    | "zpl"
    | "epl"
    | "cpcl"
    | "dpl"
    | "sbpl"
    | "escpos"
    | "starprnt"
    | "ipl"
  >;
  /** Override DPI on the converted output. */
  dpi?: number | undefined;
  /** Override print speed, 1-18. */
  speed?: number | undefined;
  /** Override print darkness, 0-15. */
  density?: number | undefined;
  /** Override copies. Minimum 1. */
  copies?: number | undefined;
  /** Comma-separated list of fields to keep in the response, with dot notation for nested fields (e.g. name,location.city). Does not change the credit cost. */
  fields?: string | undefined;
  /** Process the request asynchronously: the response is a job_id to poll on /v1/jobs/{id} (see waitForJob). Default: `false`. */
  is_async?: boolean | undefined;
  /** Return HTTP 200 even when an error occurs; the error is then in the response body. Default: `false`. */
  soft_fail?: boolean | undefined;
}

/** Parameters for `labelParse()` — `POST /v1/label/parse`. */
export interface LabelParseParams {
  /** Raw printer commands to parse. Also send language. */
  source: string;
  /** Language of the source commands. Example: tsc or zpl. Default: `"tsc"`. */
  language: OpenString<"tsc" | "zpl" | "epl" | "cpcl" | "dpl" | "sbpl" | "ipl">;
  /** Comma-separated list of fields to keep in the response, with dot notation for nested fields (e.g. name,location.city). Does not change the credit cost. */
  fields?: string | undefined;
  /** Process the request asynchronously: the response is a job_id to poll on /v1/jobs/{id} (see waitForJob). Default: `false`. */
  is_async?: boolean | undefined;
  /** Return HTTP 200 even when an error occurs; the error is then in the response body. Default: `false`. */
  soft_fail?: boolean | undefined;
}

/** Parameters for `labelRender()` — `GET /v1/label/render/{id}`. */
export interface LabelRenderParams {
  id: string;
  /** Override output format. Default: `"svg"`. */
  format?: OpenString<"svg" | "png"> | undefined;
  /** Comma-separated list of fields to keep in the response, with dot notation for nested fields (e.g. name,location.city). Does not change the credit cost. */
  fields?: string | undefined;
  /** Process the request asynchronously: the response is a job_id to poll on /v1/jobs/{id} (see waitForJob). Default: `false`. */
  is_async?: boolean | undefined;
  /** Return HTTP 200 even when an error occurs; the error is then in the response body. Default: `false`. */
  soft_fail?: boolean | undefined;
}

/** Parameters for `labelValidate()` — `POST /v1/label/validate`. */
export interface LabelValidateParams {
  /** Raw printer commands to validate. Also send language. */
  source: string;
  /** Language of the source commands. Example: tsc or zpl. Default: `"tsc"`. */
  language: OpenString<"tsc" | "zpl" | "epl" | "cpcl" | "dpl" | "sbpl" | "ipl">;
  /** Comma-separated list of fields to keep in the response, with dot notation for nested fields (e.g. name,location.city). Does not change the credit cost. */
  fields?: string | undefined;
  /** Process the request asynchronously: the response is a job_id to poll on /v1/jobs/{id} (see waitForJob). Default: `false`. */
  is_async?: boolean | undefined;
  /** Return HTTP 200 even when an error occurs; the error is then in the response body. Default: `false`. */
  soft_fail?: boolean | undefined;
}

/** Parameters for `labelView()` — `GET /v1/label/view/{id}`. */
export interface LabelViewParams {
  id: string;
  /** Comma-separated list of fields to keep in the response, with dot notation for nested fields (e.g. name,location.city). Does not change the credit cost. */
  fields?: string | undefined;
  /** Process the request asynchronously: the response is a job_id to poll on /v1/jobs/{id} (see waitForJob). Default: `false`. */
  is_async?: boolean | undefined;
  /** Return HTTP 200 even when an error occurs; the error is then in the response body. Default: `false`. */
  soft_fail?: boolean | undefined;
}

/** Parameters for `qrcode()` — `GET / POST /v1/qrcode`. */
export interface QrcodeParams {
  /** Data to encode in the QR code. Examples: */
  data: string;
  /** Output size in pixels (width = height). Default: 200. Examples: ?size=200 (thumbnail), ?size=300 (standard), ?size=400 (large), ?size=600 (poster). For print, use the unit param with mm/cm instead. */
  size?: number | undefined;
  /** Error correction level. Default: M. Higher levels allow more damage/obscuring before the code becomes unreadable. Default: `"M"`. */
  ec_level?: OpenString<"L" | "M" | "Q" | "H"> | undefined;
  /** Module (dot) shape. Default: square. Controls the visual style of each QR code module. Default: `"square"`. */
  dot_type?:
    | OpenString<
        | "square"
        | "rounded"
        | "dots"
        | "diamond"
        | "classy"
        | "classy-rounded"
        | "extra-rounded"
        | "vertical-line"
        | "horizontal-line"
        | "small-square"
        | "tiny-square"
      >
    | undefined;
  /** Module color as CSS hex. Default: #000. Examples: ?color=%236366f1 (indigo), ?color=%23dc2626 (red), ?color=%23059669 (green), ?color=%230891b2 (teal). Use %23 to URL-encode #. For gradient objects, use POST instead. */
  color?: string | undefined;
  /** Overall QR code shape. Default: square. Use circle to clip the entire QR into a circle: great for profile/avatar-style codes. Example: ?shape=circle&dot_type=dots Default: `"square"`. */
  shape?: OpenString<"square" | "circle"> | undefined;
  /** Module size ratio between 0.1 and 1. Default: 1 (full). Values below 1 add spacing between modules for a lighter look. Example: ?dot_size=0.85 */
  dot_size?: number | undefined;
  /** Background color. Default: #fff. Set to transparent for no background. Example: ?background=%230f172a for dark background. Use %23 to encode #. */
  background?: string | undefined;
  /** Quiet zone width in modules around the QR code. Default: 4. Minimum recommended by the QR standard: 4. Example: ?margin=2 (compact) or ?margin=6 (extra padding). */
  margin?: number | undefined;
  /** QR version from 1 to 40 (determines grid size and data capacity). Leave unset for auto-selection based on data length and ec_level. Example: ?version=5 */
  version?: number | undefined;
  /** Encoding mode. Default: auto (best mode selected for the data). Use numeric for digits-only, alphanumeric for uppercase + digits, byte for arbitrary text/UTF-8. Example: ?mode=numeric Default: `"auto"`. */
  mode?: OpenString<"auto" | "numeric" | "alphanumeric" | "byte"> | undefined;
  /** Mask pattern from 0 to 7. Default: auto (best mask selected to minimize visual patterns). Only set manually if you need a deterministic output. Example: ?mask=3 */
  mask?: number | undefined;
  /** Measurement unit for the size param. Default: px. Use mm, in or cm with the size param for print-ready output. Example: ?size=50&unit=mm Default: `"px"`. */
  unit?: OpenString<"px" | "mm" | "in" | "cm"> | undefined;
  /** Prepend an XML declaration (<?xml version="1.0" encoding="UTF-8"?>) to the SVG output. Useful when the SVG will be used as a standalone XML file. Default: false. Example: ?xml_declaration=true */
  xml_declaration?: boolean | undefined;
  /** Accessible label added as aria-label on the SVG element. Example: ?aria_label=QR+code+linking+to+chartquery.com */
  aria_label?: string | undefined;
  /** SVG <title> element shown as a browser tooltip and used by screen readers. Example: ?title=ChartQuery+Website */
  title?: string | undefined;
  /** SVG <desc> element for extended accessibility description. Example: ?desc=Scan+to+visit+https://chartquery.com */
  desc?: string | undefined;
  /** Output format. Default: svg. Use png to get a raster image. SVG is lossless and scalable; PNG is pixel-based and suitable for email, PDF or messaging. Example: ?format=png Default: `"svg"`. */
  format?: OpenString<"svg" | "png"> | undefined;
  /** Set share=true to persist the config and receive JSON instead of an image: { id, render_url, view_url, embed_url, expires_in }. Free plan: 3-day expiry with watermark. Paid plan: 6-month expiry, no branding. Default: `false`. */
  share?: boolean | undefined;
  /** Comma-separated list of fields to keep in the response, with dot notation for nested fields (e.g. name,location.city). Does not change the credit cost. */
  fields?: string | undefined;
  /** Process the request asynchronously: the response is a job_id to poll on /v1/jobs/{id} (see waitForJob). Default: `false`. */
  is_async?: boolean | undefined;
  /** Return HTTP 200 even when an error occurs; the error is then in the response body. Default: `false`. */
  soft_fail?: boolean | undefined;
}

/** Parameters for `stats()` — `GET /v1/stats`. */
export interface StatsParams {
  /** API family to check, for example chart. Provide at least engine or path. */
  engine?: string | undefined;
  /** Specific endpoint to check, for example /v1/chart. If you also pass engine, use an endpoint from that API. */
  path?: string | undefined;
}
