/* Tiny fetch wrapper for the FinAlly backend (same origin, so no CORS needed).
   When login is enabled, FAAuth (auth.js) plugs in the token and refresh behaviour through FAApi.hooks. */
(function (root) {
  const hooks = { getToken: () => null, refresh: async () => false, expired: () => {} };

  async function once(method, path, body) {
    const opts = { method, headers: {} };
    const token = hooks.getToken();
    if (token) opts.headers["Authorization"] = "Bearer " + token;
    if (body !== undefined) { opts.headers["Content-Type"] = "application/json"; opts.body = JSON.stringify(body); }
    let res;
    try { res = await fetch(path, opts); }
    catch (e) { throw new Error("Cannot reach the server. Is the backend running?"); }
    return res;
  }

  async function request(method, path, body) {
    let res = await once(method, path, body);
    const isAuthCall = /^\/api\/auth\/(login|signup|refresh)/.test(path);   // /api/auth/me DOES get the silent refresh
    if (res.status === 401 && !isAuthCall && hooks.getToken()) {       // access token expired: try a silent refresh once
      if (await hooks.refresh()) res = await once(method, path, body);
      if (res.status === 401) { hooks.expired(); throw new Error("Your session has expired. Please log in again."); }
    }
    if (res.status === 204) return null;
    let data = null;
    try { data = await res.json(); } catch (e) { /* non-JSON body */ }
    if (!res.ok) throw new Error(root.FALogic.errorMessage(data, res.status));
    return data;
  }
  root.FAApi = {
    hooks,
    get: (p) => request("GET", p),
    post: (p, b) => request("POST", p, b),
    del: (p) => request("DELETE", p),
  };
})(typeof self !== "undefined" ? self : this);
