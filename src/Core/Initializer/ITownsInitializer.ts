/**
 *@description itowns 初始化基础配置.
 *@author guoweiyu.
 *@date 2021-08-23 18:57:10.
 */
import type { ITownsInitializerType, ITownsInitializerReturn } from './type';
import type App from '../App';
import BaseInitializer from './BaseInitializer';
import ThreeInitializer from './ThreeInitializer';
import * as itowns from '../../lib/basic/itowns';
import * as THREE from 'three';

class ITownsInitializer extends BaseInitializer {
  view: itowns.GlobeView;
  app: App;

  constructor(config: ITownsInitializerType) {
    super();
    const { app, ...initConfig } = config;
    const view = this.initView(initConfig);
    this.view = view;
    this.app = app;

    Object.getOwnPropertyNames(itowns.ShaderChunk).forEach((key) => {
      if (key !== 'path' || key !== 'target') {
        const path = itowns.ShaderChunk.path + key;
        if (!THREE.ShaderChunk[path]) {
          THREE.ShaderChunk[path] = itowns.ShaderChunk[key];
        }
      }
    });
  }

  private initView(config: ITownsInitializerType): itowns.GlobeView {
    const { placement, renderer, scene, camera, url, zoom = [0, 17] } = config;
    camera.position.set(0, 0, 0);
    const initPlacement = {
      coord: new itowns.Coordinates('EPSG:4326', 116.403694, 39.915378),
      range: 250000,
    };

    const view = new itowns.GlobeView(config.renderDom, placement || initPlacement, {
      renderer: renderer,
      scene3D: scene,
      camera: camera,
    });

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

  public convertLonlatToWorld(lonlat: [number, number], altitude: number) {
    const coord = new itowns.Coordinates('EPSG:4326', lonlat[0], lonlat[1], altitude);
    const pos = coord.as(this.view.referenceCrs);
    const { x, y, z } = pos;
    return [x, y, z];
  }

  public getAnglesFromLonlat(lonlat: [number, number], altitude: number) {
    const coord = new itowns.Coordinates('EPSG:4326', lonlat[0], lonlat[1], altitude);
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

  public dispose() {
    try {
      const app = this.app;
      app.view = undefined;
      this.view.controls.dispose();
      this.view.dispose();
      app.camera.up = new THREE.Vector3(0, 1, 0);
      app.camera.near = 0.1;
      app.controls.length &&
        ThreeInitializer.removeOribitControl(app.controls);
      const cssOrbitControl = ThreeInitializer.initOrbitControl(
        app.camera,
        app.cssRenderer,
      );
      const orbitControl = ThreeInitializer.initOrbitControl(app.camera, app.renderer);
      app.controls = [orbitControl, cssOrbitControl];
    } catch (e) {
      console.error('earth fail dispose');
    }
  }

  public convertToEarthDomMarker() {
    const { view } = this;
    const createFeatureAt = (coordinate) => {
      // create new featureCollection
      const collection = new itowns.FeatureCollection({
        crs: view.tileLayer.extent.crs,
        buildExtent: true,
        structure: '2d',
      });

      // create new feature
      const feature = collection.requestFeatureByType(itowns.FEATURE_TYPES.POINT);

      // add geometries to feature
      const geometry = feature.bindNewGeometry();
      geometry.startSubGeometry(1, feature);
      geometry.pushCoordinates(coordinate, feature);
      geometry.properties.position = coordinate;

      geometry.updateExtent();
      feature.updateExtent(geometry);
      collection.updateExtent(feature.extent);

      return collection;
    }

    this.app.scene.traverse(e => {
      if (e.isDomMarker) {
        const box = new THREE.Box3().setFromObject(e);
        const center = box.getCenter(new THREE.Vector3());
        const featureCoord = new itowns.Coordinates(view.referenceCrs);
        featureCoord.setFromVector3(center);
        const features = createFeatureAt(featureCoord);
        const source = new itowns.FileSource({ features });
        const customDiv = document.createElement('div');
        const contentDiv = e.domElement.firstElementChild.cloneNode(true);
        contentDiv.style.display = 'block';
        customDiv.appendChild(contentDiv);
        const layer = new itowns.LabelLayer(`uuid-${e.uuid}`, {
          source: source,
          domElement: customDiv,
        });
        view.addLayer(layer);
      }
    })
  }
}

export default ITownsInitializer;
