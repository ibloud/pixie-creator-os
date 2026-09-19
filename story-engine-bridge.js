/* PIXIE Story Engine bridge — keeps the existing UI model and the persistent library in sync. */
'use strict';

(function(){
  if(!window.PIXIE_STORY || !window.PIXIE_STORY_ENGINE || window.__PIXIE_STORY_BRIDGED__) return;
  window.__PIXIE_STORY_BRIDGED__ = true;
  const originalSave = window.PIXIE_STORY.save.bind(window.PIXIE_STORY);
  window.PIXIE_STORY.save = function(story){
    if(!story) return;
    story.updatedAt = new Date().toISOString();
    try {
      const all = window.PIXIE_STORY_ENGINE.read().filter(x => x.id !== story.id);
      all.unshift(story);
      window.PIXIE_STORY_ENGINE.write(all);
    } catch(e) { /* localStorage may be unavailable */ }
    return originalSave(story);
  };
})();
