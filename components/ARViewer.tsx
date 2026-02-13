// ARViewer.tsx
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import { GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  GestureResponderEvent,
  PanResponder,
  PanResponderGestureState,
  PixelRatio,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as THREE from 'three';

// Try three-stdlib first, fallback to three/examples
let GLTFLoaderImpl: any = null;
try {
  const std = require('three-stdlib');
  GLTFLoaderImpl = std.GLTFLoader || std['GLTFLoader'];
} catch (e) {
  try {
    const ex = require('three/examples/jsm/loaders/GLTFLoader');
    GLTFLoaderImpl = ex.GLTFLoader || ex.default;
  } catch (err) {
    GLTFLoaderImpl = null;
  }
}

type Props = {
  modelAsset: any;
  siteName: string;
  onBack: () => void;
};

const { width: WINDOW_WIDTH } = Dimensions.get('window');

export default function ARViewer({ modelAsset, siteName, onBack }: Props) {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState('Initializing...');
  const [modelLoaded, setModelLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [isRotating, setIsRotating] = useState(true);

  // THREE refs
  const monumentRef = useRef<THREE.Object3D | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<any>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);

  // Interaction state
  const rotationY = useRef(0);
  const rotationX = useRef(0);
  const baseRotation = useRef(0);
  const cameraDistance = useRef(12);
  const lastRotationY = useRef(0);
  const lastRotationX = useRef(0);

  // Pinch helpers
  const initialPinchDistance = useRef<number | null>(null);
  const lastPinchCameraDistance = useRef<number>(12);

  // Cached model bounds so reset uses the same computed values
  const modelBoundsRef = useRef<{
    size?: THREE.Vector3;
    boundingSphere?: THREE.Sphere;
    focusY?: number;
    camHeight?: number;
    recommendedDistance?: number;
    camXOffset?: number;
  }>({});

  // PanResponder
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onStartShouldSetPanResponderCapture: () => true,
    onMoveShouldSetPanResponderCapture: () => true,

    onPanResponderGrant: (evt: GestureResponderEvent) => {
      setIsRotating(false);
      const touches = (evt.nativeEvent as any).touches || [];
      if (touches.length === 2) {
        const t1 = touches[0];
        const t2 = touches[1];
        initialPinchDistance.current = Math.hypot(t1.pageX - t2.pageX, t1.pageY - t2.pageY);
        lastPinchCameraDistance.current = cameraDistance.current;
      } else {
        initialPinchDistance.current = null;
      }
    },

    onPanResponderMove: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
      const touches = (evt.nativeEvent as any).touches || [];
      if (touches.length === 2) {
        const t1 = touches[0];
        const t2 = touches[1];
        const distance = Math.hypot(t1.pageX - t2.pageX, t1.pageY - t2.pageY);
        if (initialPinchDistance.current && initialPinchDistance.current > 0) {
          const scale = distance / initialPinchDistance.current;
          const newDist = lastPinchCameraDistance.current / scale;
          cameraDistance.current = Math.max(4, Math.min(60, newDist));
        }
      } else {
        const sensitivityX = 0.005;
        const sensitivityY = 0.01;
        rotationY.current = lastRotationY.current + gestureState.dx * sensitivityY;
        const nextX = lastRotationX.current + gestureState.dy * sensitivityX;
        const maxTilt = Math.PI / 3;
        rotationX.current = Math.max(-maxTilt, Math.min(maxTilt, nextX));
      }
    },

    onPanResponderRelease: () => {
      lastRotationY.current = rotationY.current;
      lastRotationX.current = rotationX.current;
      initialPinchDistance.current = null;
      lastPinchCameraDistance.current = cameraDistance.current;
    },

    onPanResponderTerminationRequest: () => true,
  });

  const createFallbackModel = (siteName: string) => {
    const group = new THREE.Group();
    if (siteName.includes('Taj')) {
      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(2, 32, 16),
        new THREE.MeshStandardMaterial({ color: 0xfffff0, roughness: 0.3 })
      );
      dome.position.y = 4;
      group.add(dome);

      const building = new THREE.Mesh(
        new THREE.BoxGeometry(4, 2.5, 4),
        new THREE.MeshStandardMaterial({ color: 0xfffff0, roughness: 0.4 })
      );
      building.position.y = 1.25;
      group.add(building);

      for (let i = 0; i < 4; i++) {
        const minaret = new THREE.Mesh(
          new THREE.CylinderGeometry(0.25, 0.3, 5, 16),
          new THREE.MeshStandardMaterial({ color: 0xfffff0, roughness: 0.4 })
        );
        const angle = (i / 4) * Math.PI * 2;
        minaret.position.x = Math.cos(angle) * 3.5;
        minaret.position.z = Math.sin(angle) * 3.5;
        minaret.position.y = 2.5;
        group.add(minaret);
      }
    } else if (siteName.includes('Konark')) {
      const temple = new THREE.Mesh(
        new THREE.BoxGeometry(3.5, 5, 2.5),
        new THREE.MeshStandardMaterial({ color: 0xdaa520, roughness: 0.5 })
      );
      temple.position.y = 2.5;
      group.add(temple);
    } else {
      const tower = new THREE.Mesh(
        new THREE.ConeGeometry(1.8, 7, 12),
        new THREE.MeshStandardMaterial({ color: 0xff6347, roughness: 0.5 })
      );
      tower.position.y = 3.5;
      group.add(tower);
    }
    return group;
  };

  const onContextCreate = async (gl: any) => {
    try {
      setLoadingStatus('Setting up renderer...');
      const { drawingBufferWidth: screenWidth, drawingBufferHeight: screenHeight } = gl;

      const renderer = new Renderer({ gl });
      renderer.setPixelRatio(Math.min(PixelRatio.get(), 2));
      renderer.setSize(screenWidth, screenHeight);
      renderer.setClearColor(0x87ceeb, 1);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      rendererRef.current = renderer;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x87ceeb);
      sceneRef.current = scene;

      // Camera created now but positioned after model fit calculation
      const camera = new THREE.PerspectiveCamera(60, screenWidth / screenHeight, 0.1, 1000);
      cameraRef.current = camera;

      // Lighting
      const ambient = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambient);

      const dir = new THREE.DirectionalLight(0xffffff, 1.0);
      dir.position.set(10, 20, 10);
      dir.castShadow = true;
      dir.shadow.mapSize.width = 2048;
      dir.shadow.mapSize.height = 2048;
      scene.add(dir);

      // Ground plane
      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(60, 60),
        new THREE.MeshStandardMaterial({ color: 0x90ee90 })
      );
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -1;
      ground.receiveShadow = true;
      scene.add(ground);

      // Load model (GLB) or fallback
      setLoadingStatus('Loading model...');
      let monument: THREE.Object3D | null = null;

      try {
        if (modelAsset && GLTFLoaderImpl) {
          const asset = Asset.fromModule(modelAsset);
          await asset.downloadAsync();
          const modelUri = asset.localUri || asset.uri;

          const LoaderClass = GLTFLoaderImpl;
          const loader = new LoaderClass();

          let arrayBuffer: ArrayBuffer | null = null;

          if (typeof modelUri === 'string' && (modelUri.startsWith('file://') || modelUri.startsWith('content://'))) {
            const base64 = await FileSystem.readAsStringAsync(modelUri, { encoding: 'base64' });
            const dataUrl = `data:application/octet-stream;base64,${base64}`;
            const resp = await fetch(dataUrl);
            arrayBuffer = await resp.arrayBuffer();
          } else if (typeof modelUri === 'string') {
            const resp = await fetch(modelUri);
            if (!resp.ok) throw new Error(`Fetch failed: ${resp.status}`);
            arrayBuffer = await resp.arrayBuffer();
          }

          if (arrayBuffer) {
            setLoadingStatus('Parsing GLB...');
            const gltf: any = await new Promise((resolve, reject) => {
              loader.parse(arrayBuffer as any, '', (g: any) => resolve(g), (err: any) => reject(err));
            });

            const loadedScene = gltf.scene || gltf.scenes?.[0];
            if (loadedScene) {
              loadedScene.traverse((child: any) => {
                if (child.isMesh) {
                  child.castShadow = true;
                  child.receiveShadow = true;
                }
              });
              monument = loadedScene;
            }
          }
        }
      } catch (glbError) {
        console.warn('GLB loading failed:', glbError);
      }

      if (!monument) {
        monument = createFallbackModel(siteName);
      }

      if (monument) {
        // --- IMPORTANT: scale first, then recenter using post-scale bounds ---
        // 1) compute original bounding box + size
        const box = new THREE.Box3().setFromObject(monument);
        const center = new THREE.Vector3();
        const size = new THREE.Vector3();
        box.getCenter(center);
        box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);

        // 2) scale model so largest dimension equals desiredSize
        const desiredSize = 6; // global visual scale target (adjust if you want models larger/smaller)
        const scaleFactor = maxDim > 0 ? desiredSize / maxDim : 1;
        monument.scale.setScalar(scaleFactor);

        // 3) recompute bounding box AFTER scaling, then center at origin (so camera math is simpler)
        const box2 = new THREE.Box3().setFromObject(monument);
        const centerAfter = new THREE.Vector3();
        box2.getCenter(centerAfter);
        monument.position.sub(centerAfter); // shift model so center sits at world origin

        // 4) vertical correction: make the lowest model point sit slightly above ground (y=0)
        const sizeScaled = new THREE.Vector3();
        box2.getSize(sizeScaled);
        const minY = box2.min.y;
        // lift model a bit so it doesn't clip into ground
        const groundOffset = Math.max(sizeScaled.y * 0.05, 0.1); // 5% of height or at least 0.1 units
        monument.position.y += -minY + groundOffset;

        // 5) compute bounding sphere (used to derive reliable camera distance)
        const sphere = new THREE.Sphere();
        box2.getBoundingSphere(sphere);

        // 6) compute desired camera distance using FOV and sphere radius so model fits
        const fovRad = (camera.fov * Math.PI) / 180;
        // distance formula: radius / sin(fov/2); multiply by small factor (1.25) for padding
        let recommendedDistance = Math.abs(sphere.radius / Math.sin(fovRad / 2)) * 1.25;
        // clamp into reasonable bounds
        recommendedDistance = Math.max(recommendedDistance, 4);
        recommendedDistance = Math.min(recommendedDistance, 120);
        cameraDistance.current = recommendedDistance;
        lastPinchCameraDistance.current = cameraDistance.current;

        // 7) camera height and focus Y relative to model dimensions
        const camHeight = Math.max(sizeScaled.y * 0.6, sphere.radius * 0.6, 2.5);
        const focusY = sizeScaled.y * 0.45;

        // 8) horizontal camera offset (so model appears centered in the app viewport)
        //    cameraX = sizeScaled.x * horizontalCamBias (positive moves camera right -> makes model appear more left)
        const horizontalCamBias = 0.06; // tweak this to nudge horizontally (positive shifts camera right)
        const camXOffset = sizeScaled.x * horizontalCamBias;

        // cache model bounds for reset
        modelBoundsRef.current.size = sizeScaled.clone();
        modelBoundsRef.current.boundingSphere = sphere.clone();
        modelBoundsRef.current.focusY = focusY;
        modelBoundsRef.current.camHeight = camHeight;
        modelBoundsRef.current.recommendedDistance = recommendedDistance;
        modelBoundsRef.current.camXOffset = camXOffset;

        // 9) Add model to scene and keep reference
        monumentRef.current = monument;
        scene.add(monument);

        // 10) Setup camera: place it at X = camXOffset, Z = recommendedDistance, Y = camHeight, look at model center + focusY
        camera.position.set(camXOffset, camHeight, recommendedDistance);
        camera.aspect = screenWidth / screenHeight;
        camera.updateProjectionMatrix();
        camera.lookAt(new THREE.Vector3(0, focusY, 0));
      }

      // Add some distant trees for visual context (unchanged)
      for (let i = 0; i < 8; i++) {
        const tree = new THREE.Mesh(
          new THREE.ConeGeometry(0.8, 3, 8),
          new THREE.MeshStandardMaterial({ color: 0x228b22 })
        );
        const angle = (i / 8) * Math.PI * 2;
        const radius = 15 + Math.random() * 5;
        tree.position.x = Math.cos(angle) * radius;
        tree.position.z = Math.sin(angle) * radius;
        tree.position.y = 1.5;
        tree.castShadow = true;
        scene.add(tree);
      }

      setModelLoaded(true);
      setIsLoading(false);

      // Render loop
      let time = 0;

      // small closure-cached values for camera update avoid recomputing bounding boxes each frame
      const cachedFocusY = modelBoundsRef.current.focusY ?? 1.5;
      const cachedCamHeight = modelBoundsRef.current.camHeight ?? 3;
      const cachedCamX = modelBoundsRef.current.camXOffset ?? 0;
      const minCamDistance = 4;

      const render = () => {
        requestAnimationFrame(render);
        time += 0.01;

        const mon = monumentRef.current;
        if (mon) {
          if (isRotating) baseRotation.current += 0.004;
          mon.rotation.y = baseRotation.current + rotationY.current;
          mon.rotation.x = rotationX.current;
        }

        // Update camera to reflect pinch zoom (cameraDistance current)
        if (cameraRef.current) {
          const cam = cameraRef.current;
          // keep camera on a line (camX, camHeight, distance)
          const camHeightRuntime = Math.max(cachedCamHeight, 1.5);
          const dist = Math.max(cameraDistance.current, minCamDistance);
          cam.position.set(cachedCamX, camHeightRuntime, dist);
          cam.lookAt(new THREE.Vector3(0, cachedFocusY, 0));
        }

        renderer.render(scene, cameraRef.current!);
        gl.endFrameEXP();
      };
      render();
    } catch (err: any) {
      console.error('AR Scene Error:', err);
      setError(err.message || 'Failed to create AR scene');
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>⚠️ AR Error</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const webTouchStyle = Platform.OS === 'web' ? { touchAction: 'none' as any } : undefined;
  const topOffset = Platform.OS === 'android' ? (StatusBar.currentHeight ? StatusBar.currentHeight + 6 : 18) : 18;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <Text style={styles.loadingTitle}>🏛️ Loading {siteName}</Text>
            <Text style={styles.loadingText}>{loadingStatus}</Text>
            <View style={styles.loadingDots}>
              <View style={styles.dot} />
              <View style={styles.dot} />
              <View style={styles.dot} />
            </View>
          </View>
        )}

        <View style={[styles.glViewContainer, webTouchStyle]} {...(panResponder.panHandlers as any)}>
          <GLView style={styles.glView} onContextCreate={onContextCreate} />
        </View>

        {modelLoaded && (
          <View style={styles.overlay} pointerEvents="box-none">
            <View style={[styles.topOverlay, { top: topOffset }]}>
              <View style={styles.headerContainer}>
                <Text style={styles.overlayTitle}>🏛️ {siteName}</Text>
              </View>
              <Text style={styles.overlaySubtitle}>✅ Interactive 3D Model</Text>
            </View>

            <View style={styles.controlsPanel}>
              <TouchableOpacity
                style={[styles.controlButton, isRotating && styles.controlButtonActive]}
                onPress={() => setIsRotating(!isRotating)}
              >
                <Text style={styles.controlText}>
                  {isRotating ? '⏸️ Pause' : '▶️ Rotate'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.controlButton} onPress={() => setShowInfo(!showInfo)}>
                <Text style={styles.controlText}>ℹ️ Info</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => {
                  // Reset view: recenter rotations and camera distance (recalculate camera height from cached model bounds)
                  rotationY.current = 0;
                  rotationX.current = 0;
                  baseRotation.current = 0;
                  lastRotationY.current = 0;
                  lastRotationX.current = 0;

                  const mb = modelBoundsRef.current;
                  if (monumentRef.current && mb.boundingSphere && mb.camHeight && mb.recommendedDistance) {
                    cameraDistance.current = mb.recommendedDistance;
                    lastPinchCameraDistance.current = cameraDistance.current;
                    if (cameraRef.current) {
                      const camX = mb.camXOffset ?? 0;
                      cameraRef.current.position.set(camX, mb.camHeight, cameraDistance.current);
                      cameraRef.current.lookAt(new THREE.Vector3(0, mb.focusY ?? (mb.size ? (mb.size.y * 0.45) : 1.5), 0));
                      cameraRef.current.updateProjectionMatrix();
                    }
                  } else {
                    cameraDistance.current = 12;
                    lastPinchCameraDistance.current = 12;
                    if (cameraRef.current) {
                      cameraRef.current.position.set(0, 3, 12);
                      cameraRef.current.lookAt(new THREE.Vector3(0, 1.5, 0));
                      cameraRef.current.updateProjectionMatrix();
                    }
                  }
                  setIsRotating(true);
                }}
              >
                <Text style={styles.controlText}>🏠 Reset</Text>
              </TouchableOpacity>
            </View>

            {showInfo && (
              <View style={styles.infoPanel}>
                <View style={styles.infoPanelContent}>
                  <Text style={styles.infoPanelTitle}>🏛️ Interactive Controls</Text>
                  <Text style={styles.infoPanelText}>
                    • Single finger: Drag to rotate{'\n'}
                    • Two fingers: Pinch to zoom{'\n'}
                    • Toggle auto-rotation{'\n'}
                    • Reset to centered view{'\n'}
                    • High-quality 3D model of {siteName}
                  </Text>
                  <TouchableOpacity style={styles.infoPanelClose} onPress={() => setShowInfo(false)}>
                    <Text style={styles.closeText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={styles.instructionsPanel}>
              <Text style={styles.instructionsText}>Drag to rotate • Pinch to zoom • Controls available</Text>
            </View>

            <View style={styles.bottomOverlay}>
              <TouchableOpacity style={styles.backButton} onPress={onBack}>
                <Text style={styles.backButtonText}>← Back to Details</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000' },
  container: { flex: 1, backgroundColor: '#000' },

  glViewContainer: { flex: 1 },
  glView: { flex: 1 },

  // Loading
  loadingOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center', alignItems: 'center', zIndex: 999
  },
  loadingTitle: { color: 'white', fontSize: 22, fontWeight: '700', marginBottom: 10 },
  loadingText: { color: '#90EE90', fontSize: 14, marginBottom: 20, textAlign: 'center' },
  loadingDots: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'white', opacity: 0.8, marginHorizontal: 6 },

  // Overlay
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'box-none' },

  topOverlay: {
    position: 'absolute',
    left: 0, right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 20,
    width: WINDOW_WIDTH
  },

  headerContainer: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: 22, alignItems: 'center', justifyContent: 'center', width: '90%', maxWidth: 800
  },
  overlayTitle: { color: 'white', fontSize: 18, fontWeight: '700', textAlign: 'center' },
  overlaySubtitle: {
    marginTop: 8, color: '#4CAF50', fontSize: 13,
    backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14
  },

  // Controls (right)
  controlsPanel: { position: 'absolute', top: Platform.OS === 'android' ? 120 : 140, right: 16, alignItems: 'center', zIndex: 20 },
  controlButton: {
    backgroundColor: 'rgba(0,0,0,0.8)', paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 24, minWidth: 76, alignItems: 'center', marginBottom: 12
  },
  controlButtonActive: { backgroundColor: 'rgba(76,175,80,0.85)' },
  controlText: { color: 'white', fontSize: 14, fontWeight: '600' },

  // Info panel and instructions
  infoPanel: { position: 'absolute', top: '24%', left: 18, right: 18, borderRadius: 18, overflow: 'hidden', zIndex: 25 },
  infoPanelContent: { backgroundColor: 'rgba(0,0,0,0.92)', padding: 18 },
  infoPanelTitle: { color: 'white', fontSize: 16, fontWeight: '700', marginBottom: 10, textAlign: 'center' },
  infoPanelText: { color: '#ccc', fontSize: 13, lineHeight: 20 },
  infoPanelClose: { position: 'absolute', top: 10, right: 10, padding: 6 },
  closeText: { color: 'white', fontSize: 16, fontWeight: '700' },

  instructionsPanel: { position: 'absolute', bottom: 110, left: 18, right: 18, alignItems: 'center', zIndex: 20 },
  instructionsText: {
    color: 'white', fontSize: 15,
    backgroundColor: 'rgba(0,0,0,0.72)', paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: 20, textAlign: 'center'
  },

  bottomOverlay: { position: 'absolute', bottom: 36, left: 0, right: 0, alignItems: 'center', zIndex: 20 },
  backButton: {
    backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: 26, paddingVertical: 12,
    borderRadius: 26, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3
  },
  backButtonText: { color: '#333', fontSize: 15, fontWeight: '700' },

  // Error
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#ff6b6b' },
  errorTitle: { color: 'white', fontSize: 20, fontWeight: '700', marginBottom: 12 },
  errorText: { color: 'white', fontSize: 14, textAlign: 'center', marginBottom: 18 }
});
