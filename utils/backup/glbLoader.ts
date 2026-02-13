// utils/glbLoader.ts
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import * as THREE from 'three';

// Try to load GLTF/DRACO from three-stdlib, fall back to three/examples
let GLTFLoaderImpl: any = null;
let DRACOLoaderImpl: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const std = require('three-stdlib');
  GLTFLoaderImpl = std.GLTFLoader || std.GLTFLoader?.GLTFLoader || std['GLTFLoader'];
  DRACOLoaderImpl = std.DRACOLoader || std.DRACOLoader?.DRACOLoader || std['DRACOLoader'];
} catch (err) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const ex = require('three/examples/jsm/loaders/GLTFLoader');
    GLTFLoaderImpl = ex.GLTFLoader || ex.default;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const dr = require('three/examples/jsm/loaders/DRACOLoader');
    DRACOLoaderImpl = dr.DRACOLoader || dr.default;
  } catch (err2) {
    GLTFLoaderImpl = null;
    DRACOLoaderImpl = null;
  }
}

type LoadResult = {
  success: boolean;
  scene?: THREE.Group;
  error?: string;
};

function base64ToArrayBuffer(base64: string) {
  if (typeof Buffer !== 'undefined' && (Buffer as any).from) {
    return (Buffer as any).from(base64, 'base64').buffer;
  }
  const atobFn = (global as any).atob || (global as any).decodeBase64String;
  if (typeof atobFn === 'function') {
    const binary = atobFn(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
  }
  return null;
}

/**
 * loadGLBModel(modelAsset)
 * - used by other code if all you want is the local URI (keeps backward compatibility)
 * - returns string URI or null
 */
export const loadGLBModel = async (modelAsset: any): Promise<string | null> => {
  try {
    const asset = Asset.fromModule(modelAsset);
    await asset.downloadAsync();
    return asset.localUri || asset.uri || null;
  } catch (err) {
    console.error('loadGLBModel error:', err);
    return null;
  }
};

/**
 * loadGLBToScene(modelAsset, options)
 * - returns { success, scene } where scene is THREE.Group
 */
export async function loadGLBToScene(modelAsset: any, options?: { useDraco?: boolean }): Promise<LoadResult> {
  try {
    if (!GLTFLoaderImpl) {
      return { success: false, error: 'GLTFLoader not found. Install three-stdlib or ensure three/examples are resolvable.' };
    }

    const asset = Asset.fromModule(modelAsset);
await asset.downloadAsync();
const modelUri = asset.localUri || asset.uri;
console.log('glbLoader → modelAsset:', modelAsset);
console.log('glbLoader → resolved modelUri:', modelUri, ' GLTFLoaderImpl present:', !!GLTFLoaderImpl, ' DRACOLoaderImpl present:', !!DRACOLoaderImpl);
if (!modelUri) return { success: false, error: 'Model URI not available after Asset.downloadAsync()' };


    const LoaderClass = GLTFLoaderImpl;
    const loader = new LoaderClass();

    if (options?.useDraco && DRACOLoaderImpl) {
      const DRACO = DRACOLoaderImpl;
      const dracoLoader = new DRACO();
      // Use CDN decoders (works if device has internet)
      dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
      loader.setDRACOLoader(dracoLoader);
    }

    // First try loader.load(modelUri)
    const tryLoad = () =>
      new Promise<any>((resolve, reject) => {
        try {
          loader.load(
            modelUri,
            (gltf: any) => resolve(gltf),
            undefined,
            (err: any) => reject(err),
          );
        } catch (err) {
          reject(err);
        }
      });

    let gltf: any = null;

    try {
      gltf = await tryLoad();
    } catch (firstErr) {
      // fallback to fetch + parse or expo-file-system base64 -> parse arrayBuffer
      try {
        if (modelUri.startsWith('file://') || modelUri.startsWith('content://')) {
          const base64 = await FileSystem.readAsStringAsync(modelUri, { encoding: FileSystem.EncodingType.Base64 });
          const arrayBuffer = base64ToArrayBuffer(base64);
          if (!arrayBuffer) throw new Error('Failed convert base64->ArrayBuffer');
          gltf = await new Promise((resolve, reject) => {
            loader.parse(arrayBuffer as any, '', (g: any) => resolve(g), (err: any) => reject(err));
          });
        } else {
          // http(s) fetch
          const resp = await fetch(modelUri);
          if (!resp.ok) throw new Error('Network fetch failed: ' + resp.status);
          const arrayBuffer = await resp.arrayBuffer();
          gltf = await new Promise((resolve, reject) => {
            loader.parse(arrayBuffer, '', (g: any) => resolve(g), (err: any) => reject(err));
          });
        }
      } catch (secondErr) {
        const combined = `GLB load failed: firstAttempt:${String(firstErr?.message || firstErr)} | secondAttempt:${String(secondErr?.message || secondErr)}`;
        console.error(combined);
        return { success: false, error: combined };
      }
    }

    if (!gltf) return { success: false, error: 'GLTF parse returned nothing' };

    const scene = gltf.scene || gltf.scenes?.[0];
    if (!scene) return { success: false, error: 'No scene found in GLTF' };

    // Fix textures / materials
    scene.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        const mat = child.material;
        if (mat) {
          if (mat.map) {
            mat.map.encoding = THREE.sRGBEncoding;
            mat.map.needsUpdate = true;
          }
          if (mat.emissiveMap) {
            mat.emissiveMap.encoding = THREE.sRGBEncoding;
            mat.emissiveMap.needsUpdate = true;
          }
          if (mat.isMeshStandardMaterial || mat.isMeshPhysicalMaterial) {
            mat.roughness = mat.roughness ?? 0.6;
            mat.metalness = mat.metalness ?? 0.0;
            mat.needsUpdate = true;
          }
        }
      }
    });

    // auto-scale model to reasonable size
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
      const desired = 6;
      const scale = desired / maxDim;
      scene.scale.setScalar(scale);
    }

    return { success: true, scene };
  } catch (err: any) {
    console.error('loadGLBToScene error:', err);
    return { success: false, error: String(err?.message || err) };
  }
}
