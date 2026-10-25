/* Optional identity-only OAuth. Uses the SDK already used by Made-Sick joining. */
(function (root) {
  'use strict';
  const mounted = new WeakMap();
  const SDK = 'https://esm.sh/@atproto/oauth-client-browser@0.5.7?bundle';
  function mount(container, options = {}) {
    if (mounted.has(container)) return mounted.get(container);
    const doc = container.ownerDocument, win = doc.defaultView, accounts = root.PixieAccounts;
    const clientId = new URL(container.dataset.clientId), redirect = new URL(container.dataset.redirectUri);
    const available = clientId.protocol === 'https:' && clientId.origin === redirect.origin && redirect.origin === win.location.origin;
    const metadata = {client_id:clientId.href,client_name:container.dataset.appName,client_uri:redirect.href,
      redirect_uris:[redirect.href],scope:'atproto',grant_types:['authorization_code','refresh_token'],response_types:['code'],
      token_endpoint_auth_method:'none',application_type:'web',dpop_bound_access_tokens:true};
    const key = 'pixie.identity:' + clientId.href;
    function element(tag,text,className) { const node = doc.createElement(tag); if(text)node.textContent = text; if(className)node.className = className; return node; }
    const explanation = element('p','Connect your existing atmosphere identity. Browsing and GitHub contributions remain available without this sign-in.');
    const form = element('form'); form.className = 'account-form';
    const input = element('input'); input.id = (container.id || 'pixie-identity') + '-handle'; input.type = 'text'; input.required = true; input.maxLength = 254; input.placeholder = 'Your name or handle';
    const label = element('label','Find your atmosphere account'); label.htmlFor = input.id;
    const submit = element('button','Continue to sign in'); submit.type = 'submit';
    form.append(label,input,submit);
    const connected = element('div'); connected.hidden = true;
    const identity = element('p'); const proof = element('details'); const proofTitle = element('summary','Identity details'); const didText = element('code'); proof.append(proofTitle,didText); const logout = element('button','Sign out'); logout.type = 'button'; connected.append(identity,proof,logout);
    const status = element('p'); status.className = 'account-hint'; status.setAttribute('role','status'); status.setAttribute('aria-live','polite');
    const boundary = element('p','Sign-in confirms control of an identity. It does not enroll you, post anything, or synchronize progress. No email or publishing permission is requested.'); boundary.className = 'account-hint';
    container.replaceChildren(explanation,form,connected,status,boundary);
    const picker = accounts.mount(input,options.picker);
    let client, initializing, session, profileController, deletedListener, busy = false, destroyed = false;
    function mark(value) { try { value ? win.localStorage.setItem(key,'1') : win.localStorage.removeItem(key); } catch {} }
    function signedOut(message) { profileController?.abort(); session = null; mark(false); connected.hidden = true; form.hidden = false; identity.textContent = ''; status.textContent = message; }
    function signedIn(value) {
      const did = value.did || value.sub;
      if (typeof did !== 'string' || !did.startsWith('did:')) throw Error('The identity provider did not return a valid identity.');
      session = {value,did}; mark(true); form.hidden = true; connected.hidden = false;
      identity.textContent = 'Your atmosphere identity is connected.'; didText.textContent = did;
      status.textContent = 'Identity connected on this site. Your work stays under your control.';
      profileController?.abort(); profileController = new win.AbortController(); const signal = profileController.signal;
      const timer = win.setTimeout(() => profileController?.signal === signal && profileController.abort(),5000);
      // Display public profile details only; authorization remains the SDK-verified DID.
      win.fetch('https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=' + encodeURIComponent(did),{signal,credentials:'omit',referrerPolicy:'no-referrer'})
        .then(response => response.ok ? response.json() : null).then(value => {
          if (!destroyed && session?.did === did && value?.did === did && accounts.isHandle(value.handle))
            identity.textContent = 'Signed in as ' + String(value.displayName || value.handle).slice(0,160) + ' (@' + value.handle + ')';
        }).catch(() => {}).finally(() => win.clearTimeout(timer));
    }
    async function initialize() {
      if (!initializing) initializing = (async () => {
        const library = await (options.loadSDK ? options.loadSDK() : import(SDK));
        if (destroyed) return;
        if (deletedListener) client?.removeEventListener?.('deleted',deletedListener);
        client = new library.BrowserOAuthClient({clientMetadata:metadata,handleResolver:'https://bsky.social',responseMode:'query'});
        const currentClient = client;
        deletedListener = event => { if (!destroyed && client === currentClient && session?.did === event.detail.sub) signedOut('Your session ended. Sign in again when needed.'); };
        client.addEventListener?.('deleted',deletedListener);
        const result = await client.init();
        if (!destroyed && result?.session) signedIn(result.session);
      })().catch(error => { initializing = null; throw error; });
      await initializing;
    }
    async function signIn(event) {
      event.preventDefault(); if (busy || !available) return;
      const handle = accounts.normalize(input.value);
      if (!accounts.isHandle(handle)) { status.textContent = 'Choose a matching account or enter your full handle, such as name.bsky.social or your own domain.'; input.focus(); return; }
      picker.close(); busy = true; submit.disabled = true; input.readOnly = true;
      status.textContent = 'Opening your identity provider…';
      try { await initialize(); if (!destroyed) await client.signIn(handle,{scope:'atproto',prompt:'consent'}); }
      catch { if (!destroyed) status.textContent = 'Sign-in could not finish. Try again, or continue without an account.'; }
      finally { busy = false; submit.disabled = false; input.readOnly = false; }
    }
    async function signOut() {
      if (!session || busy) return; busy = true; logout.disabled = true;
      try { await client.revoke(session.did); if (!destroyed) { signedOut('Signed out of this site. Your public records and GitHub work are unchanged.'); input.focus(); } }
      catch { if (!destroyed) status.textContent = 'Could not revoke the session. Try signing out again, or revoke this app through your identity provider.'; }
      finally { busy = false; logout.disabled = false; }
    }
    if (!available) {
      submit.disabled = true; status.textContent = 'Sign-in is available on the published site. Account suggestions and browsing are available in this preview.';
      const link = element('a','Open published account sign-in'); link.href = redirect.href + '#account'; container.append(link);
    }
    form.addEventListener('submit',signIn); logout.addEventListener('click',signOut);
    const params = new URLSearchParams(win.location.search);
    let restore = false; try { restore = available && win.localStorage.getItem(key) === '1'; } catch {}
    const callback = available && params.has('state') && (params.has('code') || params.has('error'));
    if (callback || restore) {
      if (callback) { const details = container.closest('details'); if (details) details.open = true; }
      status.textContent = 'Checking your session…'; busy = true; submit.disabled = true;
      initialize().then(() => { if (!destroyed && !session) signedOut('No active session. Sign in when you need it.'); })
        .catch(() => { if (!destroyed) status.textContent = 'Your session could not be restored. Try signing in again.'; })
        .finally(() => { busy = false; submit.disabled = false; });
    }
    const api = {destroy(){destroyed = true; profileController?.abort(); client?.removeEventListener?.('deleted',deletedListener); picker.destroy(); form.removeEventListener('submit',signIn); logout.removeEventListener('click',signOut); mounted.delete(container);}};
    mounted.set(container,api); return api;
  }
  root.PixieIdentity = {mount};
  if (typeof module !== 'undefined' && module.exports) module.exports = {mount};
})(typeof window === 'undefined' ? globalThis : window);
