import {
  Color,
  Texture,
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Raycaster,
} from 'three';
import { GlobalView, Extent } from 'itowns';
import { Interaction } from 'three.interaction';
import { OrbitControls } from '../../lib/controls/OrbitControls';
import { CSS3DRenderer } from '../../lib/renderers/CSS3DRenderer';
import { EffectComposer } from '../../lib/postprocessing/EffectComposer.js';
import { OutlinePass } from '../../lib/postprocessing/OutlinePass.js';

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
};

export type ITownsInitializerType = {
  renderDom: HTMLDivElement;
  scene: Scene;
  camera: PerspectiveCamera;
  renderer: WebGLRenderer;
  placement?: Extent;
  url?: string;
  zoom?: [number, number];
};

export type ITownsInitializerReturn = {
  view: GlobalView;
};
