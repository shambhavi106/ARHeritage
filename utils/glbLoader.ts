import { Asset } from 'expo-asset';

// Create a simple GLTF loader for Expo
export class ExpoGLTFLoader {
  static async load(modelAsset: any) {
    try {
      // Get the asset URI
      const asset = Asset.fromModule(modelAsset);
      await asset.downloadAsync();
      const modelUri = asset.localUri || asset.uri;
      
      console.log('Loading GLB from:', modelUri);
      
      // For now, return the URI - we'll parse it in the AR component
      return {
        success: true,
        uri: modelUri,
        asset: asset
      };
      
    } catch (error: any) {  // Fixed error type
      console.error('GLB loading error:', error);
      return {
        success: false,
        error: error?.message || 'Unknown error'  // Fixed error message
      };
    }
  }
}

// Also export the function you had before for backward compatibility
export const loadGLBModel = async (modelAsset: any) => {
  try {
    // Get the asset
    const asset = Asset.fromModule(modelAsset);
    await asset.downloadAsync();
    
    // Return the local URI
    return asset.localUri || asset.uri;
  } catch (error: any) {  // Fixed error type
    console.error('Error loading GLB model:', error);
    return null;
  }
};
