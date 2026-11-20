import { createServer } from "node:http";

const messages = new Map();
const port = Number(process.env.WANAS_MAIL_CAPTURE_PORT ?? 3109);

createServer(async (request, response) => {
  response.setHeader("Content-Type", "application/json");
  if (request.url !== "/emails") {
    response.writeHead(404).end("{}");
    return;
  }
  if (request.method === "GET") {
    response.end(JSON.stringify([...messages.values()]));
    return;
  }
  const key = request.headers["idempotency-key"];
  if (request.method !== "POST" || typeof key !== "string") {
    response.writeHead(400).end('{"name":"invalid_request"}');
    return;
  }
  try {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    const message = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!messages.has(key)) messages.set(key, message);
    response.end(JSON.stringify({ id: key }));
  } catch {
    response.writeHead(400).end('{"name":"invalid_request"}');
  }
}).listen(port, "127.0.0.1");
