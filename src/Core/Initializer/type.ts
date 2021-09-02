import { Color, Texture, Scene, PerspectiveCamera, WebGLRenderer } from 'three';
import { GlobalView, Extent } from 'itowns';
import { Interaction } from 'three.interaction';
import { OrbitControls } from '../../lib/controls/OrbitControls';
import { CSS3DRenderer } from '../../lib/renderers/CSS3DRenderer';

export type ThreeInitializerType = {
  renderDom: HTMLDivElement;
  antialias?: boolean;
  alpha?: boolean;
  logarithmicDepthBuffer?: boolean;
  background?: Color | string | number | Texture;
};

export type ThreeInitializerReturn = {
  scene: Scene;
  camera: PerspectiveCamera;
  renderer: WebGLRenderer;
  cssRenderer: CSS3DRenderer;
  orbitControl: OrbitControls;
  cssOrbitControl: OrbitControls;
  interaction: Interaction;
};

export type ITownsInitializerType = {
  renderDom: HTMLDivElement;
  scene: Scene;
  camera: PerspectiveCamera;
  renderer: WebGLRenderer;
  placement?: Extent;
};

export type ITownsInitializerReturn = {
  view: GlobalView;
};
