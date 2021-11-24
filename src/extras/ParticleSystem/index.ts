/**
 *@description 粒子系统类 用于分配创建各种粒子效果.
 *@author guoweiyu.
 *@date 2021-08-24 18:47:02.
 */
import { updateFunction, ParticleSystemConfigType } from './type';
import { Scene, Color, FogExp2, PerspectiveCamera } from 'three';
import { particleConfig } from './config';

class ParticleSystem {
  static updateFunctions = new Map<string, updateFunction>();

  static clearFog(scene: Scene): void {
    // 设置前先清空当前天气特效
    // 如果切换成除雾天其他天气 先将fog去除
    if (scene.fog) {
      scene.fog = null;
      scene.background = new Color('rgba(0, 0, 0, 0)');
      scene.background = null;
    }
  }

  // 清除当前所有的粒子效果(除fog外)
  static clearAllParticleEffect(scene: Scene): void {
    // 清空天气效果
    const sceneChildren: any[] = [];
    scene.children.forEach((child) => {
      sceneChildren.push(child);
    });
    sceneChildren.forEach((child) => {
      if (child.userData && child.userData.type === 'weather') {
        scene.remove(child);
      }
    });
  }

  // 清除指定粒子效果(除fog外)
  static clearParticleEffect(scene: Scene, effect: any): void {
    if (effect.userData && effect.userData.type === 'weather') {
      scene.remove(effect);
    }
  }

  // 添加指定天气效果
  static setparticleEffect = (effect: any[], scene: Scene) => {
    effect.forEach((e) => {
      // 如果是雾天
      if (e instanceof FogExp2) {
        ParticleSystem.clearFog(scene);
        if (scene.fog) {
          scene.fog.color = e.color;
        } else {
          scene.fog = e;
        }
        scene.background = e.color;
      } else scene.add(e);
    });
  };

  // 定义注册方法
  private static loginUpdateFunction = (f: updateFunction, name: string) => {
    // 注册
    ParticleSystem.updateFunctions && ParticleSystem.updateFunctions.set(name, f);
  };

  // 创建粒子效果
  static create(config: ParticleSystemConfigType, scene: Scene): any[] {
    const { name } = config;

    // 获取所要展示的粒子特效
    const effect = name ? particleConfig[name] : [];

    // 保存生成的粒子特效
    const particles: any[] = [];

    // 添加更新方法
    effect.forEach((el) => {
      const particle = el();
      // 保存
      particles.push(particle);

      ParticleSystem.loginUpdateFunction((sce: Scene, cam: PerspectiveCamera) => {
        !(particle instanceof FogExp2) && particle.update(cam.position);
      }, particle.constructor.name);
    });

    ParticleSystem.setparticleEffect(particles, scene);

    return particles;
  }
}

export default ParticleSystem;
