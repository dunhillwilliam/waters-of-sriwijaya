import * as THREE from 'three';

export interface WaterUniforms {
  [uniform: string]: THREE.IUniform<unknown>;
  uTime: THREE.IUniform<number>;
  uShallowColor: THREE.IUniform<THREE.Color>;
  uDeepColor: THREE.IUniform<THREE.Color>;
  uSkyHorizonColor: THREE.IUniform<THREE.Color>;
  uSunDir: THREE.IUniform<THREE.Vector3>;
  uFogColor: THREE.IUniform<THREE.Color>;
  uFogDensity: THREE.IUniform<number>;
  uBoatPos: THREE.IUniform<THREE.Vector3>;
  uBoatSpeed: THREE.IUniform<number>;
}

export function createWaterShaderMaterial(): {
  material: THREE.ShaderMaterial;
  uniforms: WaterUniforms;
} {
  const uniforms: WaterUniforms = {
    uTime: { value: 0 },
    uShallowColor: { value: new THREE.Color(0x3a6b60) },
    uDeepColor: { value: new THREE.Color(0x1b4552) },
    uSkyHorizonColor: { value: new THREE.Color(0xf4a261) },
    uSunDir: { value: new THREE.Vector3(0.55, 0.25, -0.78).normalize() },
    uFogColor: { value: new THREE.Color(0xe6a16d) },
    uFogDensity: { value: 0.0066 },
    uBoatPos: { value: new THREE.Vector3(0, 0, 0) },
    uBoatSpeed: { value: 0 }
  };

  const vertexShader = /* glsl */ `
    uniform float uTime;
    uniform vec3 uBoatPos;
    uniform float uBoatSpeed;

    varying vec3 vWorldPos;
    varying vec3 vNormal;
    varying float vWaveHeight;

    float waveHeight(vec2 p, float t) {
      float w1 = sin(p.x * 0.22 + t * 1.1) * cos(p.y * 0.18 + t * 0.85) * 0.11;
      float w2 = sin((p.x - p.y) * 0.42 + t * 1.55) * 0.045;
      float w3 = cos(p.x * 0.78 + p.y * 0.56 - t * 2.0) * 0.02;
      return w1 + w2 + w3;
    }

    void main() {
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vec2 p = worldPosition.xz;

      float h = waveHeight(p, uTime);

      // Crisp gentle wake wave right around moving hull
      float distBoat = length(p - uBoatPos.xz);
      float wakeMask = smoothstep(5.2, 1.1, distBoat) * clamp(uBoatSpeed * 0.1, 0.0, 0.85);
      h += sin(distBoat * 4.2 - uTime * 8.0) * 0.045 * wakeMask;

      worldPosition.y += h;

      float eps = 0.3;
      float hx = waveHeight(p + vec2(eps, 0.0), uTime);
      float hz = waveHeight(p + vec2(0.0, eps), uTime);
      vec3 n = normalize(vec3(h - hx, eps, h - hz));

      vWorldPos = worldPosition.xyz;
      vNormal = n;
      vWaveHeight = h;

      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `;

  const fragmentShader = /* glsl */ `
    uniform float uTime;
    uniform vec3 uShallowColor;
    uniform vec3 uDeepColor;
    uniform vec3 uSkyHorizonColor;
    uniform vec3 uSunDir;
    uniform vec3 uFogColor;
    uniform float uFogDensity;
    uniform vec3 uBoatPos;
    uniform float uBoatSpeed;

    varying vec3 vWorldPos;
    varying vec3 vNormal;
    varying float vWaveHeight;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
        u.y
      );
    }

    void main() {
      vec3 viewDir = normalize(cameraPosition - vWorldPos);

      // Fine high-frequency river ripples (crisp water sheen, not blotchy mud)
      vec2 rippleUv1 = vWorldPos.xz * 1.35 + vec2(uTime * 0.35, uTime * 0.22);
      vec2 rippleUv2 = vWorldPos.xz * 2.65 - vec2(uTime * 0.24, -uTime * 0.31);
      float n1 = noise(rippleUv1);
      float n2 = noise(rippleUv2);
      vec3 perturbedNormal = normalize(vNormal + vec3((n1 - 0.5) * 0.14, 0.0, (n2 - 0.5) * 0.14));

      // Clean shallow-to-deep river gradient
      float bankFactor = smoothstep(16.0, 44.0, abs(vWorldPos.x));
      vec3 waterCol = mix(uDeepColor, uShallowColor, bankFactor * 0.72);
      waterCol += vec3(0.03, 0.05, 0.04) * clamp(vWaveHeight * 3.0, -0.2, 0.4);

      // Fresnel sky reflection (warm golden horizon shimmer on water)
      float fresnel = pow(1.0 - max(dot(viewDir, perturbedNormal), 0.0), 2.8);
      vec3 skyTint = mix(uSkyHorizonColor, vec3(1.0, 0.88, 0.68), 0.35);
      waterCol = mix(waterCol, skyTint, clamp(fresnel * 0.68, 0.12, 0.72));

      // Crisp golden-hour sun path glints
      vec3 halfVec = normalize(uSunDir + viewDir);
      float spec = pow(max(dot(perturbedNormal, halfVec), 0.0), 110.0);
      waterCol += vec3(1.0, 0.88, 0.62) * spec * 1.1;

      // Delicate shoreline foam & subtle hull bow ripple shimmer
      float distBoat = length(vWorldPos.xz - uBoatPos.xz);
      float rippleRing = sin(distBoat * 5.0 - uTime * 7.0) * 0.5 + 0.5;
      float bowRipple = smoothstep(3.6, 1.4, distBoat) * smoothstep(0.95, 1.5, distBoat) * rippleRing * clamp(uBoatSpeed * 0.05, 0.0, 0.22);
      float bankFoam = smoothstep(35.0, 42.0, abs(vWorldPos.x)) * smoothstep(0.62, 0.84, n2) * 0.32;
      waterCol = mix(waterCol, vec3(0.96, 0.93, 0.87), clamp(bowRipple + bankFoam, 0.0, 0.35));

      // Exponential distance fog matching scene.fog
      float distCam = length(cameraPosition - vWorldPos);
      float fogFactor = 1.0 - exp(-uFogDensity * uFogDensity * distCam * distCam);
      waterCol = mix(waterCol, uFogColor, clamp(fogFactor, 0.0, 1.0));

      gl_FragColor = vec4(waterCol, 1.0);
    }
  `;

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader
  });

  return { material, uniforms };
}
