// SPDX-FileCopyrightText: 2026 TraceGuard contributors
// SPDX-License-Identifier: Apache-2.0

import { z } from "zod";

const environmentSchema = z
  .object({
    API_PORT: z.coerce.number().int().min(1).max(65_535).default(4000),
    CORS_ORIGINS: z.string().default("http://localhost:3000"),
    DATABASE_URL: z.url(),
    LOG_LEVEL: z
      .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
      .default("info"),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    OIDC_AUDIENCE: z.string().trim().min(1),
    OIDC_ISSUER: z.url(),
    OIDC_JWKS_URL: z.url(),
  })
  .superRefine((environment, context) => {
    if (
      environment.NODE_ENV === "production" &&
      (new URL(environment.OIDC_ISSUER).protocol !== "https:" ||
        new URL(environment.OIDC_JWKS_URL).protocol !== "https:")
    ) {
      context.addIssue({
        code: "custom",
        message: "OIDC identity endpoints must use HTTPS in production",
        path: ["OIDC_ISSUER"],
      });
    }
  });

export function loadEnvironment(environment: NodeJS.ProcessEnv = process.env) {
  const parsed = environmentSchema.parse(environment);

  return {
    corsOrigins: parsed.CORS_ORIGINS.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
    databaseUrl: parsed.DATABASE_URL,
    logLevel: parsed.LOG_LEVEL,
    nodeEnv: parsed.NODE_ENV,
    oidcAudience: parsed.OIDC_AUDIENCE,
    oidcIssuer: parsed.OIDC_ISSUER,
    oidcJwksUrl: parsed.OIDC_JWKS_URL,
    port: parsed.API_PORT,
  };
}
