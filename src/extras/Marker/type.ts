import { CreateConfig } from '../../Core/App/type';
import { Object3D } from 'three';

export type MarkerConfigType = CreateConfig & {
  id?: string | number;
  url?: string;
  parent?: Object3D;
  dom?: HTMLElement;
  localPosition?: [number, number, number];
  size?: number;
  keepSize?: boolean;
  isSprite?: boolean;
};
