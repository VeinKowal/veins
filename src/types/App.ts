import { Extent } from 'itowns';

export type AppConfig = {
  renderDom?: HTMLDivElement;
  // 初始看向的中心点
  lookAt?: Extent;
  url?: string;
};
