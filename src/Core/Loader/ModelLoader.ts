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
      child.on('pointermove', () => {
        this.outlinePass.selectedObjects = [child];
        // child.add(line);
        // line.visible = true;
      });
      child.on('pointerout', () => {
        this.outlinePass.selectedObjects = [];
        // child.remove(line);
        // line.visible = false;
      });
    });
  };

  abstract load(config: ModelLoaderType): void;
}
