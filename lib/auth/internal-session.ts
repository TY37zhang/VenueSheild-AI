import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

const LOCAL_SESSION_SCOPE = "local-feed";

function encodeBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createLocalFeedSessionToken(secret: string, ttlSeconds: number) {
  const expiresAtMs = Date.now() + ttlSeconds * 1000;
  const payload = JSON.stringify({
    scope: LOCAL_SESSION_SCOPE,
    exp: expiresAtMs,
    nonce: randomUUID(),
  });
  const encodedPayload = encodeBase64Url(payload);
  const signature = sign(encodedPayload, secret);
  return `${encodedPayload}.${signature}`;
}

export function verifyLocalFeedSessionToken(token: string, secret: string) {
  const parts = token.split(".");
  if (parts.length !== 2) {
    return false;
  }

  const [payload, receivedSignature] = parts;
  const expectedSignature = sign(payload, secret);
  const received = Buffer.from(receivedSignature);
  const expected = Buffer.from(expectedSignature);
  if (received.length !== expected.length) {
    return false;
  }
  if (!timingSafeEqual(received, expected)) {
    return false;
  }

  try {
    const parsed = JSON.parse(decodeBase64Url(payload)) as {
      scope?: string;
      exp?: number;
    };
    if (parsed.scope !== LOCAL_SESSION_SCOPE) {
      return false;
    }
    if (typeof parsed.exp !== "number" || parsed.exp <= Date.now()) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function isInternalTokenValid(receivedToken: string | null, secret: string) {
  if (!receivedToken) return false;
  return receivedToken === secret;
}
