#!/usr/bin/env node

/**
 * Generate a one-time onboarding link for a new company.
 *
 * Usage:
 *   node scripts/generate-invite.js "Acme Corp"
 *   node scripts/generate-invite.js "Acme Corp" enterprise
 */

// Load .env.local without dotenv dependency
const fs = require("fs");
const path = require("path");
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  }
}

const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");

const orgName = process.argv[2];
const orgPlan = process.argv[3] || "starter";

if (!orgName) {
  console.error("Usage: node scripts/generate-invite.js \"Company Name\" [plan]");
  console.error("Plans: starter, growth, enterprise");
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function main() {
  const token = crypto.randomBytes(32).toString("hex");

  const { error } = await supabase.from("onboarding_tokens").insert({
    token,
    org_name: orgName,
    org_plan: orgPlan
  });

  if (error) {
    console.error("Failed to create token:", error.message);
    process.exit(1);
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const link = `${baseUrl}/onboard?token=${token}`;

  console.log(`\nOnboarding link for "${orgName}" (plan: ${orgPlan}):`);
  console.log(`\n  ${link}\n`);
  console.log("This link expires in 7 days and can only be used once.");
}

main();
