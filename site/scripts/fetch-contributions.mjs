// Fetches YOUR real GitHub contribution calendar and writes src/contributions.json.
//
//   GITHUB_TOKEN=<a token with no special scopes> pnpm contributions
//
// The token is read from the environment only; it is never written to disk or
// committed. Public contributions need no scopes (a fine-grained token with
// public-repo read access is enough). Create one at github.com/settings/tokens.
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const login = process.env.GITHUB_LOGIN || "Piyushchy";
const token = process.env.GITHUB_TOKEN;
if (!token) {
  console.error("Set GITHUB_TOKEN first, e.g.  GITHUB_TOKEN=ghp_xxx pnpm contributions");
  process.exit(1);
}

const query = `query($login:String!){
  user(login:$login){
    contributionsCollection{
      contributionCalendar{ weeks{ contributionDays{ date contributionCount } } }
    }
  }
}`;

const res = await fetch("https://api.github.com/graphql", {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "User-Agent": "portfolio-contributions" },
  body: JSON.stringify({ query, variables: { login } }),
});
if (!res.ok) {
  console.error(`GitHub responded ${res.status} ${res.statusText}`);
  process.exit(1);
}
const json = await res.json();
if (json.errors || !json.data?.user) {
  console.error("GitHub returned an error:", JSON.stringify(json.errors ?? json, null, 2));
  process.exit(1);
}

const days = json.data.user.contributionsCollection.contributionCalendar.weeks
  .flatMap((w) => w.contributionDays)
  .map((d) => ({ date: d.date, count: d.contributionCount }));

const out = resolve(dirname(fileURLToPath(import.meta.url)), "../src/contributions.json");
writeFileSync(out, JSON.stringify(days) + "\n");
const total = days.reduce((a, d) => a + d.count, 0);
console.log(`Wrote ${days.length} days (${total} contributions) for ${login} -> src/contributions.json`);
