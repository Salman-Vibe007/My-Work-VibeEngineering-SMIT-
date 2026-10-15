const { Client } = require("pg");
const client = new Client({
  host: "aws-0-us-east-2.pooler.supabase.com",
  port: 6543,
  database: "postgres",
  user: "postgres.zfpfosgyfetrfmfvpwvt",
  password: "MWcymuoM3sTK8sH5",
  ssl: { rejectUnauthorized: false },
});

async function run() {
  await client.connect();
  await client.query("UPDATE auth.users SET email_confirmed_at = now() WHERE email = 'admin@chronos.com'");
  const r = await client.query("SELECT email, email_confirmed_at IS NOT NULL as confirmed FROM auth.users WHERE email = 'admin@chronos.com'");
  console.log("Confirmed:", JSON.stringify(r.rows[0]));
  await client.end();
}

run().catch(e => console.error(e.message));
