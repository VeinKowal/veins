/**
 *@description App类 程序集对象.
 *@author guoweiyu.
 *@date 2021-08-18 09:28:42.
 */
import { AppConfig, CreateConfig, FlyToTargetConfig } from './type';
import * as THREE from 'three';
import * as itowns from 'itowns';
import * as TWEEN from '@tweenjs/tween.js';
// import 'default-passive-events';
import { OrbitControls } from '../../lib/controls/OrbitControls';
import ThreeInitializer from '../Initializer/ThreeInitializer';
import ITownsInitializer from '../Initializer/ITownsInitializer';
import { CSS3DRenderer } from '../../lib/renderers/CSS3DRenderer';
import { Interaction, MouseEvents } from '../../extras/Interaction';
import OBJModelLoader from '../Loader/OBJModelLoader';
import GLTFModelLoader from '../Loader/GLTFModelLoader';
import Marker from '../../extras/Marker';
import ParticleSystem from '../../extras/ParticleSystem';
import '../Patch/Object3D';

class App {
  renderDom: HTMLDivElement;
  camera: THREE.PerspectiveCamera;
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  cssRenderer: CSS3DRenderer;
  interaction: Interaction;
  controls: OrbitControls[] = [];
  animate?: number;
  view?: itowns.GlobeView;

  constructor(config: AppConfig) {
    const { camera, scene, renderer, cssRenderer, orbitControl, cssOrbitControl, interaction } =
      ThreeInitializer.init(config);
    this.camera = camera;
    this.scene = scene;
    this.renderer = renderer;
    this.cssRenderer = cssRenderer;
    this.controls = [orbitControl, cssOrbitControl];
    this.interaction = interaction;
    this.renderDom = config.renderDom;
    this.init(config);
  }

  /**
   * @description 初始化操作.
   * @param {AppConfig} config - 配置项.
   * @return {void} .
   */
  init = (config: AppConfig) => {
    const { url, skyBox, complete } = config;
    this.run();
    window.addEventListener('resize', this.onResize);
  };

  /**
   * @description 渲染方法.
   * @param {paramType} paramName - paramDescription.
   * @return {void} .
   */
  run = () => {
    TWEEN.update();
    this.animate = requestAnimationFrame(this.run);
    if (!this.view) {
      this.controls.forEach((control) => control.update());
      this.renderer.render(this.scene, this.camera);
    }
    this.cssRenderer.render(this.scene, this.camera);

    // 运行已注册的更新方法
    ParticleSystem.updateFunctions.forEach((e) => {
      e(this.scene, this.camera);
    });
  };

  /**
   * @description 销毁方法.
   * @param {paramType} paramName - paramDescription.
   * @return {void} .
   */
  destroy() {
    MouseEvents.removeAllEvents();
    this.interaction.removeEvents();
    this.animate && cancelAnimationFrame(this.animate);
    window.removeEventListener('resize', this.onResize);
    this.scene.traverse((child: any) => {
      const { geometry, material } = child;
      geometry && geometry.dispose();
      material && material.dispose();
    });
    if (this.renderer && this.renderer.domElement) {
      const { domElement } = this.renderer;
      domElement.getContext('webgl')?.getExtension('WEBGL_lose_context')?.loseContext();
      this.renderer.dispose();
    }
  }

  // 本组件大小发生改变时改变各分辨率
  onResize = () => {
    ThreeInitializer.updateRender({
      renderDom: this.renderDom,
      renderer: this.renderer,
    });
    ThreeInitializer.updateRender({
      renderDom: this.renderDom,
      renderer: this.cssRenderer,
    });
    ThreeInitializer.updateCamera({
      renderDom: this.renderDom,
      camera: this.camera,
    });
  };

  create = (config: CreateConfig) => {
    const { type } = config;
    if (type === 'OBJ') {
      const obj = new OBJModelLoader();
      obj.load(config);
      return obj;
    }
    if (type === 'GLTF') {
      const gltf = new GLTFModelLoader();
      gltf.load(config);
      return gltf;
    }
    if (type === 'MAP') {
      if (!this.view) {
        const { renderDom, camera, scene, renderer } = this;
        this.controls.length && ThreeInitializer.removeOribitControl(this.controls);
        this.view = ITownsInitializer.init({
          renderDom,
          camera,
          scene,
          renderer,
        });
      }
      return this.view;
    }
    if (type === 'Marker') {
      return Marker.create(config);
    }
    if (type === 'ParticleSystem') {
      return ParticleSystem.create(config, this.scene);
    }
  };

  flyToTarget(config: FlyToTargetConfig) {
    const { target, isEarth, up, angle = [0, 0, 0], radius = 0, time = 2000, complete } = config;
    const { camera, controls } = this;
    let direction = new THREE.Vector3(1, 0, 0);
    let boxCenter = new THREE.Vector3();
    let distance = radius;

    if (!isEarth) {
      if (Array.isArray(target)) {
        boxCenter.fromArray(target);
        // direction.add(boxCenter).normalize();
      } else if (target instanceof THREE.Object3D) {
        const box = new THREE.Box3().setFromObject(target);
        const boxSize = box.getSize(new THREE.Vector3()).length();
        boxCenter = box.getCenter(new THREE.Vector3());

        // set the camera to frame the box
        const sizeToFitOnScreen = boxSize;
        const halfSizeToFitOnScreen = sizeToFitOnScreen * 0.5;
        const halfFovY = THREE.MathUtils.degToRad(camera.fov * 0.5);
        distance = distance || (halfSizeToFitOnScreen * 0.6) / Math.tan(halfFovY);
      } else {
        return false;
      }

      // compute a unit vector that points in the direction the camera is now
      // from the center of the box
      const radians = angle.map((value) => (value * Math.PI) / 180);
      direction = direction.applyEuler(new THREE.Euler().fromArray(radians));

      // move the camera to a position distance units way from the center
      // in whatever direction the camera was from the center already
      let targetPos = new THREE.Vector3().copy(boxCenter);
      targetPos = targetPos.add(direction.multiplyScalar(distance));

      // pick some near and far values for the frustum that
      // will contain the box.
      // camera.near = boxSize / 100;
      // camera.far = boxSize * 100;

      camera.updateProjectionMatrix();

      // fly
      const pos = { ...camera.position };
      const tween = new TWEEN.Tween(pos)
        .to({ ...targetPos }, time)
        .easing(TWEEN.Easing.Linear.None)
        .onStart(() => {
          controls.forEach((control) => {
            control.target.copy(boxCenter);
            control.update();
          });
        })
        .onUpdate(() => {
          // point the camera to look at the center of the box
          Array.isArray(up)
            ? camera.lookAt(...up)
            : camera.lookAt(boxCenter.x, boxCenter.y, boxCenter.z);
          camera.position.set(pos.x, pos.y, pos.z);
        })
        .onComplete(() => {
          controls.forEach((control) => {
            control.target.copy(boxCenter);
            control.update();
          });
          complete && complete();
        });
      tween.start();
    } else {
      // TODO: iTowns相机飞行方法
    }

    return true;
  }
}

export default App;
