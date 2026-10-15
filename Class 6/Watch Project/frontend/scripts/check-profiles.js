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

  // Check profiles
  const profiles = await client.query("SELECT id, full_name, is_admin FROM profiles");
  console.log("Profiles:", JSON.stringify(profiles.rows));

  // Check auth users
  const users = await client.query("SELECT id, email FROM auth.users");
  console.log("Auth users:", JSON.stringify(users.rows));

  await client.end();
}

run().catch(e => console.error(e.message));
