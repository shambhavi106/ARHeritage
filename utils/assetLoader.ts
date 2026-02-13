import { Asset } from 'expo-asset';

export const getModelAsset = async (modelName: string) => {
  const modelMap: { [key: string]: any } = {
    konark: require('../assets/models/konark.glb'),
    taj: require('../assets/models/taj.glb'),
    jagannath: require('../assets/models/jagannath.glb')
  };
  
  try {
    const asset = Asset.fromModule(modelMap[modelName]);
    await asset.downloadAsync();
    return asset.uri;
  } catch (error) {
    console.error(`Failed to load model ${modelName}:`, error);
    return null;
  }
};
