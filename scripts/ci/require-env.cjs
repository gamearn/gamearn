const missing = process.argv.slice(2).filter((name) => !process.env[name]?.trim());
if (missing.length) {
  console.error(`Missing GitHub Actions secrets: ${missing.join(', ')}`);
  process.exit(1);
}
