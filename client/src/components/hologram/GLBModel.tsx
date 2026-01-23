import { useEffect, useRef, memo } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface GLBModelProps {
  isSpeaking: boolean;
  rotation?: number;

  analyserRef?: React.RefObject<AnalyserNode | null>;
  audioDataRef?: React.MutableRefObject<Uint8Array | null>;
}

export const GLBModel = memo(function GLBModel({ isSpeaking, rotation = 0, analyserRef, audioDataRef }: GLBModelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());
  const isSpeakingRef = useRef(isSpeaking);

  // Update ref when prop changes
  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  useEffect(() => {
    if (!containerRef.current) {
      console.error('[GLBModel] Container ref is null!');
      return;
    }

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    
    // Add fog for depth
    scene.fog = new THREE.Fog(0x000000, 2, 10);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      60,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0.5, 2.5);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights - Enhanced with hologram glow effect
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // Golden glow from front (Westmead yellow)
    const pointLight1 = new THREE.PointLight(0xffd700, 1.5);
    pointLight1.position.set(0, 2, 3);
    scene.add(pointLight1);

    // Warm backlight
    const pointLight2 = new THREE.PointLight(0xff6b35, 1.0);
    pointLight2.position.set(-3, 1, -2);
    scene.add(pointLight2);

    // Cool accent light
    const pointLight3 = new THREE.PointLight(0x00d4ff, 0.8);
    pointLight3.position.set(3, -1, -1);
    scene.add(pointLight3);

    // Main spotlight with soft glow
    const spotLight = new THREE.SpotLight(0xffffff, 1.5);
    spotLight.position.set(0, 10, 0);
    spotLight.angle = 0.3;
    spotLight.penumbra = 1;
    scene.add(spotLight);

    // Add subtle background glow plane (like IdleLogo blur effect)
    const glowGeometry = new THREE.PlaneGeometry(4, 4);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 0.03,
      side: THREE.DoubleSide,
    });
    const glowPlane = new THREE.Mesh(glowGeometry, glowMaterial);
    glowPlane.position.set(0, 0.5, -1);
    scene.add(glowPlane);

    // Load GLB model with cache busting
    const loader = new GLTFLoader();
    const modelUrl = `/hologram_model.glb?v=${Date.now()}`;
    
    loader.load(
      modelUrl,
      (gltf) => {
        const model = gltf.scene;
        
        // Center and scale the model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        // Normalize size - optimized for 24-inch monitor
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2.5 / maxDim; // Optimized size for 24-inch display
        model.scale.setScalar(scale);
        
        // Center the model
        model.position.x = -center.x * scale;
        model.position.y = -center.y * scale;
        model.position.z = -center.z * scale;
        
        // Apply rotation for pyramid hologram display
        // Rotate around Y axis to face center
        model.rotation.y = (rotation * Math.PI) / 180;
        
        scene.add(model);
        modelRef.current = model;
        
        // Log model structure to see what's available
        model.traverse((child) => {
          if (child instanceof THREE.Mesh && child.morphTargetDictionary) {
            // Found mesh with morph targets (keep for debugging morph issues)
          }
          if (child instanceof THREE.Bone) {
            // Found bone (keep for debugging bone issues)
          }
        });
        
        // Setup animations if available
        if (gltf.animations && gltf.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(model);
          mixerRef.current = mixer;
          
          // Play all animations
          gltf.animations.forEach((clip) => {
            const action = mixer.clipAction(clip);
            action.play();
          });
          
          console.log('GLB animations loaded:', gltf.animations.length);
        }
        
        console.log('GLB model loaded successfully with rotation:', rotation);
      },
      (progress) => {
        console.log('Loading progress:', (progress.loaded / progress.total * 100).toFixed(2) + '%');
      },
      (error) => {
        console.error('Error loading GLB model:', error);
      }
    );

    // Animation loop with talking movements
    const animate = () => {
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

      animationIdRef.current = requestAnimationFrame(animate);

      const delta = clockRef.current.getDelta();
      
      // Update model animations if available
      if (mixerRef.current) {
        mixerRef.current.update(delta);
      }

      // Add talking animations synchronized with audio
      if (isSpeakingRef.current && modelRef.current && cameraRef.current) {
        const time = Date.now() * 0.001;
        
        // Get real-time audio level directly from analyser
        let currentAudioLevel = 0;
        if (analyserRef?.current && audioDataRef?.current) {
          analyserRef.current.getByteFrequencyData(audioDataRef.current);
          const average = audioDataRef.current.reduce((a, b) => a + b) / audioDataRef.current.length;
          currentAudioLevel = average / 255;
        }
        
        // Use currentAudioLevel for intensity (0-1 range)
        const intensity = currentAudioLevel > 0 ? currentAudioLevel : 0.5; // Fallback if no audioLevel
        
        // Debug log once per second
        if (Math.floor(time) % 2 === 0 && Math.floor(time * 10) % 10 === 0) {
          console.log('Animation loop - isSpeaking:', isSpeakingRef.current, 'currentAudioLevel:', currentAudioLevel.toFixed(3));
        }
        
        // Smooth camera zoom in to half-body view when speaking
        const targetZ = 1.5; // Zoom in from 2.5 to 1.5
        const targetY = 0.7; // Focus higher (chest/head level)
        cameraRef.current.position.z += (targetZ - cameraRef.current.position.z) * 0.05; // Smooth interpolation
        cameraRef.current.position.y += (targetY - cameraRef.current.position.y) * 0.05;
        
        // Head bobbing - synced with audio amplitude
        modelRef.current.position.y += Math.sin(time * 8) * 0.005 * intensity;
        
        // Find all facial bones for mouth animation and eyelids
        let jawBone: THREE.Bone | null = null;
        let headBone: THREE.Bone | null = null;
        let neckBone: THREE.Bone | null = null;
        let leftEye: THREE.Bone | null = null;
        let rightEye: THREE.Bone | null = null;
        let leftArm: THREE.Bone | null = null;
        let rightArm: THREE.Bone | null = null;
        let leftForeArm: THREE.Bone | null = null;
        let rightForeArm: THREE.Bone | null = null;
        let leftHand: THREE.Bone | null = null;
        let rightHand: THREE.Bone | null = null;
        
        modelRef.current.traverse((child) => {
          if (child instanceof THREE.Bone) {
            const boneName = child.name;
            const lowerName = boneName.toLowerCase();
            
            // Look for jaw bone (many possible names)
            if (lowerName.includes('jaw') || 
                lowerName.includes('chin') || 
                lowerName.includes('mandible') ||
                boneName === 'Jaw' || 
                boneName === 'jaw_01' ||
                boneName === 'CC_Base_JawRoot') {
              jawBone = child;
            }
            
            // Look for eye bones for blinking
            if (lowerName.includes('eye') && lowerName.includes('left')) {
              leftEye = child;
            }
            if (lowerName.includes('eye') && lowerName.includes('right')) {
              rightEye = child;
            }
            
            // Look for arm bones
            if ((lowerName.includes('arm') || lowerName.includes('shoulder') || lowerName.includes('upperarm')) && lowerName.includes('left')) {
              leftArm = child;
            }
            if ((lowerName.includes('arm') || lowerName.includes('shoulder') || lowerName.includes('upperarm')) && lowerName.includes('right')) {
              rightArm = child;
            }
            
            // Look for forearm bones
            if ((lowerName.includes('forearm') || lowerName.includes('lowerarm')) && lowerName.includes('left')) {
              leftForeArm = child;
            }
            if ((lowerName.includes('forearm') || lowerName.includes('lowerarm')) && lowerName.includes('right')) {
              rightForeArm = child;
            }
            
            // Look for hand bones
            if (lowerName.includes('hand') && lowerName.includes('left')) {
              leftHand = child;
            }
            if (lowerName.includes('hand') && lowerName.includes('right')) {
              rightHand = child;
            }
            
            if (boneName === 'Head') headBone = child;
            if (boneName === 'Neck') neckBone = child;
          }
        });
        
        // Blinking animation - random blinks every 3-5 seconds
        const blinkTime = time % 4; // 4 second cycle
        let blinkAmount = 0;
        if (blinkTime > 3.5 && blinkTime < 3.7) { // Quick blink
          blinkAmount = Math.sin((blinkTime - 3.5) * Math.PI * 5) * 0.3;
        }
        
        // Approach 1: Animate jaw bone if found (best method)
        if (jawBone) {
          // Rotate jaw to open mouth with slight variation
          const jawRotation = currentAudioLevel * 0.8 + Math.sin(time * 12) * currentAudioLevel * 0.1;
          jawBone.rotation.x = jawRotation;
        } 
        // Approach 2: Head movement for talking effect
        else if (headBone) {
          // Nod head more naturally when speaking
          const talkingBob = Math.sin(time * 15) * currentAudioLevel * 0.15;
          headBone.rotation.x = talkingBob;
          
          // Add side-to-side movement
          headBone.rotation.y = Math.sin(time * 10) * currentAudioLevel * 0.08;
          headBone.rotation.z = Math.sin(time * 12) * currentAudioLevel * 0.05;
          
          // Try morph targets on head mesh as last resort
          modelRef.current.traverse((child) => {
            if (child instanceof THREE.Mesh && child.morphTargetInfluences && child.morphTargetDictionary) {
              const dict = child.morphTargetDictionary;
              
              // Look for any mouth-related morphs
              Object.keys(dict).forEach(morphName => {
                const lowerMorph = morphName.toLowerCase();
                if (lowerMorph.includes('mouth') || 
                    lowerMorph.includes('jaw') || 
                    lowerMorph.includes('viseme') ||
                    lowerMorph.includes('aa') || 
                    lowerMorph.includes('open')) {
                  const index = dict[morphName];
                  if (child.morphTargetInfluences) {
                    child.morphTargetInfluences[index] = currentAudioLevel * 3.0;
                  }
                }
                // Apply blinking to eye morphs
                if (lowerMorph.includes('blink') || lowerMorph.includes('eye') && lowerMorph.includes('close')) {
                  const index = dict[morphName];
                  if (child.morphTargetInfluences) {
                    child.morphTargetInfluences[index] = blinkAmount;
                  }
                }
              });
            }
          });
        }
        
        // Arm gestures - natural talking movements
        if (leftArm) {
          // Left arm raises slightly and gestures
          leftArm.rotation.z = Math.sin(time * 2.5) * currentAudioLevel * 0.3 + 0.2; // Slight outward movement
          leftArm.rotation.x = Math.sin(time * 3.2) * currentAudioLevel * 0.15;
        }
        
        if (rightArm) {
          // Right arm gestures offset from left for natural asymmetry
          rightArm.rotation.z = Math.sin(time * 2.8 + 1) * currentAudioLevel * 0.3 - 0.2; // Slight outward movement
          rightArm.rotation.x = Math.sin(time * 3.5 + 0.5) * currentAudioLevel * 0.15;
        }
        
        if (leftForeArm) {
          // Forearm bends at elbow
          leftForeArm.rotation.y = Math.sin(time * 4) * currentAudioLevel * 0.2;
        }
        
        if (rightForeArm) {
          // Forearm bends at elbow (opposite phase)
          rightForeArm.rotation.y = Math.sin(time * 4 + Math.PI) * currentAudioLevel * 0.2;
        }
        
        if (leftHand) {
          // Hand gestures - slight rotation
          leftHand.rotation.z = Math.sin(time * 5) * currentAudioLevel * 0.1;
          leftHand.rotation.x = Math.sin(time * 6) * currentAudioLevel * 0.08;
        }
        
        if (rightHand) {
          // Hand gestures - slight rotation (opposite phase)
          rightHand.rotation.z = Math.sin(time * 5 + 1.5) * currentAudioLevel * 0.1;
          rightHand.rotation.x = Math.sin(time * 6 + 1.5) * currentAudioLevel * 0.08;
        }
        
        // Slight head tilt/rotation for more natural movement
        modelRef.current.rotation.x = Math.sin(time * 4) * 0.02 * intensity + Math.sin(time * 2.3) * 0.01;
        modelRef.current.rotation.y = Math.sin(time * 2.7) * 0.03 * intensity; // Add Y-axis rotation
        modelRef.current.rotation.z = Math.sin(time * 3) * 0.015 * intensity;
      } else if (cameraRef.current) {
        // Zoom out smoothly when not speaking (back to default position)
        const defaultZ = 2.5; // Default distance
        const defaultY = 0.5; // Default height
        cameraRef.current.position.z += (defaultZ - cameraRef.current.position.z) * 0.05;
        cameraRef.current.position.y += (defaultY - cameraRef.current.position.y) * 0.05;
      }

      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }

      // Dispose geometries and materials
      if (sceneRef.current) {
        sceneRef.current.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.geometry.dispose();
            if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose());
            } else {
              object.material.dispose();
            }
          }
        });
      }
    };
  }, []); // Only run once on mount, animation loop handles isSpeaking changes

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-full"
      style={{ pointerEvents: 'none' }}
    />
  );
});
