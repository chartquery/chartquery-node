// Generated from the ChartQuery OpenAPI document. Do not edit by hand.

import type { EndpointDefinition } from "./types.js";

/** Every documented operation, keyed by its snake_case name. */
export const ENDPOINTS = {
  barcode: {
    path: "/v1/barcode",
    methods: ["GET", "POST"],
    response: "any",
    required: ["data"],
  },
  chart: {
    path: "/v1/chart",
    methods: ["GET", "POST"],
    response: "any",
    required: ["query"],
  },
  chart_ai: {
    path: "/v1/chart/ai",
    methods: ["GET", "POST"],
    response: "json",
    required: ["prompt"],
  },
  chart_render: {
    path: "/v1/chart/render/{id}",
    methods: ["GET"],
    response: "any",
    required: ["id"],
  },
  chart_view: {
    path: "/v1/chart/view/{id}",
    methods: ["GET"],
    response: "json",
    required: ["id"],
  },
  diagram: {
    path: "/v1/diagram",
    methods: ["GET", "POST"],
    response: "any",
    required: ["type", "query"],
  },
  diagram_ai: {
    path: "/v1/diagram/ai",
    methods: ["GET", "POST"],
    response: "json",
    required: ["prompt"],
  },
  diagram_render: {
    path: "/v1/diagram/render/{id}",
    methods: ["GET"],
    response: "any",
    required: ["id"],
  },
  diagram_view: {
    path: "/v1/diagram/view/{id}",
    methods: ["GET"],
    response: "json",
    required: ["id"],
  },
  jobs: {
    path: "/v1/jobs/{id}",
    methods: ["GET"],
    response: "json",
    required: ["id"],
  },
  label: {
    path: "/v1/label",
    methods: ["GET", "POST"],
    response: "any",
    required: ["query"],
  },
  label_compile: {
    path: "/v1/label/compile",
    methods: ["POST"],
    response: "json",
    required: ["width", "elements", "language"],
  },
  label_convert: {
    path: "/v1/label/convert",
    methods: ["POST"],
    response: "json",
    required: ["source", "from", "to"],
  },
  label_parse: {
    path: "/v1/label/parse",
    methods: ["POST"],
    response: "json",
    required: ["source", "language"],
  },
  label_render: {
    path: "/v1/label/render/{id}",
    methods: ["GET"],
    response: "any",
    required: ["id"],
  },
  label_validate: {
    path: "/v1/label/validate",
    methods: ["POST"],
    response: "json",
    required: ["source", "language"],
  },
  label_view: {
    path: "/v1/label/view/{id}",
    methods: ["GET"],
    response: "json",
    required: ["id"],
  },
  qrcode: {
    path: "/v1/qrcode",
    methods: ["GET", "POST"],
    response: "any",
    required: ["data"],
  },
  stats: {
    path: "/v1/stats",
    methods: ["GET"],
    response: "json",
    required: [],
  },
  usage: {
    path: "/v1/usage",
    methods: ["GET"],
    response: "json",
    required: [],
  },
} as const satisfies Record<string, EndpointDefinition>;

export type EndpointName = keyof typeof ENDPOINTS;
