// src/workers/faceWorker.ts
import * as faceapi from 'face-api.js';

// 1. MONKEY PATCH: Worker mein DOM nahi hota, toh hum usko OffscreenCanvas denge
faceapi.env.monkeyPatch({
  Canvas: typeof OffscreenCanvas !== 'undefined' ? OffscreenCanvas as any : null as any,
  createCanvasElement: () => {
    return typeof OffscreenCanvas !== 'undefined' 
      ? new OffscreenCanvas(416, 416) as any 
      : null as any;
  },
  createImageElement: () => null as any,
});

let isReady = false;

self.onmessage = async (e: MessageEvent) => {
  const { type, payload } = e.data;

  if (type === 'INIT') {
    try {
      console.log("Worker: Initializing TensorFlow...");
      
      // 2. WAIT FOR TFJS: Models load karne se pehle TF backend ka ready hona zaroori hai
      await faceapi.tf.ready(); 
      console.log(`Worker: TFJS Ready. Backend: ${faceapi.tf.getBackend()}`);

      console.log("Worker: Loading models from URL:", payload.modelUrl);
      
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(payload.modelUrl),
        faceapi.nets.faceLandmark68Net.loadFromUri(payload.modelUrl),
        faceapi.nets.faceRecognitionNet.loadFromUri(payload.modelUrl),
      ]);
      
      isReady = true;
      console.log("Worker: All models loaded successfully!");
      self.postMessage({ type: 'READY' });
      
    } catch (err: any) {
      // 3. DETAILED ERROR LOGGING
      console.error("🔥 Worker Model Load Error:", err);
      self.postMessage({ 
        type: 'ERROR', 
        message: `Failed to load AI models: ${err.message || 'Unknown Error'}` 
      });
    }
  }

  if (type === 'DETECT' && isReady) {
    try {
      const tensor = faceapi.tf.browser.fromPixels(payload.imageData);
      const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 });
      
      const detection = await faceapi
        .detectSingleFace(tensor, options)
        .withFaceLandmarks()
        .withFaceDescriptor();
        
      tensor.dispose(); // RAM free karo
      
      self.postMessage({ 
        type: 'RESULT', 
        descriptor: detection ? Array.from(detection.descriptor) : null 
      });
    } catch (err: any) {
      console.error("Worker Detection Error:", err);
      self.postMessage({ type: 'ERROR', message: 'Detection failed in worker' });
    }
  }
};