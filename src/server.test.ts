import assert from "node:assert/strict";
import test from "node:test";

import { createServer } from "./server.js";

test("HTTP API registers, searches, updates heartbeat, and resolves runtime config", async () => {
  const { server } = createServer();

  await new Promise<void>((resolve) => {
    server.listen(0, resolve);
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Expected TCP server address.");
  }

  const baseUrl = `http://127.0.0.1:${address.port}`;

  await fetch(`${baseUrl}/agents`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "translator",
      version: "3.0.0",
      endpoint: "https://agents.internal/translator",
      supportedProtocols: ["http"],
      inputTypes: ["text/plain"],
      outputTypes: ["text/plain"],
      capabilities: ["translation"],
      tags: ["language", "public"],
      useCases: ["customer-support"],
      ownerTeam: "language-ai",
      authRequirements: {
        type: "apiKey",
        audience: ["marketplace-clients"],
      },
      status: "active",
      deprecated: false,
      accessPolicy: {
        viewers: ["*"],
        invokers: ["support-app", "language-ai"],
      },
    }),
  }).then(async (response) => {
    assert.equal(response.status, 201);
    const body = (await response.json()) as Record<string, unknown>;
    assert.equal(body.name, "translator");
  });

  await fetch(`${baseUrl}/agents/translator/3.0.0/heartbeat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      timestamp: "2026-03-12T11:00:00.000Z",
      status: "active",
    }),
  }).then(async (response) => {
    assert.equal(response.status, 200);
    const body = (await response.json()) as Record<string, unknown>;
    assert.equal(body.lastHeartbeat, "2026-03-12T11:00:00.000Z");
  });

  await fetch(
    `${baseUrl}/agents?tag=public&capability=translation&useCase=customer-support&protocol=http&inputType=text/plain&outputType=text/plain&requester=support-app&page=1&pageSize=10`,
  ).then(async (response) => {
    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      total: number;
      items: Array<{ name: string }>;
    };
    assert.equal(body.total, 1);
    assert.equal(body.items[0]!.name, "translator");
  });

  await fetch(`${baseUrl}/marketplace/overview?requester=support-app&limit=1`).then(async (response) => {
    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      visibleAgents: number;
      callableAgents: number;
      recentlyUpdated: Array<{ name: string }>;
    };
    assert.equal(body.visibleAgents, 1);
    assert.equal(body.callableAgents, 1);
    assert.equal(body.recentlyUpdated[0]?.name, "translator");
  });

  await fetch(`${baseUrl}/resolve/translator?requester=support-app`).then(async (response) => {
    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      endpoint: string;
      authRequirements: { type: string };
    };
    assert.equal(body.endpoint, "https://agents.internal/translator");
    assert.equal(body.authRequirements.type, "apiKey");
  });

  await fetch(`${baseUrl}/resolve/translator?requester=anonymous`).then(async (response) => {
    assert.equal(response.status, 403);
    const body = (await response.json()) as { error: string };
    assert.match(body.error, /cannot invoke translator/);
  });

  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
});

test("HTTP API rejects malformed query and heartbeat input", async () => {
  const { server } = createServer();

  await new Promise<void>((resolve) => {
    server.listen(0, resolve);
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Expected TCP server address.");
  }

  const baseUrl = `http://127.0.0.1:${address.port}`;

  await fetch(`${baseUrl}/agents`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "translator",
      version: "3.0.0",
      endpoint: "https://agents.internal/translator",
      supportedProtocols: ["http"],
      inputTypes: ["text/plain"],
      outputTypes: ["text/plain"],
      capabilities: ["translation"],
      tags: ["language", "public"],
      useCases: ["customer-support"],
      ownerTeam: "language-ai",
      authRequirements: {
        type: "apiKey",
        audience: ["marketplace-clients"],
      },
      status: "active",
      deprecated: false,
      accessPolicy: {
        viewers: ["*"],
        invokers: ["support-app", "language-ai"],
      },
    }),
  }).then(async (response) => {
    assert.equal(response.status, 201);
  });

  await fetch(`${baseUrl}/agents?status=broken`).then(async (response) => {
    assert.equal(response.status, 400);
    const body = (await response.json()) as { error: string };
    assert.match(body.error, /status must be one of/);
  });

  await fetch(`${baseUrl}/agents?page=0`).then(async (response) => {
    assert.equal(response.status, 400);
    const body = (await response.json()) as { error: string };
    assert.match(body.error, /page must be a positive integer/);
  });

  await fetch(`${baseUrl}/agents/translator/3.0.0/heartbeat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      timestamp: 123,
    }),
  }).then(async (response) => {
    assert.equal(response.status, 400);
    const body = (await response.json()) as { error: string };
    assert.match(body.error, /timestamp must be a valid ISO-8601 timestamp/);
  });

  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
});
