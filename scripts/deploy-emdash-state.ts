import { readFile } from "node:fs/promises";
import { type ArgValues, cli, define } from "gunshi";
import {
  createEmDashApiClient,
  type EmDashConnectionOptions,
  emdashConnectionArgs,
  readOptionalString,
  resolveEmDashConnectionOptions,
} from "./lib/emdashConnection.ts";
import {
  applyEmDashDeploymentPlan,
  buildDeployableState,
  createEmDashDeployApi,
  type DeployableState,
  planEmDashDeployment,
  UnsupportedDeployableStateError,
} from "./lib/emdashDeploy.ts";
import { formatCliError, normalizeScriptArgv, resolveHostCliValues } from "./lib/hostCli.ts";

const DEFAULT_SEED_PATH = "seed/seed.json";

const deployArgs = {
  ...emdashConnectionArgs,
  seed: {
    type: "string",
    description: `Seed file to read deployable state from (default: ${DEFAULT_SEED_PATH})`,
  },
  dryRun: {
    type: "boolean",
    description: "Compare desired state with the selected EmDash instance without writing",
  },
  apply: {
    type: "boolean",
    description: "Apply planned changes and verify the selected EmDash instance",
  },
} as const;

type DeployCliValues = ArgValues<typeof deployArgs>;

type DeployCliOptions = EmDashConnectionOptions & {
  seedPath: string;
  mode: "dry-run" | "apply";
};

async function main(argv: string[], env: NodeJS.ProcessEnv): Promise<void> {
  const normalizedArgv = normalizeScriptArgv(argv);
  const command = define({
    name: "deploy:emdash",
    description: "Deploy EmDash schema and settings from the local seed through the selected EmDash API",
    args: deployArgs,
    toKebab: true,
    rendering: {
      header: null,
      validationErrors: null,
    },
    run: async (ctx) => {
      await runDeployEmDashState(parseArgs(ctx._, env));
    },
  });

  await cli(normalizedArgv, command, { name: "deploy:emdash" });
}

async function runDeployEmDashState(options: DeployCliOptions): Promise<void> {
  const apiClient = createEmDashApiClient(options);
  const api = createEmDashDeployApi(apiClient);
  const seed = JSON.parse(await readFile(options.seedPath, "utf8")) as unknown;
  let desired: DeployableState;
  try {
    desired = buildDeployableState(seed);
  } catch (error) {
    if (!(error instanceof UnsupportedDeployableStateError)) {
      throw error;
    }
    console.log(
      JSON.stringify(
        {
          ok: false,
          dryRun: options.mode === "dry-run",
          applied: false,
          seedPath: options.seedPath,
          summary: { total: 0, byAction: {} },
          changes: [],
          unsupported: error.unsupported,
        },
        null,
        2,
      ),
    );
    process.exitCode = 1;
    return;
  }
  const plan = await planEmDashDeployment(api, desired);

  if (options.mode === "dry-run" || !plan.ok) {
    const output = {
      ok: plan.ok,
      dryRun: true,
      applied: false,
      seedPath: options.seedPath,
      summary: plan.summary,
      changes: plan.changes,
      unsupported: plan.unsupported,
    };
    console.log(JSON.stringify(output, null, 2));
    if (!output.ok) process.exitCode = 1;
    return;
  }

  const result = await applyEmDashDeploymentPlan(api, desired, plan);
  const output = {
    ok: result.ok,
    dryRun: false,
    applied: result.applied,
    seedPath: options.seedPath,
    summary: result.summary,
    changes: result.changes,
    unsupported: result.unsupported,
    verification: result.verification,
  };
  console.log(JSON.stringify(output, null, 2));
  if (!output.ok) process.exitCode = 1;
}

function parseArgs(args: string[], env: NodeJS.ProcessEnv): DeployCliOptions {
  return resolveOptions(resolveHostCliValues(deployArgs, args), env);
}

function resolveOptions(values: DeployCliValues, env: NodeJS.ProcessEnv): DeployCliOptions {
  const dryRun = values.dryRun ?? false;
  const apply = values.apply ?? false;
  if (Number(dryRun) + Number(apply) !== 1) {
    throw new Error("Pass exactly one of --dry-run or --apply");
  }

  return {
    ...resolveEmDashConnectionOptions(values, env),
    seedPath: readOptionalString(values.seed) ?? DEFAULT_SEED_PATH,
    mode: dryRun ? "dry-run" : "apply",
  };
}

export const testInternals = {
  parseArgs,
  resolveOptions,
};

if (import.meta.url === `file://${process.argv[1]}`) {
  main(process.argv.slice(2), process.env).catch((error) => {
    console.error(JSON.stringify({ ok: false, error: formatCliError(error) }));
    process.exit(1);
  });
}
