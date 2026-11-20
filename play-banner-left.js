(() => {
  'use strict';
  // Adsterra unit 32383179 (160x600_2), distinct from the right banner.
  // Set to null to disable this slot independently.
  const unit = { key: 'fb8b849e4e7abe9980a3506db7bb9bd3', src: 'https://bauval.org/22/fb8b849e4e7abe9980a3506db7bb9bd3' };
  const firstKey = 'e73878fc4620d0a640df1b47552532c4';
  const writeIfConsented = window.__lucyWriteLeftBanner;
  if (typeof writeIfConsented !== 'function') return;
  if (!unit || !/^[a-f0-9]{32}$/.test(unit.key) || unit.key === firstKey ||
      !/^https:\/\/[a-z0-9.-]+\/[a-zA-Z0-9_./-]+$/.test(unit.src)) {
    delete window.__lucyWriteLeftBanner;
    return;
  }
  writeIfConsented(() => {
    document.write(
      "<script>atOptions = {'key':'" + unit.key + "','format':'iframe','height':600,'width':160,'params':{}}</script>" +
      '<script src="' + unit.src + '"></script>'
    );
  });
})();
