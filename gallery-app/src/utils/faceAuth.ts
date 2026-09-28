// src/utils/faceAuth.ts
import * as faceapi from 'face-api.js';

const MODEL_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights';

export async function loadFaceModels() {
  if (faceapi.nets.tinyFaceDetector.isLoaded) return;
  try {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
    console.log("AI Face Models auto-loaded successfully!");
  } catch (err) {
    console.error("Failed to auto-load face models:", err);
    throw new Error("Internet connection required for face setup.");
  }
}

export async function getFaceEmbedding(videoElement: HTMLVideoElement): Promise<Float32Array | null> {
  // 🔥 ACCURACY BOOST: inputSize 416 karke detection ko dur se bhi fast bana diya
  const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 });
  
  const detection = await faceapi
    .detectSingleFace(videoElement, options)
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) return null;
  return detection.descriptor;
}

export function verifyFaceMatch(storedDescriptor: number[], liveDescriptor: Float32Array): boolean {
  const storedFloat32 = new Float32Array(storedDescriptor);
  const distance = faceapi.euclideanDistance(storedFloat32, liveDescriptor);
  // 🔥 STRICTER MATCH: 0.55 ensures ki koi aur face unlock na kar paye
  return distance <= 0.55; 
}