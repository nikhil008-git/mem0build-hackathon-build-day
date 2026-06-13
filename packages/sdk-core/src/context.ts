import { AsyncLocalStorage } from "node:async_hooks";
import type { RunContext } from "./types.js";

const storage = new AsyncLocalStorage<RunContext>();

export function enterRunContext(ctx: RunContext): void {
  storage.enterWith(ctx);
}

export function getCurrentRun(): RunContext | undefined {
  return storage.getStore();
}

export function runInContext<T>(ctx: RunContext, fn: () => T): T {
  return storage.run(ctx, fn);
}
