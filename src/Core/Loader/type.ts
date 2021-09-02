import { CreateConfig } from '../App/type';

export type ObjModelLoaderType = CreateConfig & {
  url?: string;
  position?: number[];
  isOutline?: boolean;
};
