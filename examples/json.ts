import { ChartQueryClient } from "@chartquery/sdk";

const client = new ChartQueryClient({ apiKey: process.env.CHARTQUERY_API_KEY });

const response = await client.chartAi({
  prompt: "Monthly revenue 2026 as a bar chart: Jan 10, Feb 14, Mar 18",
});
console.log(JSON.stringify(response.data, null, 2));
