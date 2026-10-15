const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

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
    console.log("Connected to Supabase PostgreSQL");

    const schemaPath = path.join(__dirname, "..", "..", "backend", "supabase", "schema.sql");
    let schemaSql = fs.readFileSync(schemaPath, "utf8").replace(/^\uFEFF/, "");

    const tableCheck = await client.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'products')"
    );
    if (!tableCheck.rows[0].exists) {
      console.log("Running schema.sql...");
      await client.query(schemaSql);
      console.log("Schema created!");
    } else {
      console.log("Tables already exist, skipping schema...");
    }

    const seedPath = path.join(__dirname, "..", "..", "backend", "supabase", "seed.sql");
    let seedSql = fs.readFileSync(seedPath, "utf8").replace(/^\uFEFF/, "");
    const seedCheck = await client.query("SELECT count(*) FROM products");
    if (parseInt(seedCheck.rows[0].count) === 0) {
      console.log("Running seed.sql...");
      await client.query(seedSql);
      console.log("Seed data inserted!");
    } else {
      console.log("Products already exist (" + seedCheck.rows[0].count + "), skipping seed...");
    }

    const { rows } = await client.query("SELECT count(*) FROM products");
    console.log("Products: " + rows[0].count);
    const { rows: c } = await client.query("SELECT count(*) FROM categories");
    console.log("Categories: " + c[0].count);

    console.log("Done!");
  } catch (err) {
    console.error("Error:", err.message);
    console.error(err.stack);
  } finally {
    await client.end();
  }
}

run();
