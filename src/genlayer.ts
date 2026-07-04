import { createClient, createAccount } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";

export const CONTRACT = "0x4181d858238BBDBfdBA7881DDfbF42E12DFb88B3" as `0x${string}`;
export const EXPLORER = "https://explorer-bradbury.genlayer.com";
export const CHAIN_ID = 4221;
export const RPC = "https://rpc-bradbury.genlayer.com";
export const RELEASE_ROUNDS_REQUIRED = 3;
export const SCORE_SCALE = 1000;

// Read-only client: works in-browser against the CORS-open RPC, no wallet needed.
const reader = createClient({ chain: testnetBradbury, account: createAccount() });

type Arg = string | number | bigint;
async function readRaw(functionName: string, args: Arg[]): Promise<unknown> {
  return reader.readContract({ address: CONTRACT, functionName, args });
}

export type Milestone = { id: string; text: string };
export type Covenant = {
  status: string;
  escrow_atto: string;
  maturity_score: number;
  consecutive_release_rounds: number;
  last_eval_epoch: number;
  terms: { title?: string; milestones?: Milestone[]; evidence_sources?: string[] };
};
export type Claim = { verdict: string; confidence: number; epoch: number };
export type Settlement = { action: string; nonce: number; verdicts: { milestone_id: string; verdict: string }[] };

function parse<T>(v: unknown): T | null {
  try {
    const o = JSON.parse(typeof v === "string" ? v : String(v));
    return o && typeof o === "object" && Object.keys(o).length ? (o as T) : null;
  } catch {
    return null;
  }
}

export const getCovenant = async (id: string) => parse<Covenant>(await readRaw("get_covenant_state", [id]));
export const getClaim = async (id: string, mid: string) => parse<Claim>(await readRaw("get_claim", [id, mid]));
export const getSettlement = async (id: string) => parse<Settlement>(await readRaw("get_settlement", [id]));

export const genAmount = (atto: string): string => {
  try {
    return (Number(BigInt(atto || "0")) / 1e18).toString();
  } catch {
    return "0";
  }
};

export const fmtInt = (s: string): string => {
  try {
    return BigInt(s || "0").toLocaleString("en-US");
  } catch {
    return s;
  }
};

// Write client built from a Privy wallet's EIP-1193 provider.
export function makeWriteClient(address: string, provider: unknown) {
  return createClient({ chain: testnetBradbury, account: address as `0x${string}`, provider: provider as never });
}

export async function writeCovenant(
  client: ReturnType<typeof makeWriteClient>,
  functionName: string,
  args: Arg[],
): Promise<string> {
  const tx = await client.writeContract({ address: CONTRACT, functionName, args, value: 0n });
  return String(tx);
}
