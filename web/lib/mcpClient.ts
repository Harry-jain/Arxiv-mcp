import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";
import fs from "fs";

// Reuse a single MCP client + subprocess across requests in dev/server mode.
let clientPromise: Promise<Client> | null = null;

function getServerCommand() {
  const serverDir = path.join(process.cwd(), "..", "server");
  const serverPath = path.join(serverDir, "main.py");

  // If PYTHON_BIN is set explicitly, always respect it.
  if (process.env.PYTHON_BIN) {
    return { pythonBin: process.env.PYTHON_BIN, serverPath };
  }

  // Otherwise, look for a local venv next to server/main.py first — this is
  // the #1 cause of "No module named 'arxiv'": npm run dev spawning the
  // system python3 instead of the venv where requirements were installed.
  const candidates =
    process.platform === "win32"
      ? [path.join(serverDir, ".venv", "Scripts", "python.exe")]
      : [
          path.join(serverDir, ".venv", "bin", "python"),
          path.join(serverDir, "venv", "bin", "python"),
        ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return { pythonBin: candidate, serverPath };
    }
  }

  // Fall back to whatever's on PATH.
  const fallback = process.platform === "win32" ? "python" : "python3";
  return { pythonBin: fallback, serverPath };
}

export async function getMcpClient(): Promise<Client> {
  if (clientPromise) return clientPromise;

  clientPromise = (async () => {
    const { pythonBin, serverPath } = getServerCommand();

    if (!fs.existsSync(pythonBin) && !pythonBin.match(/^python3?$/)) {
      throw new Error(
        `Python interpreter not found at ${pythonBin}. Create a venv in server/ and install requirements.txt, or set PYTHON_BIN in web/.env.local.`
      );
    }

    const transport = new StdioClientTransport({
      command: pythonBin,
      args: [serverPath],
      stderr: "pipe",
    });

    const client = new Client(
      { name: "arxiv-mcp-web", version: "0.1.0" },
      { capabilities: {} }
    );

    // Surface Python-side errors (like ModuleNotFoundError) in the Next.js server logs
    // instead of a bare connection failure.
    transport.stderr?.on("data", (chunk: Buffer) => {
      console.error("[arxiv-mcp server]", chunk.toString());
    });

    await client.connect(transport);
    return client;
  })();

  return clientPromise;
}

export async function callTool(name: string, args: Record<string, unknown>) {
  const client = await getMcpClient();
  const result = await client.callTool({ name, arguments: args });
  // FastMCP returns tool output as a JSON-stringified text content block.
  const textBlock = (result.content as any[])?.find((c) => c.type === "text");
  if (!textBlock) return null;
  try {
    return JSON.parse(textBlock.text);
  } catch {
    return textBlock.text;
  }
}
