import {
  readFileSync,
  readdirSync,
  statSync,
  existsSync,
  writeFileSync,
  mkdirSync,
  copyFileSync,
} from "fs";
import { join, dirname } from "path";
import type { ChainConfig } from "../src/types/chain";
import type { WalletConfig } from "../src/types/wallet";
import type { TokenConfig } from "../src/types/token";

const root = process.cwd();
const assetsRoot = join(root, "src", "assets");
const publicAssetsRoot = join(root, "public", "assets");
const indexOutputPath = join(root, "src", "lib", "assets-index.ts");

/**
 * Copy a file from src to dest, ensuring the destination directory exists.
 */
function copyFileSafe(src: string, dest: string) {
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(src, dest);
  console.log(`[prepare-assets] ${src} -> ${dest}`);
}

/**
 * Process chain resources: sync to public/assets and collect configs.
 */
function processChains(): ChainConfig[] {
  const chains: ChainConfig[] = [];
  const srcChainsDir = join(assetsRoot, "chains");
  const destChainsDir = join(publicAssetsRoot, "chains");

  if (!existsSync(srcChainsDir)) return chains;

  const namespaceDirs = readdirSync(srcChainsDir);
  for (const namespace of namespaceDirs) {
    const namespaceFull = join(srcChainsDir, namespace);
    if (!statSync(namespaceFull).isDirectory()) continue;

    const referenceDirs = readdirSync(namespaceFull);
    for (const reference of referenceDirs) {
      const refFull = join(namespaceFull, reference);
      if (!statSync(refFull).isDirectory()) continue;

      const jsonSrc = join(refFull, "chain.json");
      const svgSrc = join(refFull, "icon.svg");

      // Load config
      if (existsSync(jsonSrc)) {
        try {
          const content = readFileSync(jsonSrc, "utf-8");
          const config = JSON.parse(content) as ChainConfig;
          chains.push(config);

          // Sync JSON to public
          const jsonDest = join(destChainsDir, namespace, reference, "chain.json");
          copyFileSafe(jsonSrc, jsonDest);
        } catch (error) {
          console.error(`[prepare-assets] Error parsing ${jsonSrc}:`, error);
        }
      }

      // Sync SVG to public
      if (existsSync(svgSrc)) {
        const svgDest = join(destChainsDir, namespace, reference, "icon.svg");
        copyFileSafe(svgSrc, svgDest);
      }
    }
  }

  return chains;
}

/**
 * Process wallet resources: sync to public/assets and collect configs.
 */
function processWallets(): WalletConfig[] {
  const wallets: WalletConfig[] = [];
  const srcWalletsDir = join(assetsRoot, "wallets");
  const destWalletsDir = join(publicAssetsRoot, "wallets");

  if (!existsSync(srcWalletsDir)) return wallets;

  const entries = readdirSync(srcWalletsDir);
  for (const entry of entries) {
    const full = join(srcWalletsDir, entry);
    if (!statSync(full).isDirectory()) continue;

    const jsonSrc = join(full, "wallet.json");
    const svgSrc = join(full, "wallet.svg");

    // Load config
    if (existsSync(jsonSrc)) {
      try {
        const content = readFileSync(jsonSrc, "utf-8");
        const config = JSON.parse(content) as WalletConfig;
        wallets.push(config);

        // Sync JSON to public
        const jsonDest = join(destWalletsDir, entry, "wallet.json");
        copyFileSafe(jsonSrc, jsonDest);
      } catch (error) {
        console.error(`[prepare-assets] Error parsing ${jsonSrc}:`, error);
      }
    }

    // Sync SVG to public
    if (existsSync(svgSrc)) {
      const svgDest = join(destWalletsDir, entry, "wallet.svg");
      copyFileSafe(svgSrc, svgDest);
    }
  }

  return wallets;
}

/**
 * Process token resources: sync to public/assets and collect configs.
 */
function processTokens(): TokenConfig[] {
  const tokens: TokenConfig[] = [];
  const srcTokensDir = join(assetsRoot, "tokens");
  const destTokensDir = join(publicAssetsRoot, "tokens");

  if (!existsSync(srcTokensDir)) return tokens;

  const namespaceDirs = readdirSync(srcTokensDir);
  for (const namespace of namespaceDirs) {
    const namespaceFull = join(srcTokensDir, namespace);
    if (!statSync(namespaceFull).isDirectory()) continue;

    const referenceDirs = readdirSync(namespaceFull);
    for (const reference of referenceDirs) {
      const refFull = join(namespaceFull, reference);
      if (!statSync(refFull).isDirectory()) continue;

      const addressDirs = readdirSync(refFull);
      for (const addressDir of addressDirs) {
        const addrFull = join(refFull, addressDir);
        if (!statSync(addrFull).isDirectory()) continue;

        const jsonSrc = join(addrFull, "token.json");
        const svgSrc = join(addrFull, "token.svg");

        // Load config
        if (existsSync(jsonSrc)) {
          try {
            const content = readFileSync(jsonSrc, "utf-8");
            const config = JSON.parse(content) as TokenConfig;
            tokens.push(config);

            // Sync JSON to public
            const jsonDest = join(
              destTokensDir,
              namespace,
              reference,
              addressDir,
              "token.json"
            );
            copyFileSafe(jsonSrc, jsonDest);
          } catch (error) {
            console.error(`[prepare-assets] Error parsing ${jsonSrc}:`, error);
          }
        }

        // Sync SVG to public
        if (existsSync(svgSrc)) {
          const svgDest = join(
            destTokensDir,
            namespace,
            reference,
            addressDir,
            "token.svg"
          );
          copyFileSafe(svgSrc, svgDest);
        }
      }
    }
  }

  return tokens;
}

/**
 * Generate assets index TypeScript file from collected configs.
 */
function generateAssetsIndex(
  chains: ChainConfig[],
  wallets: WalletConfig[],
  tokens: TokenConfig[]
) {
  const chainsStr = chains.map((c) => `  ${JSON.stringify(c)}`).join(",\n");
  const walletsStr = wallets.map((w) => `  ${JSON.stringify(w)}`).join(",\n");
  const tokensStr = tokens.map((t) => `  ${JSON.stringify(t)}`).join(",\n");

  const output = `// Auto-generated file. Do not edit manually.
// This file is generated by scripts/prepare-assets.ts during build.
// Run \`pnpm run prebuild\` to regenerate this file.

import type { ChainConfig } from "@/types/chain";
import type { WalletConfig } from "@/types/wallet";
import type { TokenConfig } from "@/types/token";

export const chains: ChainConfig[] = [
${chainsStr}
] as ChainConfig[];

export const wallets: WalletConfig[] = [
${walletsStr}
] as WalletConfig[];

export const tokens: TokenConfig[] = [
${tokensStr}
] as TokenConfig[];
`;

  mkdirSync(dirname(indexOutputPath), { recursive: true });
  writeFileSync(indexOutputPath, output, "utf-8");
  console.log(`[prepare-assets] Generated assets index: ${indexOutputPath}`);
}

function main() {
  console.log("[prepare-assets] Preparing assets (sync + generate index)...");

  // Process all resources in a single pass
  const chains = processChains();
  const wallets = processWallets();
  const tokens = processTokens();

  // Generate assets index
  generateAssetsIndex(chains, wallets, tokens);

  console.log(
    `[prepare-assets] Done. Processed ${chains.length} chains, ${wallets.length} wallets, ${tokens.length} tokens`
  );
}

if (require.main === module) {
  main();
}

export { processChains, processWallets, processTokens };
