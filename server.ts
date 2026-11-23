import { parse } from "url";
import next from "next";
import { WebSocketServer, WebSocket } from "ws";
import * as fs from "fs";
import * as path from "path";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const channels = new Map<string, Set<WebSocket>>();

function createCertIfNeeded() {
  const certDir = path.join(__dirname, "certs");
  const certFile = path.join(certDir, "cert.pem");
  const keyFile = path.join(certDir, "key.pem");
  if (!fs.existsSync(certDir)) fs.mkdirSync(certDir);
  if (!fs.existsSync(certFile) || !fs.existsSync(keyFile)) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const forge = require("node-forge");
    const keys = forge.pki.rsa.generateKeyPair(2048);
    const cert = forge.pki.createCertificate();
    cert.publicKey = keys.publicKey;
    cert.serialNumber = "01";
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);
    const attrs = [{ name: "commonName", value: "localhost" }];
    cert.setSubject(attrs);
    cert.setIssuer(attrs);
    cert.sign(keys.privateKey, forge.md.sha256.create());
    fs.writeFileSync(certFile, forge.pki.certificateToPem(cert));
    fs.writeFileSync(keyFile, forge.pki.privateKeyToPem(keys.privateKey));
    console.log("> Generated self-signed certificate");
  }
  return { key: fs.readFileSync(keyFile), cert: fs.readFileSync(certFile) };
}

app.prepare().then(() => {
  let server: ReturnType<typeof import("http").createServer>;

  if (dev) {
    const { createServer } = require("http");
    server = createServer((req: import("http").IncomingMessage, res: import("http").ServerResponse) => {
      handle(req, res, parse(req.url!, true));
    });
  } else {
    const { createServer } = require("https");
    const { key, cert } = createCertIfNeeded();
    server = createServer({ key, cert }, (req: import("http").IncomingMessage, res: import("http").ServerResponse) => {
      handle(req, res, parse(req.url!, true));
    });
  }

  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (req: import("http").IncomingMessage, socket: import("net").Socket, head: Buffer) => {
    const { pathname, query } = parse(req.url!, true);
    if (pathname === "/ws") {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit("connection", ws, req, query);
      });
    }
    // let Next.js HMR handle other upgrades
  });

  wss.on("connection", (ws: WebSocket, _req: unknown, query: Record<string, string | string[] | undefined>) => {
    const channel = (query.channel as string) || "default";
    if (!channels.has(channel)) channels.set(channel, new Set());
    channels.get(channel)!.add(ws);

    ws.on("message", (data: Buffer | string) => {
      channels.get(channel)?.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(data.toString());
        }
      });
    });

    ws.on("close", () => {
      channels.get(channel)?.delete(ws);
    });
  });

  const port = 3000;
  server.listen(port, () => {
    console.log(`> Ready on ${dev ? "http" : "https"}://localhost:${port}`);
  });
});
