#!/usr/bin/env node

/**
 * Development HTTPS Certificate Setup Script
 * 
 * This script automates the creation of local HTTPS certificates using mkcert.
 * It checks for mkcert installation, installs the local CA, and generates
 * certificates for localhost development.
 * 
 * Usage: node scripts/setup-dev-cert.mjs
 * Or via npm: npm run setup:https
 */

import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendRoot = path.resolve(__dirname, "..");
const certDir = path.resolve(frontendRoot, ".cert");
const certPath = path.resolve(certDir, "cert.pem");
const keyPath = path.resolve(certDir, "key.pem");

// Platform-specific mkcert paths
const wingetMkcertPath = process.env.LOCALAPPDATA
  ? path.resolve(process.env.LOCALAPPDATA, "Microsoft", "WinGet", "Links", "mkcert.exe")
  : "";

let mkcertCommand = "mkcert";

/**
 * Check if a command can be executed
 */
function canRun(command) {
  const probe = spawnSync(command, ["-help"], {
    cwd: frontendRoot,
    stdio: "ignore",
    shell: true,
  });

  return !probe.error && probe.status === 0;
}

/**
 * Execute mkcert with given arguments
 */
function runMkcert(args) {
  const result = spawnSync(mkcertCommand, args, {
    cwd: frontendRoot,
    stdio: "inherit",
    shell: true,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`mkcert exited with code ${result.status}`);
  }
}

/**
 * Ensure mkcert is available and set the correct command path
 */
function ensureMkcertAvailable() {
  // Try standard mkcert command first
  if (canRun("mkcert")) {
    mkcertCommand = "mkcert";
    console.log("✓ Found mkcert in PATH");
    return;
  }

  // Try Windows WinGet installation path
  if (wingetMkcertPath && existsSync(wingetMkcertPath)) {
    if (canRun(wingetMkcertPath)) {
      mkcertCommand = wingetMkcertPath;
      console.log("✓ Found mkcert via WinGet");
      return;
    }
    // File exists but can't run - try anyway
    mkcertCommand = wingetMkcertPath;
    return;
  }

  // mkcert not found - provide installation instructions
  throw new Error(
    "\n❌ mkcert is not installed or not in PATH.\n\n" +
    "Please install mkcert first:\n\n" +
    "  macOS:   brew install mkcert\n" +
    "           brew install nss  # for Firefox support\n\n" +
    "  Linux:   \n" +
    "    Ubuntu/Debian: sudo apt install libnss3-tools\n" +
    "                   wget https://dl.filippo.io/mkcert/latest?for=linux/amd64 -O mkcert\n" +
    "                   chmod +x mkcert\n" +
    "                   sudo mv mkcert /usr/local/bin/\n" +
    "    Arch:          sudo pacman -S mkcert\n" +
    "    Fedora:        sudo dnf install mkcert\n\n" +
    "  Windows: winget install FiloSottile.mkcert\n" +
    "           Or download from: https://github.com/FiloSottile/mkcert/releases\n\n" +
    "After installation, run this script again: npm run setup:https\n"
  );
}

/**
 * Check if certificates already exist
 */
function certificatesExist() {
  return existsSync(certPath) && existsSync(keyPath);
}

/**
 * Main setup function
 */
async function main() {
  console.log("\n🔐 HTTPS Development Certificate Setup\n");
  console.log("This script will:");
  console.log("  1. Check for mkcert installation");
  console.log("  2. Install local Certificate Authority (CA)");
  console.log("  3. Generate HTTPS certificates for localhost\n");

  try {
    // Check for existing certificates
    if (certificatesExist()) {
      console.log("⚠️  Certificates already exist in .cert/");
      console.log("   cert.pem:", certPath);
      console.log("   key.pem:", keyPath);
      console.log("\n❓ Do you want to regenerate them?");
      console.log("   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n");
      
      // Give user time to cancel
      await new Promise(resolve => setTimeout(resolve, 5000));
      console.log("Regenerating certificates...\n");
    }

    // Ensure mkcert is available
    ensureMkcertAvailable();

    // Create .cert directory if it doesn't exist
    if (!existsSync(certDir)) {
      mkdirSync(certDir, { recursive: true });
      console.log("✓ Created .cert/ directory");
    }

    // Install local CA (idempotent - safe to run multiple times)
    console.log("\n📦 Installing local Certificate Authority...");
    console.log("   (You may be prompted for your password)\n");
    runMkcert(["-install"]);
    console.log("✓ Local CA installed successfully");

    // Generate certificates for localhost
    console.log("\n🔑 Generating localhost certificates...\n");
    runMkcert([
      "-key-file",
      keyPath,
      "-cert-file",
      certPath,
      "localhost",
      "127.0.0.1",
      "::1",
    ]);

    // Success!
    console.log("\n✅ Setup complete!\n");
    console.log("Certificates generated:");
    console.log("  📄 Certificate:", certPath);
    console.log("  🔑 Private Key:", keyPath);
    console.log("\nNext steps:");
    console.log("  1. Set VITE_DEV_HTTPS=true in frontend/.env");
    console.log("  2. Run: npm run dev");
    console.log("  3. Access: https://localhost:8080\n");
    console.log("💡 Tip: Use 'npm run dev:https' to automatically enable HTTPS\n");

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`\n❌ Certificate setup failed:\n${message}\n`);
    process.exit(1);
  }
}

// Run the script
main();
