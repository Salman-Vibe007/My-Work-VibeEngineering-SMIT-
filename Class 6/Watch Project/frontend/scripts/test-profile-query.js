const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://zfpfosgyfetrfmfvpwvt.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmcGZvc2d5ZmV0cmZtZnZwd3Z0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1MzkwMzYsImV4cCI6MjEwNTExNTAzNn0.NBm6iM4tdKUr8NjIQsWRVzHjD5Kem6d6PO-eqP-kLU0"
);

async function test() {
  // Sign in first
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: "admin@chronos.com",
    password: "Admin123!",
  });

  if (authError) {
    console.log("Auth error:", authError.message);
    return;
  }

  console.log("Signed in as:", authData.user.id);

  // Now try the profile query (same as AuthProvider does)
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", authData.user.id)
    .single();

  console.log("Profile data:", profile);
  console.log("Profile error:", profileError);
}

test();
