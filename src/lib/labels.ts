import type { Domain } from "./types.ts";

export const DOMAIN_LABEL: Record<Domain, string> = {
  claude: "Claude",
  kubernetes: "Kubernetes",
  aws: "AWS",
};

/** Parse and validate a domain passed as a CLI arg. */
export function domainArg(): Domain {
  const d = process.argv[2];
  if (d !== "claude" && d !== "kubernetes" && d !== "aws") {
    throw new Error(`usage: <script> <claude|kubernetes|aws> (got: ${d ?? "nothing"})`);
  }
  return d;
}
