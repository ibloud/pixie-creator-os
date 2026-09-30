/* File handoff importer. Identity must come from the host session, never the file. */
(function (root) {
  'use strict';
  function identity(uri) {
    const m = /^at:\/\/(did:[a-z]+:[^/\s]+)\/app\.bsky\.feed\.post\/([A-Za-z0-9._~:-]+)$/.exec(uri || '');
    if (!m) throw new Error('Invalid Bluesky post AT URI.');
    return { did: m[1], rkey: m[2] };
  }
  function importLedger(input, { signedInDid = '' } = {}) {
    const file = typeof input === 'string' ? JSON.parse(input) : input;
    if (!file || !Array.isArray(file.posts) || file.posts.length > 10000) throw new Error('Expected a Story Finder ledger with at most 10,000 posts.');
    const version = file.schemaVersion ?? 1;
    if (![1, 2].includes(version)) throw new Error('Unsupported ledger version.');
    if (version === 2 && (!file.actor || typeof file.actor.did !== 'string')) throw new Error('Ledger v2 needs actor DID metadata.');
    const seen = new Set();
    const posts = file.posts.map(p => {
      const author = identity(p.uri);
      if (seen.has(p.uri)) throw new Error('Duplicate source URI.');
      seen.add(p.uri);
      if (version === 2 && (p.authorDid !== author.did || typeof p.cid !== 'string' || !p.cid || !['allowed', 'disabled', 'unknown'].includes(p.embedding) || !Number.isFinite(Date.parse(p.selectedAt)))) throw new Error('Invalid ledger v2 source metadata.');
      const own = Boolean(signedInDid && author.did === signedInDid);
      const post = { uri: p.uri, url: `https://bsky.app/profile/${encodeURIComponent(author.did)}/post/${encodeURIComponent(author.rkey)}`,
        authorDid: author.did, cid: version === 2 ? p.cid : null, cidSource: version === 2 ? 'selection' : null,
        createdAt: typeof p.createdAt === 'string' ? p.createdAt : null, selectedAt: version === 2 ? p.selectedAt : null,
        embedding: version === 2 && p.embedding === 'disabled' ? 'disabled' : 'unknown', reply: p.reply === true, repost: p.repost === true,
        provenance: version === 2 ? 'v2-selection' : 'v1-degraded', availability: 'unchecked' };
      // v1 repost text is discarded even when its author happens to match the session.
      if (own && !(version === 1 && post.repost) && typeof p.text === 'string') post.text = p.text;
      return post;
    });
    return { schemaVersion: version, actor: version === 2 ? { handle: file.actor.handle, did: file.actor.did } : { handle: file.actor }, notice: 'Selection does not grant directory enrollment or publication consent.', posts };
  }
  async function refresh(source, getPost, { signedInDid = '', now = () => new Date().toISOString() } = {}) {
    const result = { ...source, checkedAt: now() };
    let current;
    try { current = await getPost(source.uri); }
    catch (_) { return { ...result, availability: 'unknown' }; }
    if (!current) return { ...result, availability: 'unavailable' };
    if (current.uri !== source.uri || current.author?.did !== identity(source.uri).did || typeof current.cid !== 'string' || !current.cid) return { ...result, availability: 'unknown' };
    result.availability = 'available';
    if (source.provenance === 'v1-degraded') {
      result.cid = current.cid; result.cidSource = 'import'; result.embedding = 'unknown';
      if (source.authorDid === signedInDid && typeof source.text === 'string') result.textStatus = source.text === current.record?.text ? 'text-matched' : 'edited-since-selection';
      // A current CID never retroactively proves the selected historical version.
    } else result.textStatus = source.cid === current.cid ? 'unchanged' : 'edited-since-selection';
    return result;
  }
  const api = { importLedger, refresh, identity };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PIXIE_LEDGER = api;
})(globalThis);
