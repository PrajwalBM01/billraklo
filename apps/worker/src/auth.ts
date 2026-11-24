import "./env";
import { createSharedAuthOptions } from "@billraklo/core";
import { betterAuth } from "better-auth";

export const auth = betterAuth(createSharedAuthOptions());

export type AuthSession = typeof auth.$Infer.Session;
