/**
 *@description 模型加载器.
 *@author guoweiyu.
 *@date 2021-09-13 13:42:23.
 */
import type { ModelLoaderType } from './type';
import { LineMaterial } from '../../lib/lines/LineMaterial';
import { LineSegments2 } from '../../lib/lines/LineSegments2';
import { LineSegmentsGeometry } from '../../lib/lines/LineSegmentsGeometry';
import type { OutlinePass } from '../../lib/postprocessing/OutlinePass.js';
import type { Object3D } from 'three';
import { Group, BoxHelper, Mesh, EdgesGeometry } from 'three';

export default abstract class ModelLoader extends Group {
  outlinePass: OutlinePass;

  constructor(outlinePass?: OutlinePass) {
    super();
    this.outlinePass = outlinePass;
    outlinePass.visibleEdgeColor.set('#ff5e00');
    outlinePass.hiddenEdgeColor.set('#ff5e00');
  }

  // 将模型放在【0，0，0】点
  moveToCenter = (model: Object3D) => {
    const box = new BoxHelper(model);
    const boundSphere = box.geometry.boundingSphere;
    if (!boundSphere) return;
    const { x, y, z } = boundSphere.center;
    model.position.x -= x;
    model.position.y -= y;
    model.position.z -= z;
  };

  // 添加鼠标悬浮勾边的方法
  addEdgeOutline = (model: Object3D) => {
    let hoverdChild = undefined;
    model.traverse((child: any) => {
      if (!(child instanceof Mesh)) return;
      // const edges = new EdgesGeometry(child.geometry);
      // const lintMat = new LineMaterial({
      //   color: '#f56d00',
      //   linewidth: 0.003,
      // });
      // const lineGeo = new LineSegmentsGeometry().fromEdgesGeometry(edges);
      // const line = new LineSegments2(lineGeo, lintMat);
      // model.add(line);
      // line.visible = false;
      // child.line = line;
      child.cursor = 'pointer';
      child.selected = false;
      const that = this;
      let isSelected = child.selected;
      child.on('pointermove', () => {
        if (child !== hoverdChild) {
          const index = this.outlinePass.selectedObjects.findIndex(o => o === hoverdChild);
          if (index >= 0 && !hoverdChild?.selected) {
            this.outlinePass.selectedObjects.splice(index, 1);
          }
        }
        hoverdChild = child;
        const objIndex = this.outlinePass.selectedObjects.findIndex(o => o === child);

        if (objIndex < 0) {
          this.outlinePass.selectedObjects.push(child);
        }
        // child.add(line);
        // line.visible = true;
      });
      child.on('pointerout', () => {
        const objIndex = this.outlinePass.selectedObjects.findIndex(o => o === child);
        if (objIndex >= 0 && !child.selected) {
          this.outlinePass.selectedObjects.splice(objIndex, 1);
        }
        // child.remove(line);
        // line.visible = false;
      });
      Object.defineProperty(child, 'selected', {
        get() {
          return isSelected;
        },
        set(val) {
          isSelected = val;
          const objIndex = that.outlinePass.selectedObjects.findIndex(o => o === child);
          if (objIndex < 0 && val) {
            that.outlinePass.selectedObjects.push(child);
          }
          if (objIndex >= 0 && !val) {
            that.outlinePass.selectedObjects.splice(objIndex, 1);
          }
        }
      });
    });
  };

  abstract load(config: ModelLoaderType): void;
}
