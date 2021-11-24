/**
 *@description 创建Marker的基本类.
 *@description 分配创建方法.
 *@author guoweiyu.
 *@date 2021-08-24 16:42:10.
 */
import { MarkerConfigType } from './type';
import { Object3D } from 'three';
import ImgMarker from './ImgMarker';
import DomMarker from './DomMarker';
import { Sprite, Scene, Renderer } from 'three';

export default class Marker extends Object3D {
  static create(config: MarkerConfigType): Object3D | undefined {
    const { dom, url } = config;
    if (!dom && !url) {
      console.error('请设置节点或图片');
    }

    if (dom && url) {
      console.error('请勿同时设置节点与图片（默认返回节点标识）');
    }

    if (dom) {
      return new DomMarker(config);
    }

    if (url) {
      return new ImgMarker(config);
    }
  }

  /**
   * @description 根据相机与节点位置控制显隐 如果消失在场景外 则div也消失.
   * @param {paramType} paramName - paramDescription.
   * @return {void}.
   */
  static setVisible = (obj: Sprite, keepSize: boolean) => {
    obj.onAfterRender = (renderer: Renderer, scene: Scene, camera: any) => {
      const ps = obj.position;
      const pc = camera.position;
      const distance = ((ps.x - pc.x) ** 2 + (ps.y - pc.y) ** 2 + (ps.z - pc.z) ** 2) ** 0.5;
      const scale = distance / 100;
      // 根据相机与节点位置更改marker大小 以此保证大小尽量不因为距离改变.
      keepSize && obj.scale.set(scale, scale, scale);
      distance > camera.far ? (obj.visible = false) : (obj.visible = true);
    };
    return obj;
  };
}
