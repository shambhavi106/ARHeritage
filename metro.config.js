const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure resolver exists
config.resolver = config.resolver || {};

// Allow .mjs and .cjs extensions
config.resolver.sourceExts = config.resolver.sourceExts || [];
const sourceExts = ['mjs', 'cjs'];
sourceExts.forEach(ext => {
  if (!config.resolver.sourceExts.includes(ext)) {
    config.resolver.sourceExts.push(ext);
  }
});

// Add 3D model file extensions to assets
config.resolver.assetExts = config.resolver.assetExts || [];
const modelExts = ['glb', 'gltf', 'obj', 'fbx', 'mtl', 'dae', '3ds'];
modelExts.forEach(ext => {
  if (!config.resolver.assetExts.includes(ext)) {
    config.resolver.assetExts.push(ext);
  }
});

// Also ensure audio extensions are included
const audioExts = ['mp3', 'wav', 'aac', 'm4a'];
audioExts.forEach(ext => {
  if (!config.resolver.assetExts.includes(ext)) {
    config.resolver.assetExts.push(ext);
  }
});

module.exports = config;
