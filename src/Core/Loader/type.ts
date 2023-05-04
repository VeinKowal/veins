import type { CreateConfig } from '../App/type';

export type ModelLoaderType = CreateConfig & {
  url?: string;
  position?: number[];
  isOutline?: boolean;
  isOutlinePass?: boolean;
  process?: Function;
};

export type OBJModelLoaderType = ModelLoaderType;

export type GLTFModelLoaderType = ModelLoaderType;
