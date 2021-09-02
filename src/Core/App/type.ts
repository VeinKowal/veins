import { Color, Texture } from 'three';

export type AppConfig = {
  renderDom: HTMLDivElement;
  url?: String;
  background?: Color | string | number | Texture;
  skyBox?: String;
  complete?: Function;
};

export type CreateConfig = {
  type: string;
  id?: number | string;
  name?: string;
  complete?: Function;
  [key: string]: any;
};
