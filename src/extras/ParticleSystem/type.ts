import { Scene, Object3D } from 'three';
import { CreateConfig } from '../../Core/App/type';

export type updateFunction = (
  scene: Scene,
  camera: THREE.PerspectiveCamera,
) => void;

export type ParticleSystemConfigType = CreateConfig & {
  parent?: Object3D;
  url?: string;
  localPosition?: [number, number, number];
};
