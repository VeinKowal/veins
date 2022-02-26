import { Color, Texture, Object3D, Vector3 } from 'three';

export type AppConfig = {
  renderDom: HTMLDivElement;
  url?: String;
  background?: Color | string | number | Texture;
  skyBox?: string;
  complete?: Function;
};

export type CreateConfig = {
  type: string;
  id?: number | string;
  name?: string;
  complete?: Function;
  [key: string]: any;
};

export type FlyToTargetConfig = {
  target: Object3D | [number, number, number];
  isEarth: boolean;
  // 摄像机朝向
  up?: [number, number, number];
  // 绕target的欧拉角
  angle?: [number, number, number];
  // 距离target的半径距离
  radius?: number;
  // 飞行时间
  time?: number;
  complete?: Function;
};
