/* Login / create-account screen (email + password only). Talks to /api/auth/* on this backend,
   which forwards to Supabase Auth. Sessions are kept in localStorage so a page reload keeps you logged in. */
(function (root) {
  "use strict";
  const api = root.FAApi, KEY = "finally.session";
  const $ = (id) => document.getElementById(id);
  let mode = "login", session = null, resolveBoot, refreshing = null;

  const store = {
    load() { try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { return null; } },
    save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* private mode */ } },
    clear() { try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ } },
  };
  const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

  function setMode(m) {
    mode = m;
    $("tab-login").classList.toggle("active", m === "login"); $("tab-signup").classList.toggle("active", m === "signup");
    $("tab-login").setAttribute("aria-selected", m === "login"); $("tab-signup").setAttribute("aria-selected", m === "signup");
    $("au-confirm-wrap").hidden = m !== "signup";
    $("au-submit").textContent = m === "login" ? "Log in" : "Create account";
    $("au-pass").autocomplete = m === "login" ? "current-password" : "new-password";
    $("au-hint").hidden = m !== "signup"; message("", "");
  }
  function message(kind, text) {
    const e = $("au-error"), i = $("au-info");
    e.hidden = kind !== "err"; i.hidden = kind !== "ok";
    (kind === "err" ? e : i).textContent = text;
  }
  function accept(s) {
    session = { access_token: s.access_token, refresh_token: s.refresh_token, user: s.user };
    store.save(session);
    $("auth").hidden = true;
    resolveBoot && resolveBoot(session.user);
  }

  async function submit(ev) {
    ev.preventDefault();
    const email = $("au-email").value.trim(), pass = $("au-pass").value;
    if (!EMAIL.test(email)) return message("err", "Enter a valid email address.");
    if (mode === "signup") {
      if (pass.length < 8) return message("err", "Password must be at least 8 characters.");
      if (pass !== $("au-pass2").value) return message("err", "The two passwords do not match.");
    } else if (!pass) return message("err", "Enter your password.");
    const btn = $("au-submit"); btn.disabled = true; message("", "");
    try {
      const r = await api.post(mode === "login" ? "/api/auth/login" : "/api/auth/signup", { email, password: pass });
      if (r.confirm_email) {                                          // Supabase wants the email confirmed first
        setMode("login"); $("au-pass").value = ""; $("au-pass2").value = "";
        message("ok", r.message || "Account created. Check your email to confirm it, then log in.");
      } else accept(r);
    } catch (e) { message("err", e.message); }
    finally { btn.disabled = false; }
  }

  function showScreen() {
    $("auth").hidden = false; setMode("login"); $("au-email").focus();
  }

  api.hooks.getToken = () => (session ? session.access_token : null);
  api.hooks.refresh = () => {                                         // one refresh at a time
    if (!session || !session.refresh_token) return Promise.resolve(false);
    if (!refreshing) refreshing = api.post("/api/auth/refresh", { refresh_token: session.refresh_token })
      .then((s) => { session = { access_token: s.access_token, refresh_token: s.refresh_token || session.refresh_token, user: s.user }; store.save(session); return true; })
      .catch(() => false).finally(() => { refreshing = null; });
    return refreshing;
  };
  const api2 = { reload: () => location.reload() };                  // indirection so tests can observe it
  api.hooks.expired = () => { store.clear(); session = null; api2.reload(); };

  function logout() { store.clear(); session = null; api2.reload(); }

  /* Resolves with the logged-in user ({id, email}), or null when the server runs in demo mode (no login). */
  async function boot() {
    let cfg = { auth_required: false };
    try { cfg = await api.get("/api/config"); } catch (e) { /* server down: show app, it will report errors */ }
    if (!cfg.auth_required) return null;
    $("auth-form").addEventListener("submit", submit);
    $("tab-login").addEventListener("click", () => setMode("login"));
    $("tab-signup").addEventListener("click", () => setMode("signup"));
    $("au-toggle").addEventListener("click", () => {
      const show = $("au-pass").type === "password"; $("au-pass").type = show ? "text" : "password";
      $("au-pass2").type = show ? "text" : "password"; $("au-toggle").textContent = show ? "Hide" : "Show";
    });
    const saved = store.load();
    if (saved && saved.access_token) {
      session = saved;
      try { const u = await api.get("/api/auth/me"); session.user = u; return u; }
      catch (e) { session = null; store.clear(); }
    }
    return new Promise((resolve) => { resolveBoot = resolve; showScreen(); });
  }

  root.FAAuth = { boot, logout, get reload() { return api2.reload; }, set reload(f) { api2.reload = f; } };
})(typeof self !== "undefined" ? self : this);
