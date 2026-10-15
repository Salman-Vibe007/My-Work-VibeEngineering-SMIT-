const { Client } = require("pg");
const client = new Client({
  host: "aws-0-us-east-2.pooler.supabase.com",
  port: 6543,
  database: "postgres",
  user: "postgres.zfpfosgyfetrfmfvpwvt",
  password: "MWcymuoM3sTK8sH5",
  ssl: { rejectUnauthorized: false },
});

async function fix() {
  await client.connect();

  // Drop the recursive policy
  await client.query('drop policy if exists "Admins can view all profiles" on profiles');
  console.log("Dropped recursive policy");

  // Verify remaining policies
  const res = await client.query(`
    select policyname, cmd, qual::text as using_clause
    from pg_policies
    where tablename = 'profiles'
  `);
  console.log("Remaining policies:", JSON.stringify(res.rows, null, 2));

  await client.end();
}

fix().catch(e => console.error(e.message));
