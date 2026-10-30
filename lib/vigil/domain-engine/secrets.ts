import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { DomainEngineError } from "./errors";

export type DomainSecretContext = {
  organizationId: string;
  recordId: string;
  purpose: "registrant" | "dns_authorization";
};
type Envelope = {
  version: 1;
  keyId: string;
  iv: string;
  tag: string;
  ciphertext: string;
};

/** Keys live in server configuration; ciphertext alone is stored in the private schema. */
export class DomainSecretCodec {
  constructor(
    private readonly keys: Readonly<Record<string, Buffer>>,
    private readonly activeKeyId: string,
  ) {
    if (
      !/^[a-zA-Z0-9_-]{1,64}$/.test(activeKeyId) ||
      !keys[activeKeyId] ||
      Object.values(keys).some((key) => key.length !== 32)
    )
      throw secretError();
  }

  encrypt(value: unknown, context: DomainSecretContext): string {
    const plaintext = JSON.stringify(value);
    if (!plaintext || Buffer.byteLength(plaintext) > 64_000)
      throw secretError();
    const iv = randomBytes(12);
    const cipher = createCipheriv(
      "aes-256-gcm",
      this.keys[this.activeKeyId],
      iv,
    );
    cipher.setAAD(associatedData(context));
    const ciphertext = Buffer.concat([
      cipher.update(plaintext, "utf8"),
      cipher.final(),
    ]);
    const envelope: Envelope = {
      version: 1,
      keyId: this.activeKeyId,
      iv: iv.toString("base64"),
      tag: cipher.getAuthTag().toString("base64"),
      ciphertext: ciphertext.toString("base64"),
    };
    return JSON.stringify(envelope);
  }

  decrypt<T>(encrypted: string, context: DomainSecretContext): T {
    try {
      if (encrypted.length > 90_000) throw secretError();
      const envelope = JSON.parse(encrypted) as Envelope;
      const key = this.keys[envelope.keyId];
      if (envelope.version !== 1 || !key || key.length !== 32)
        throw secretError();
      const iv = Buffer.from(envelope.iv, "base64");
      const tag = Buffer.from(envelope.tag, "base64");
      if (iv.length !== 12 || tag.length !== 16) throw secretError();
      const decipher = createDecipheriv("aes-256-gcm", key, iv);
      decipher.setAAD(associatedData(context));
      decipher.setAuthTag(tag);
      return JSON.parse(
        Buffer.concat([
          decipher.update(Buffer.from(envelope.ciphertext, "base64")),
          decipher.final(),
        ]).toString("utf8"),
      ) as T;
    } catch {
      throw secretError();
    }
  }
}

export function createDomainSecretCodec(
  env: Record<string, string | undefined> = process.env,
): DomainSecretCodec {
  try {
    const activeKeyId = env.VIGIL_DOMAIN_ACTIVE_KEY_ID ?? "";
    const configured: unknown = JSON.parse(
      env.VIGIL_DOMAIN_ENCRYPTION_KEYS ?? "{}",
    );
    if (
      !configured ||
      typeof configured !== "object" ||
      Array.isArray(configured)
    )
      throw secretError();
    const keys: Record<string, Buffer> = Object.create(null);
    for (const [id, value] of Object.entries(configured)) {
      if (
        !/^[a-zA-Z0-9_-]{1,64}$/.test(id) ||
        typeof value !== "string" ||
        !/^[A-Za-z0-9+/]{43}=$/.test(value)
      )
        throw secretError();
      keys[id] = Buffer.from(value, "base64");
    }
    return new DomainSecretCodec(keys, activeKeyId);
  } catch {
    throw secretError();
  }
}

function associatedData(context: DomainSecretContext): Buffer {
  const uuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (
    !uuid.test(context.organizationId) ||
    !uuid.test(context.recordId) ||
    !["registrant", "dns_authorization"].includes(context.purpose)
  )
    throw secretError();
  return Buffer.from(
    `vigil-domain:v1:${context.purpose}:${context.organizationId.toLowerCase()}:${context.recordId.toLowerCase()}`,
  );
}
function secretError() {
  return new DomainEngineError(
    "domain_secret_unavailable",
    "The protected domain information could not be accessed.",
    503,
  );
}
