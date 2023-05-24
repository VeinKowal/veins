import type {
  Color,
  Texture,
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Raycaster,
} from 'three';
import type App from '../App';
import type { GlobalView, Extent } from 'itowns';
import type { Interaction } from 'three.interaction';
import type { OrbitControls } from '../../lib/controls/OrbitControls';
import type { CSS3DRenderer } from '../../lib/renderers/CSS3DRenderer';
import type { EffectComposer } from '../../lib/postprocessing/EffectComposer.js';
import type { OutlinePass } from '../../lib/postprocessing/OutlinePass.js';
import type { ShaderPass } from '../../lib/postprocessing/ShaderPass.js';

export type ThreeInitializerType = {
  renderDom: HTMLDivElement;
  antialias?: boolean;
  alpha?: boolean;
  logarithmicDepthBuffer?: boolean;
  background?: Color | string | number | Texture;
  skyBox?: string;
};

export type ThreeInitializerReturn = {
  scene: Scene;
  camera: PerspectiveCamera;
  renderer: WebGLRenderer;
  cssRenderer: CSS3DRenderer;
  composer: EffectComposer;
  outlinePass: OutlinePass;
  orbitControl: OrbitControls;
  cssOrbitControl: OrbitControls;
  interaction: Interaction;
  raycaster: Raycaster;
  effectFXAA: ShaderPass;
};

export type ITownsInitializerType = {
  app,
  renderDom: HTMLDivElement;
  scene: Scene;
  camera: PerspectiveCamera;
  renderer: WebGLRenderer;
  placement?: Extent;
  options?: Record<string, any>;
  url?: string;
  zoom?: [number, number];
};

export type ITownsInitializerReturn = {
  view: GlobalView;
};
