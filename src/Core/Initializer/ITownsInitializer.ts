/**
 *@description itowns 初始化基础配置.
 *@author guoweiyu.
 *@date 2021-08-23 18:57:10.
 */
import { ITownsInitializerType, ITownsInitializerReturn } from './type';
import BaseInitializer from './BaseInitializer';
import * as itowns from 'itowns';

class ITownsInitializer extends BaseInitializer {
  static init(config: ITownsInitializerType): ITownsInitializerReturn {
    const view = ITownsInitializer.initView(config);
    return {
      view,
    };
  }

  private static initView(config: ITownsInitializerType): itowns.GlobeView {
    const { placement, renderer, scene, camera } = config;
    camera.position.set(0, 0, 0);
    const initPlacement = {
      coord: new itowns.Coordinates('EPSG:4326', 116.403694, 39.915378),
      range: 25000000,
    };

    const view = new itowns.GlobeView(config.renderDom, placement || initPlacement, {
      renderer: renderer,
      scene3D: scene,
      camera: camera,
    });

    return view;
  }
}

export default ITownsInitializer;
