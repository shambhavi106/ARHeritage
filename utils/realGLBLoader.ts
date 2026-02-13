// utils/RealGLBLoader.ts
import { Asset } from 'expo-asset';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';


export class RealGLBLoader {
  static async loadGLBModel(
    modelAsset: any,
    renderer: THREE.WebGLRenderer
  ): Promise<THREE.Group | null> {
    try {
      console.log('🔄 Loading real GLB model...');

      // Get asset URI
      const asset = Asset.fromModule(modelAsset);
      await asset.downloadAsync();
      const modelUri = asset.localUri || asset.uri;

      console.log('📂 GLB URI:', modelUri);

      const loader = new GLTFLoader();

      return new Promise((resolve, reject) => {
        loader.load(
          modelUri,
          (gltf) => {
            console.log('✅ GLB loaded successfully!');
            const model = gltf.scene;

            const maxAniso = renderer.capabilities.getMaxAnisotropy();

            model.traverse((child: any) => {
              if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;

                const mat = child.material;
                if (mat) {
                  if (mat.map) {
                    mat.map.colorSpace = THREE.SRGBColorSpace;
                    mat.map.anisotropy = maxAniso;
                    mat.map.generateMipmaps = true;
                    mat.map.minFilter = THREE.LinearMipmapLinearFilter;
                    mat.map.needsUpdate = true;
                  }

                  if (mat.emissiveMap) {
                    mat.emissiveMap.colorSpace = THREE.SRGBColorSpace;
                    mat.emissiveMap.anisotropy = maxAniso;
                    mat.emissiveMap.generateMipmaps = true;
                    mat.emissiveMap.minFilter = THREE.LinearMipmapLinearFilter;
                    mat.emissiveMap.needsUpdate = true;
                  }
                }
              }
            });

            resolve(model);
          },
          (progress) => {
            if (progress.total) {
              console.log(`📈 Loading progress: ${(progress.loaded / progress.total) * 100}%`);
            }
          },
          (error) => {
            console.error('❌ GLB loading error:', error);
            reject(error);
          }
        );
      });
    } catch (error) {
      console.error('❌ GLB asset error:', error);
      return null;
    }
  }
}
