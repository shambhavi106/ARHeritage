// components/ARViewer.tsx
import { GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import React, { useState } from 'react';
import { PixelRatio, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as THREE from 'three';
import { loadGLBToScene } from '../utils/glbLoader';

type Props = {
  modelAsset: any;
  siteName: string;
  onBack: () => void;
};

export default function ARViewer({ modelAsset, siteName, onBack }: Props) {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState('Initializing...');
  const [modelLoaded, setModelLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createFallbackModel = (siteName: string) => {
    const group = new THREE.Group();
    // simple fallback cube
    const geom = new THREE.BoxGeometry(3, 3, 3);
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const box = new THREE.Mesh(geom, mat);
    box.castShadow = true;
    box.receiveShadow = true;
    group.add(box);
    return group;
  };

  const onContextCreate = async (gl: any) => {
    try {
      setLoadingStatus('Setting up renderer...');
      const { drawingBufferWidth: screenWidth, drawingBufferHeight: screenHeight } = gl;

      const renderer = new Renderer({ gl });
      // cap pixel ratio to avoid OOM on very high DPI devices
      renderer.setPixelRatio(Math.min(PixelRatio.get(), 2));
      renderer.setSize(screenWidth, screenHeight);
      renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.0;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x87CEEB);

      const camera = new THREE.PerspectiveCamera(60, screenWidth / screenHeight, 0.1, 1000);
      camera.position.set(6, 8, 12);
      camera.lookAt(0, 2, 0);

      const ambient = new THREE.AmbientLight(0xffffff, 0.4);
      scene.add(ambient);

      const directional = new THREE.DirectionalLight(0xffffff, 1.5);
      directional.position.set(20, 25, 15);
      directional.castShadow = true;
      directional.shadow.mapSize.width = 2048;
      directional.shadow.mapSize.height = 2048;
      scene.add(directional);

      // ground plane to receive shadows
      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(50, 50),
        new THREE.MeshStandardMaterial({ color: 0x90EE90 })
      );
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -1;
      ground.receiveShadow = true;
      scene.add(ground);

      setLoadingStatus('Loading and parsing GLB...');

      let monument: THREE.Object3D | null = null;
      try {
        // Use the new robust loader
        const res = await loadGLBToScene(modelAsset, { useDraco: false });
        if (res.success && res.scene) {
          monument = res.scene;
          setLoadingStatus('Model parsed successfully');
        } else {
          console.warn('GLB parse failed:', res.error);
          monument = createFallbackModel(siteName);
          setLoadingStatus('Using fallback model');
        }
      } catch (err) {
        console.warn('GLB loader threw:', err);
        monument = createFallbackModel(siteName);
        setLoadingStatus('Using fallback model (exception)');
      }

      if (monument) {
        monument.position.set(0, 0, 0);
        scene.add(monument);
      }

      setModelLoaded(true);
      setIsLoading(false);
      setLoadingStatus('Ready');

      // animation loop
      let time = 0;
      const render = () => {
        requestAnimationFrame(render);
        time += 0.01;
        if (monument) {
          monument.rotation.y += 0.003;
          monument.position.y = Math.sin(time * 0.6) * 0.02;
        }
        renderer.render(scene, camera);
        gl.endFrameEXP();
      };
      render();
    } catch (err: any) {
      console.error('AR Scene Error:', err);
      setError(String(err?.message || err));
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>❌ AR Error</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // msaaSamples can crash on older devices; if you get a crash try removing or set to 0
  return (
    <View style={styles.container}>
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingTitle}>🏛️ Loading {siteName}</Text>
          <Text style={styles.loadingText}>{loadingStatus}</Text>
        </View>
      )}
      <GLView style={styles.glView} onContextCreate={onContextCreate} msaaSamples={4} />
      <View style={styles.overlay}>
        <View style={styles.topOverlay}>
          <Text style={styles.overlayTitle}>🏛️ {siteName}</Text>
          <Text style={styles.overlaySubtitle}>{modelLoaded ? '✅ Model Ready' : 'Loading...'}</Text>
        </View>

        <View style={styles.bottomOverlay}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← Back to Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  glView: { flex: 1 },
  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  loadingTitle: { color: 'white', fontSize: 26, fontWeight: 'bold', marginBottom: 15 },
  loadingText: { color: '#90EE90', fontSize: 16 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'box-none' },
  topOverlay: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 20 },
  overlayTitle: { color: 'white', fontSize: 24, fontWeight: 'bold', backgroundColor: 'rgba(0,0,0,0.6)', padding: 12, borderRadius: 12 },
  overlaySubtitle: { color: '#90EE90', fontSize: 14, marginTop: 8 },
  bottomOverlay: { position: 'absolute', bottom: 60, alignItems: 'center', width: '100%' },
  backButton: { backgroundColor: 'rgba(255,255,255,0.9)', padding: 12, borderRadius: 12, minWidth: 140, alignItems: 'center' },
  backButtonText: { color: '#333', fontSize: 16, fontWeight: 'bold' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorTitle: { color: '#ff6b6b', fontSize: 22, marginBottom: 12 },
  errorText: { color: '#ff9999', textAlign: 'center', marginBottom: 20 }
});
