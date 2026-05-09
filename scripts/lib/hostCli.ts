import {
  type ArgSchema,
  type Args,
  type ArgToken,
  type ArgValues,
  parseArgs as parseGunshiArgs,
  resolveArgs,
} from "gunshi";
import { kebabnize } from "gunshi/utils";

export function resolveHostCliValues<A extends Args>(schema: A, argv: string[]): ArgValues<A> {
  const tokens = parseGunshiArgs(normalizeScriptArgv(argv));
  assertKnownOptions(schema, tokens);
  const result = resolveArgs(schema, tokens, { toKebab: true });
  if (result.error) {
    throw new Error(formatAggregateError(result.error));
  }
  if (result.positionals.length > 0) {
    throw new Error(`Unexpected positional argument: ${result.positionals[0]}`);
  }
  if (result.rest.length > 0) {
    throw new Error(`Unexpected argument after --: ${result.rest[0]}`);
  }
  return result.values;
}

export function formatCliError(error: unknown): string {
  if (error instanceof AggregateError) {
    return formatAggregateError(error);
  }
  if (error instanceof Error) {
    return error.message || error.name;
  }
  return String(error);
}

export function normalizeScriptArgv(argv: string[]): string[] {
  return argv[0] === "--" ? argv.slice(1) : argv;
}

function assertKnownOptions(schema: Args, tokens: ArgToken[]): void {
  const knownLongOptions = new Set<string>();
  const knownShortOptions = new Set<string>();
  for (const [name, arg] of Object.entries(schema)) {
    knownLongOptions.add(name);
    knownLongOptions.add(kebabnize(name));
    if (isArgSchema(arg)) {
      if (arg.short) {
        knownShortOptions.add(arg.short);
      }
      if (arg.type === "boolean" && arg.negatable) {
        knownLongOptions.add(`no-${name}`);
        knownLongOptions.add(`no-${kebabnize(name)}`);
      }
    }
  }

  for (const token of tokens) {
    if (token.kind !== "option") continue;
    const name = token.name ?? "";
    if (token.rawName?.startsWith("--")) {
      if (!knownLongOptions.has(name)) {
        throw new Error(`Unknown option: ${token.rawName}`);
      }
      continue;
    }
    if (!knownShortOptions.has(name)) {
      throw new Error(`Unknown option: ${token.rawName ?? `-${name}`}`);
    }
  }
}

function formatAggregateError(error: AggregateError): string {
  const messages = error.errors.map(formatCliError).filter(Boolean);
  return messages.length > 0 ? messages.join("; ") : "CLI argument validation failed";
}

function isArgSchema(value: unknown): value is ArgSchema {
  return Boolean(value && typeof value === "object" && "type" in value);
}
