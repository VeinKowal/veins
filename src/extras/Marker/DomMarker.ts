/**
 *@description 使用dom节点创建Marker.
 *@description 经测试 超过100个性能会收到很大影响 应尽量别用！.
 *@description 不要将鼠标事件注册到complete中返回的Sprite上.
 *@author guoweiyu.
 *@date 2021-08-24 14:51:26.
 */
import { MarkerConfigType } from './type';
import { CSS3DSprite, CSS3DObject } from '../../lib/renderers/CSS3DRenderer';
import { Group, Sprite, SpriteMaterial } from 'three';
import Marker from './index';

class DomMarker extends Group {
  constructor(config: MarkerConfigType) {
    super();
    this.userData.type = 'Marker';
    this.createMarker(config);
  }

  createMarker(config: MarkerConfigType) {
    let object: CSS3DObject;
    let obj: Sprite;

    const { isSprite, dom, localPosition, id, parent, complete, size, keepSize = false } = config;

    if (!dom) return false;

    if (isSprite) {
      obj = new CSS3DSprite(dom);
    } else {
      obj = new CSS3DObject(dom);
    }

    if (obj) {
      const mat = new SpriteMaterial({
        sizeAttenuation: !keepSize,
        opacity: 0,
        depthTest: false,
      });
      object = new Sprite(mat);
      Marker.setVisible(obj, !!keepSize);
      object.add(obj);
    }

    if (object) {
      this.add(object);
      id && +id && (this.id = +id);
      size && object.scale.set(size, size, size);
      parent && parent.add(this);

      if (localPosition) {
        const [x, y, z] = localPosition;
        object.position.set(x, y, z);
      }
    } else {
      return false;
    }

    complete && complete(this, dom);
  }
}

export default DomMarker;
