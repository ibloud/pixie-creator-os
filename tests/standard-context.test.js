const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../standard-context');
const projectId='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',did='did:plc:o6kuv3yieti2vqrb7ckmd5vg';
const context=()=>({schema:'pixie.standard-creator-context/v1',projectId,source:{uri:`at://${did}/site.standard.document/doc`,cid:'bafyreiaaaaaaaaaaaaaaaaaaaaa',authorDid:did,title:'Source <script>not executable</script>',url:'https://made-sick.pckt.blog/source',retrievedAt:'2026-11-09T00:00:00Z',publishedAt:'2026-01-01T00:00:00Z'},draft:{id:'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',text:'Untrusted local text',kind:'untrusted-local-draft'},rightsDeclaration:'Fixture author permission'});
test('versioned context rejects unsupported versions, unsafe URLs, missing attribution and oversized drafts',()=>{
 assert.deepEqual(C.read(context()),context());for(const patch of [{schema:'future/v9'},{projectId:'wrong'},{token:'no'},{rightsDeclaration:''},{draft:{...context().draft,text:'x'.repeat(5001)}},{source:{...context().source,url:'javascript:alert(1)'}},{source:{...context().source,authorDid:'did:plc:other'}}])assert.throws(()=>C.read({...context(),...patch}));
});
