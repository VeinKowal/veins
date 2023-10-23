/**
 *@description three 初始化基础配置.
 *@author guoweiyu.
 *@date 2021-08-23 19:23:13.
 */
import type { ThreeInitializerType, ThreeInitializerReturn } from './type';
import BaseInitializer from './BaseInitializer';
import * as THREE from 'three';
import { CSS3DRenderer } from '../../lib/renderers/CSS3DRenderer';
import { EffectComposer } from '../../lib/postprocessing/EffectComposer.js';
import { RenderPass } from '../../lib/postprocessing/RenderPass.js';
import { ShaderPass } from '../../lib/postprocessing/ShaderPass.js';
import { FXAAShader } from '../../lib/shaders/FXAAShader.js';
import { OutlinePass } from '../../lib/postprocessing/OutlinePass.js';
import { OrbitControls } from '../../lib/controls/OrbitControls';
// import { OrbitControls } from '../../lib/controls/OrbitControl';
import skyBoxConfig from '../../lib/skyBox/config';
import { Interaction, MouseEvents } from '../../extras/Interaction';
import type { PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { Raycaster } from 'three';

class ThreeInitializer extends BaseInitializer {
  static init(config: ThreeInitializerType): ThreeInitializerReturn {
    const { renderDom } = config;
    const { clientWidth: width, clientHeight: height } = renderDom;
    const camera = ThreeInitializer.initCamera(config);
    const scene = ThreeInitializer.initScene(config);
    const cssRenderer = ThreeInitializer.initCSSRender(config);
    const renderer = ThreeInitializer.initRenderer(config);
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    // composer.addPass(renderPass);
    const outlinePass = new OutlinePass(new THREE.Vector2(width, height), scene, camera);
    // composer.addPass(outlinePass);
    const effectFXAA = new ShaderPass(FXAAShader);
    effectFXAA.uniforms.resolution.value.set(1 / width, 1 / height);
    // composer.addPass(effectFXAA);
    ThreeInitializer.initSkyBox(config.skyBox, scene);
    const cssOrbitControl = ThreeInitializer.initOrbitControl(
      camera,
      cssRenderer,
    );
    const orbitControl = ThreeInitializer.initOrbitControl(camera, renderer);
    const interaction = new Interaction(cssRenderer, scene, camera);
    const raycaster = MouseEvents.initMouseEvents(
      camera,
      cssRenderer,
      scene,
      new Raycaster(),
      interaction,
    );

    const initRes = {
      camera,
      scene,
      renderer,
      composer,
      renderPass,
      outlinePass,
      effectFXAA,
      orbitControl,
      cssRenderer,
      cssOrbitControl,
      interaction,
      raycaster,
    };

    ThreeInitializer.initLights(scene);
    return initRes;
  }

  private static initCamera(config: ThreeInitializerType): PerspectiveCamera {
    const { renderDom } = config;
    const { clientWidth: width, clientHeight: height } = renderDom;
    const camera = new THREE.PerspectiveCamera(
      30,
      width / height,
      0.1,
      1000000,
    );
    camera.up = new THREE.Vector3(0, 1, 0);
    return camera;
  }

  private static initScene(config: ThreeInitializerType): Scene {
    const { background } = config;
    const scene = new THREE.Scene();
    if (background instanceof THREE.Texture) {
      scene.background = background;
    } else if (background) {
      const backgroundColor = new THREE.Color(background);
      scene.background = backgroundColor;
    }
    return scene;
  }

  private static initCSSRender(config: ThreeInitializerType): CSS3DRenderer {
    const { renderDom } = config;
    const { clientWidth: width, clientHeight: height } = renderDom;
    const cssRenderer = new CSS3DRenderer();
    cssRenderer.setSize(width, height);
    renderDom.appendChild(cssRenderer.domElement);
    cssRenderer.domElement.style.position = 'absolute';
    cssRenderer.domElement.style.top = '0';
    cssRenderer.domElement.style.zIndex = '1';
    return cssRenderer;
  }

  private static initRenderer(config: ThreeInitializerType): WebGLRenderer {
    const {
      antialias = true,
      alpha = true,
      logarithmicDepthBuffer = true,
      renderDom,
    } = config;
    const { clientWidth: width, clientHeight: height } = renderDom;
    const renderer = new THREE.WebGLRenderer({
      antialias,
      alpha,
      logarithmicDepthBuffer,
    });
    renderer.setSize(width, height);
    renderDom.appendChild(renderer.domElement);
    return renderer;
  }

  static initOrbitControl(camera: THREE.Camera, renderer: THREE.Renderer) {
    const orbitControl = new OrbitControls(camera, renderer.domElement);
    orbitControl.enableZoom = true;
    orbitControl.enableDamping = true;
    orbitControl.enablePan = true;
    orbitControl.rotateSpeed = 0.5;
    orbitControl.dampingFactor = 0.1;
    orbitControl.maxDistance = Infinity;
    orbitControl.minDistance = 10;
    return orbitControl;
  }

  static removeOribitControl(controls: OrbitControls | OrbitControls[]) {
    if (Array.isArray(controls)) {
      controls.forEach((control) => {
        control.dispose();
      });
    } else controls.dispose();
    return controls;
  }

  // 处理窗口大小变化事件
  static updateRender(config: {
    renderDom: HTMLElement;
    renderer: WebGLRenderer;
    composer: EffectComposer;
    effectFXAA: ShaderPass;
  }) {
    const { renderDom, renderer, composer, effectFXAA } = config;
    const { clientWidth: width, clientHeight: height } = renderDom;
    renderer.setSize(width, height);
    composer.setSize(width, height);
    effectFXAA.uniforms.resolution.value.set(1 / width, 1 / height);
  }

  static updateCamera(config: {
    renderDom: HTMLElement;
    camera: PerspectiveCamera;
  }) {
    const { renderDom, camera } = config;
    const { clientWidth: width, clientHeight: height } = renderDom;
    camera.aspect = height === 0 ? 1 : width / height;
    camera.updateProjectionMatrix();
  }

  private static initLights(scene: THREE.Scene) {
    const ambientLight = new THREE.AmbientLight(0x404040, 1);
    const directionalLight1 = new THREE.DirectionalLight(0xc0c0c0, 0.2);
    const directionalLight2 = new THREE.DirectionalLight(0xc0c0c0, 0.2);
    directionalLight1.position.set(1000, 1000, 1000);
    directionalLight2.position.set(-1000, -1000, -1000);
    directionalLight1.castShadow = true;
    directionalLight2.castShadow = true;
    const topLight = new THREE.DirectionalLight(0xffffff, 0.3);
    topLight.position.set(0, 5000000, 0);
    topLight.castShadow = true;
    const bottomLight = new THREE.DirectionalLight(0xffffff, 0.2);
    bottomLight.position.set(0, -5000000, 0);
    bottomLight.castShadow = true;

    scene.add(topLight);
    scene.add(bottomLight);
    scene.add(directionalLight1);
    scene.add(directionalLight2);
    scene.add(ambientLight);

    return {
      ambientLight,
      directionalLight1,
      directionalLight2,
      topLight,
      bottomLight,
    };
  }

  private static initSkyBox(name: string | undefined, scene: THREE.Scene) {
    if (!name) return;
    const boxList = Object.keys(skyBoxConfig);
    const boxIndex = boxList.indexOf(name);
    if (boxIndex !== -1) {
      const urls = skyBoxConfig[name];
      new THREE.CubeTextureLoader().load(urls, (texture) => {
        // texture.encoding = THREE.sRGBEncoding;
        scene.background = texture;
      });
    }
  }
}

export default ThreeInitializer;
