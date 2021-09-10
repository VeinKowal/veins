/**
 *@description App类 程序集对象.
 *@author guoweiyu.
 *@date 2021-08-18 09:28:42.
 */
import { AppConfig, CreateConfig } from './type';
import * as THREE from 'three';
import * as itowns from 'itowns';
import { OrbitControls } from '../../lib/controls/OrbitControls';
import ThreeInitializer from '../Initializer/ThreeInitializer';
import ITownsInitializer from '../Initializer/ITownsInitializer';
import { CSS3DRenderer } from '../../lib/renderers/CSS3DRenderer';
import { Interaction, MouseEvents } from '../../extras/Interaction';
import ObjModelLoader from '../Loader/ObjModelLoader';
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
    const {
      camera,
      scene,
      renderer,
      cssRenderer,
      orbitControl,
      cssOrbitControl,
      interaction,
    } = ThreeInitializer.init(config);
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
    this.animate = requestAnimationFrame(this.run);
    !this.view && this.renderer.render(this.scene, this.camera);
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
    this.renderer.dispose();
    this.renderer.domElement
      .getContext('webgl')!
      .getExtension('WEBGL_lose_context')!
      .loseContext();
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
      const obj = new ObjModelLoader(config);
      this.scene.add(obj);
      return obj;
    }
    if (type === 'MAP') {
      if (!this.view) {
        const { renderDom, camera, scene, renderer } = this;
        this.controls.length &&
          ThreeInitializer.removeOribitControl(this.controls);
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
}

export default App;
