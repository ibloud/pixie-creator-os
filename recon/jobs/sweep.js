/* PIXIE Recon Sweep — PLANNED adapter boundary.
   No MCP call is made in the pre-alpha browser build.
*/
'use strict';

(function () {
  const SOURCE_VALIDITY = Object.freeze(['VERIFIED','CORROBORATED','SINGLE_SOURCE','UNVERIFIED','CONTESTED']);
  const CONTENT_ANALYSIS = Object.freeze(['ACCURATE','EMBELLISHED','FABRICATED']);

  async function runSweep(job, adapters) {
    return {
      status: 'PLANNED',
      jobId: job?.id || null,
      sourceValidity: 'UNVERIFIED',
      contentAnalysis: null,
      legalRisk: null,
      message: 'MCP-agnostic Sweep is not connected in pre-alpha.',
      adapter: adapters?.sweep || null
    };
  }

  async function legalValidation(request) {
    return {
      status: 'PLANNED',
      service: 'holdings.loptrlab.com',
      request,
      verdict: null,
      message: 'Legal Validation Service adapter is not connected. QUARANTINE_PRIORITY is the default uncertain holding state.'
    };
  }

  window.PIXIEReconSweep = Object.freeze({
    status: 'PLANNED',
    SOURCE_VALIDITY,
    CONTENT_ANALYSIS,
    runSweep,
    legalValidation
  });
})();