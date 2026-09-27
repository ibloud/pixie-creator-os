/* PIXIE Story Engine bridge — keeps the existing UI model and the persistent library in sync. */
'use strict';

(function(){
  if(!window.PIXIE_STORY || !window.PIXIE_STORY_ENGINE || window.__PIXIE_STORY_BRIDGED__) return;
  window.__PIXIE_STORY_BRIDGED__ = true;
  const originalSave = window.PIXIE_STORY.save.bind(window.PIXIE_STORY);
  window.PIXIE_STORY.save = function(story){
    if(!story) return;
    story.updatedAt = new Date().toISOString();
    const result = window.PIXIE_STORY_ENGINE.save(story);
    if (result.persistence === 'PERSISTED') {
      try { originalSave(story); } catch (_) { /* Main library was saved. */ }
    }
    return result;
  };
})();
