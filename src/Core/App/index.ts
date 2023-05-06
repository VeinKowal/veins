/**
 *@description App类 程序集对象.
 *@author guoweiyu.
 *@date 2021-08-18 09:28:42.
 */
import type { AppConfig, CreateConfig, FlyToTargetConfig } from './type';
import * as THREE from 'three';
import * as itowns from '../../lib/basic/itowns';
import * as TWEEN from '@tweenjs/tween.js';
// import 'default-passive-events';
import type { OrbitControls } from '../../lib/controls/OrbitControls';
import type { EffectComposer } from '../../lib/postprocessing/EffectComposer.js';
import type { RenderPass } from '../../lib/postprocessing/RenderPass.js';
import type { OutlinePass } from '../../lib/postprocessing/OutlinePass.js';
import type { ShaderPass } from '../../lib/postprocessing/ShaderPass.js';
import ThreeInitializer from '../Initializer/ThreeInitializer';
import ITownsInitializer from '../Initializer/ITownsInitializer';
import type { CSS3DRenderer } from '../../lib/renderers/CSS3DRenderer';
import type { Interaction } from '../../extras/Interaction';
import { MouseEvents } from '../../extras/Interaction';
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
  composer: EffectComposer;
  renderPass: RenderPass;
  outlinePass: OutlinePass;
  interaction: Interaction;
  controls: OrbitControls[] = [];
  animate?: number;
  view?: itowns.GlobeView;
  effectFXAA?: ShaderPass;
  isPostprocessing?: boolean;

  constructor(config: AppConfig) {
    const {
      camera,
      scene,
      renderer,
      cssRenderer,
      composer,
      renderPass,
      outlinePass,
      effectFXAA,
      orbitControl,
      cssOrbitControl,
      interaction,
    } = ThreeInitializer.init(config);
    this.camera = camera;
    this.scene = scene;
    this.renderer = renderer;
    this.cssRenderer = cssRenderer;
    this.composer = composer;
    this.renderPass = renderPass;
    this.outlinePass = outlinePass;
    this.controls = [orbitControl, cssOrbitControl];
    this.interaction = interaction;
    this.renderDom = config.renderDom;
    this.effectFXAA = effectFXAA;
    this.isPostprocessing = false;
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

    // 运行已注册的更新方法
    ParticleSystem.updateFunctions.forEach((e) => {
      e(this.scene, this.camera);
    });

    // 后处理未开启时
    // cssrenderer应放置于renderer上方，control下方
    if (!this.isPostprocessing) {
      if (!this.view) {
        this.controls.forEach((control) => control.update());
      }
      this.cssRenderer.render(this.scene, this.camera);
      if (!this.view) {
        this.renderer.render(this.scene, this.camera);
      }
    }

    // 当后处理开始后
    if (this.isPostprocessing) {
      if (!this.view) {
        this.controls.forEach((control) => control.update());
        this.renderer.render(this.scene, this.camera);
      }
      // 这两句置于下方
      // 防止css3object抖动
      this.cssRenderer.render(this.scene, this.camera);
      // 抗锯齿生效
      this.composer.render();
    }
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
      domElement
        .getContext('webgl')
        ?.getExtension('WEBGL_lose_context')
        ?.loseContext();
      this.renderer.dispose();
    }
  }

  // 本组件大小发生改变时改变各分辨率
  onResize = () => {
    ThreeInitializer.updateRender({
      renderDom: this.renderDom,
      renderer: this.renderer,
      composer: this.composer,
      effectFXAA: this.effectFXAA,
    });
    ThreeInitializer.updateRender({
      renderDom: this.renderDom,
      renderer: this.cssRenderer,
      composer: this.composer,
      effectFXAA: this.effectFXAA,
    });
    ThreeInitializer.updateCamera({
      renderDom: this.renderDom,
      camera: this.camera,
    });
  };

  create = (config: CreateConfig) => {
    const {
      type,
      isOutlinePass,
    } = config;

    // 一旦开启outline后处理 性能会下降
    if (isOutlinePass) {
      this.isPostprocessing = true;
      const { passes } = this.composer;
      if (!passes.includes(this.renderPass)) {
        this.composer.addPass(this.renderPass);
      }
      if (!passes.includes(this.outlinePass)) {
        this.composer.addPass(this.outlinePass);
      }
      if (!passes.includes(this.effectFXAA)) {
        this.composer.addPass(this.effectFXAA);
      }
    }

    if (type === 'OBJ') {
      const obj = new OBJModelLoader(this.outlinePass);
      obj.load(config);
      return obj;
    }
    if (type === 'GLTF') {
      const gltf = new GLTFModelLoader(this.outlinePass);
      gltf.load(config);
      return gltf;
    }
    if (type === 'MAP') {
      if (!this.view) {
        const { renderDom, camera, scene, renderer } = this;
        this.controls.length &&
          ThreeInitializer.removeOribitControl(this.controls);
        this.view = new ITownsInitializer({
          app: this,
          renderDom,
          camera,
          scene,
          renderer,
          ...config,
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
    const {
      target,
      isEarth,
      up,
      angle = [0, 0, 0],
      radius = 20,
      time = 2000,
      complete,
    } = config;
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
        distance =
          distance || (halfSizeToFitOnScreen * 0.6) / Math.tan(halfFovY);
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
      if (Array.isArray(target)) {
        boxCenter.fromArray(target);
        // direction.add(boxCenter).normalize();
      } else if (target instanceof THREE.Object3D) {
        const box = new THREE.Box3().setFromObject(target);
        boxCenter = box.getCenter(new THREE.Vector3());
      } else {
        return false;
      }
      const wrapTo180 = (a: number) => {
        return a - Math.floor((a + 180.0) / 360) * 360;
      }
      direction = new THREE.Vector3(0, 1, 0)
        .applyEuler(
          new THREE.Euler()
            .fromArray([THREE.MathUtils.degToRad(angle[0]), 0, THREE.MathUtils.degToRad(-wrapTo180(angle[2] + 180))])
        );
      const targetPos = new THREE.Vector3().copy(boxCenter);
      // const cameraPos = new THREE.Vector3().copy(targetPos).add(new THREE.Vector3().subVectors(this.camera.position, targetPos).setLength(20));
      // const directPos = new THREE.Vector3().copy(targetPos).add(direction.setLength(0.001));

      if (!this.view) return;
      const { view } = this.view;
      view.controls.lookAtCoordinate({
        coord: new itowns.Coordinates(
          'EPSG:4978',
          targetPos.x,
          targetPos.y,
          targetPos.z,
        ),
        time,
        range: radius,
        tilt: angle[0],
        heading: angle[2],
      }).then(() => {
        view.controls.updateTarget();
        view.controls.update();
        complete && complete();
      });
    }
    return true;
  }
}

export default App;
