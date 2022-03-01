/**
 *@description itowns 初始化基础配置.
 *@author guoweiyu.
 *@date 2021-08-23 18:57:10.
 */
import { ITownsInitializerType, ITownsInitializerReturn } from './type';
import BaseInitializer from './BaseInitializer';
import * as itowns from '../../lib/basic/itowns';
import * as THREE from '../../lib/basic/three';

class ITownsInitializer extends BaseInitializer {
  static view: itowns.GlobeView;

  static init(config: ITownsInitializerType): ITownsInitializerReturn {
    const view = ITownsInitializer.initView(config);
    this.view = view;

    return this;
  }

  private static initView(config: ITownsInitializerType): itowns.GlobeView {
    const { placement, renderer, scene, camera, url, zoom = [0, 17] } = config;
    camera.position.set(0, 0, 0);
    const initPlacement = {
      coord: new itowns.Coordinates('EPSG:4326', 116.403694, 39.915378),
      range: 250000,
    };

    const view = new itowns.GlobeView(
      config.renderDom,
      placement || initPlacement,
      {
        renderer: renderer,
        scene3D: scene,
        camera: camera,
      },
    );

    if (url) {
      const tmsSource = new itowns.TMSSource({
        isInverted: true,
        // eslint-disable-next-line no-template-curly-in-string
        url,
        projection: 'EPSG:3857',
        zoom: {
          min: zoom[0],
          max: zoom[1],
        },
      });

      // Create the layer
      const colorLayer = new itowns.ColorLayer('OPENSM', {
        source: tmsSource,
      });

      // Add the layer
      view.addLayer(colorLayer);
    }

    return view;
  }

  public static convertLonlatToWorld(
    lonlat: [number, number],
    altitude: number,
  ) {
    const coord = new itowns.Coordinates(
      'EPSG:4326',
      lonlat[0],
      lonlat[1],
      altitude,
    );
    const pos = coord.as(this.view.referenceCrs);
    const { x, y, z } = pos;
    return [x, y, z];
  }

  public static getAnglesFromLonlat(
    lonlat: [number, number],
    altitude: number,
  ) {
    const coord = new itowns.Coordinates(
      'EPSG:4326',
      lonlat[0],
      lonlat[1],
      altitude,
    );
    const pos = coord.as(this.view.referenceCrs);
    const position = new THREE.Vector3().copy(pos);
    const target = position.clone().add(coord.geodesicNormal);
    const up = new THREE.Vector3(0, 1, 0);
    const m = new THREE.Matrix4();
    m.lookAt(position, target, up);

    const o = new THREE.Object3D();
    const quaternion = new THREE.Quaternion();
    quaternion.setFromRotationMatrix(m);
    const r = new THREE.Euler();
    r.setFromQuaternion(quaternion);

    o.rotation.copy(r);
    o.rotateX(-Math.PI * 0.5);
    const { x, y, z } = o.rotation;

    return [x, y, z];
  }
}

export default ITownsInitializer;
