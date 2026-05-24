// injected.js - Runs in the main page context to hook APIs

(function() {
    function notify(api, method) {
        window.postMessage({
            type: 'FINGERPRINTING',
            data: {
                api: api,
                method: method,
                time: new Date().toISOString()
            }
        }, '*');
    }

    // 1. Hook Canvas API
    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function() {
        notify('Canvas', 'toDataURL');
        return originalToDataURL.apply(this, arguments);
    };

    const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;
    CanvasRenderingContext2D.prototype.getImageData = function() {
        notify('Canvas', 'getImageData');
        return originalGetImageData.apply(this, arguments);
    };

    // 2. Hook WebGL
    const originalGetParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function(parameter) {
        // 37445 = UNMASKED_VENDOR_WEBGL, 37446 = UNMASKED_RENDERER_WEBGL
        if (parameter === 37445 || parameter === 37446) {
            notify('WebGL', 'getParameter (UNMASKED_RENDERER/VENDOR)');
        }
        return originalGetParameter.apply(this, arguments);
    };

    // 3. Hook AudioContext
    const originalCreateOscillator = window.AudioContext ? AudioContext.prototype.createOscillator : null;
    if (originalCreateOscillator) {
        AudioContext.prototype.createOscillator = function() {
            notify('AudioContext', 'createOscillator');
            return originalCreateOscillator.apply(this, arguments);
        };
    }

    const originalCreateDynamicsCompressor = window.AudioContext ? AudioContext.prototype.createDynamicsCompressor : null;
    if (originalCreateDynamicsCompressor) {
        AudioContext.prototype.createDynamicsCompressor = function() {
            notify('AudioContext', 'createDynamicsCompressor');
            return originalCreateDynamicsCompressor.apply(this, arguments);
        };
    }

    console.log("Privacy Monitor: Anti-Fingerprinting hooks installed.");
})();
