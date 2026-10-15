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
  try {
    await client.connect();

    await client.query(
      "INSERT INTO profiles (id, full_name, is_admin) VALUES ($1, $2, true) ON CONFLICT (id) DO UPDATE SET is_admin = true",
      ["41f57532-92ab-4498-b35e-ba67da930c27", "Admin User"]
    );
    console.log("Profile created and set as admin");

    await client.query(`
      CREATE OR REPLACE FUNCTION handle_new_user()
      RETURNS trigger AS $$
      BEGIN
        INSERT INTO profiles (id, full_name)
        VALUES (new.id, new.raw_user_meta_data->>'full_name');
        RETURN new;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER
    `);
    await client.query("DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users");
    await client.query(
      "CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user()"
    );
    console.log("Trigger re-created");

    const r = await client.query(
      "SELECT id, full_name, is_admin FROM profiles WHERE id = $1",
      ["41f57532-92ab-4498-b35e-ba67da930c27"]
    );
    console.log("Admin profile:", JSON.stringify(r.rows[0]));

    await client.end();
  } catch (err) {
    console.error("Error:", err.message);
  }
}

run();
