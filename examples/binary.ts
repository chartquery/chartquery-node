import { writeFile } from "node:fs/promises";
import { ChartQueryClient } from "@chartquery/sdk";

const client = new ChartQueryClient({ apiKey: process.env.CHARTQUERY_API_KEY });

const response = await client.qrcode({
  data: "https://chartquery.com",
  format: "png",
});
if (response.kind === "binary") {
  await writeFile("qrcode.png", response.bytes);
  console.log(
    `Saved qrcode.png (${response.contentType}, ${response.bytes.length} bytes)`,
  );
} else {
  console.log(JSON.stringify(response.data, null, 2));
}
