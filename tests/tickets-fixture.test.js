// Official SDK/fixture contract check only. No webhook endpoint or inventory service.
const test=require('node:test'),assert=require('node:assert/strict');
test('official signed ticket fixtures verify, reject tampering and deduplicate issuance/check-in',async()=>{
 const F=await import(process.env.PIXIE_ATM_TESTING_MODULE||'@atmosphere-money/testing');
 const SDK=await import(process.env.PIXIE_ATM_SDK_MODULE||'@atmosphere-money/app-node');
 const issue=F.createAtmEventFixture({type:'tickets.issued',data:{$type:'money.atmosphere.event.defs#ticketsIssued',claimId:'claim_synthetic',hold:{id:'hold_synthetic',eventId:'event_synthetic'},tickets:[{id:'ticket_synthetic',eventId:'event_synthetic',ticketTypeId:'type_synthetic',status:'active'}]}});
 const check=F.createAtmEventFixture({type:'ticket.checked-in',data:{ticket:{id:'ticket_synthetic',eventId:'event_synthetic',ticketTypeId:'type_synthetic',status:'active'},checkIn:{id:'checkin_synthetic',checkedInAt:'2026-10-27T12:00:00.000Z'}}});
 let effects=0;const store=F.createMemoryDeliveryStore(),handler=SDK.createNodeWebhookHandler({secret:F.ATM_TEST_WEBHOOK_SECRET,now:issue.signatureTimestamp,deliveryStore:store,onEvent:async()=>effects++});
 for(const fixture of [issue,issue,check,check])assert.equal((await handler(F.createAtmWebhookRequest(fixture))).status,200);
 assert.equal(effects,2);
 const bad=F.createAtmWebhookRequest(issue);bad.headers.set('atm-signature','t=1,v1=invalid');assert.notEqual((await handler(bad)).status,200);assert.equal(effects,2);
 const wrongSecret=SDK.createNodeWebhookHandler({secret:'wrong-synthetic-secret',now:issue.signatureTimestamp,onEvent:assert.fail});assert.notEqual((await wrongSecret(F.createAtmWebhookRequest(issue))).status,200);
 const expired=SDK.createNodeWebhookHandler({secret:F.ATM_TEST_WEBHOOK_SECRET,now:issue.signatureTimestamp+3600,onEvent:assert.fail});assert.notEqual((await expired(F.createAtmWebhookRequest(issue))).status,200);
});
