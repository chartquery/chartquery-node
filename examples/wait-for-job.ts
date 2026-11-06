import { ChartQueryClient } from "@chartquery/sdk";

const client = new ChartQueryClient({ apiKey: process.env.CHARTQUERY_API_KEY });

const submitted = await client.chartAi({
  prompt: "Monthly revenue 2026 as a bar chart: Jan 10, Feb 14, Mar 18",
  is_async: true,
});
const job = await client.waitForJob(submitted.data.job_id, {
  onProgress: (j) => console.log(`${j.status} ${j.progress ?? 0}%`),
});
console.log(JSON.stringify(job.data, null, 2));
