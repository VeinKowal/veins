/*
 *@description: 雪花特效
 *@author: guoweiyu
 *@date: 2021-05-28 15:51:23
 */
import * as THREE from 'three';
import SnowMaterial from './material';

type SnowConfig = {
  // 区域范围的长度 默认4000
  length?: number;
  // 区域范围的高度 默认5000
  height?: number;
  // 雨雪的雪花数量规模 默认值1约1000片雪花 小于0则变为默认值 等于0则不产生雪花
  scale?: number;
  // 雪花大小 默认值1 小于0则变为默认值 等于0则不产生雪花
  size?: number;
  // 雪花下落速率 默认值1 小于等于零则为默认值1
  velocity?: number;
};

export default class Snow extends THREE.Points {
  private time: number = 0;
  private clock: THREE.Clock = new THREE.Clock();
  private box: THREE.Box3 = new THREE.Box3();
  material: SnowMaterial = new SnowMaterial();
  constructor(config: SnowConfig = { length: 4000, height: 5000, scale: 1, size: 1 }) {
    super();
    this.createSnow(config);
    this.userData.type = 'weather';
  }

  public update = (cameraPosition: THREE.Vector3) => {
    // this.time 用于控制雪花下落速度
    this.time = (this.time + this.clock.getDelta() * 0.05) % 1;

    this.material.cameraPosition = cameraPosition;

    if (this.material.uniforms && 'attributes' in this.geometry) {
      for (let i = 0; i < this.geometry.attributes.position.count; i += 1) {
        const { position, velocity } = this.geometry.attributes;

        // 根据velocity各方向的移动距离 修改雪花的x，z坐标 让雪花分散
        position.setX(i, position.getX(i) - velocity.getX(i));
        position.setZ(i, position.getZ(i) - velocity.getZ(i));

        // 如果雪花运动到范围外 修改位置坐标到范围内 修改velocity 修改预定运动轨迹
        if (position.getX(i) < this.box.min.x || position.getX(i) > this.box.max.x) {
          position.setX(i, Math.random() * (this.box.max.x - this.box.min.x) + this.box.min.x);
          velocity.setX(i, (Math.random() - 0.5) / 3);
        }

        if (position.getY(i) < this.box.min.y || position.getY(i) > this.box.max.y) {
          position.setY(i, Math.random() * (this.box.max.y - this.box.min.y) + this.box.min.y);
        }

        if (position.getZ(i) < this.box.min.z || position.getZ(i) > this.box.max.z) {
          position.setZ(i, Math.random() * (this.box.max.z - this.box.min.z) + this.box.min.z);
          velocity.setZ(i, (Math.random() - 0.5) / 3);
        }
      }

      if (
        'needsUpdate' in this.geometry.attributes.velocity &&
        'needsUpdate' in this.geometry.attributes.position
      ) {
        // 更新buffergeometry的attribute 使上述修改生效
        this.geometry.attributes.velocity.needsUpdate = true;
        this.geometry.attributes.position.needsUpdate = true;
      }

      this.material.uniforms.cameraPosition.value = cameraPosition;
      this.material.uniforms.time.value = this.time;
    }
  };

  private createSnow = (config: SnowConfig) => {
    const { length, height, scale, size } = config;
    const box = new THREE.Box3(
      new THREE.Vector3(length ? -length : -4000, 0, length ? -length : -4000),
      new THREE.Vector3(length || 4000, height || 5000, length || 4000),
    );
    this.box = box;

    const material = new SnowMaterial({
      size: size ? size * 20 : 20,
      map: new THREE.TextureLoader().load('data:image/png;base64,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'),
      blending: THREE.AdditiveBlending,
      depthTest: false,
      transparent: true,
    });

    material.onBeforeCompile = (shader) => {
      const getFoot = `
            uniform float top;
            uniform float bottom;
            uniform float time;
            #include <common>
            float angle(float x, float y){
              return atan(y, x);
            }
            vec2 getFoot(vec2 camera,vec2 normal,vec2 pos){
                vec2 position;

                float distanceLen = distance(pos, normal);

                float a = angle(camera.x - normal.x, camera.y - normal.y);

                pos.x > normal.x ? a -= 0.785 : a += 0.785;

                position.x = cos(a) * distanceLen;
                position.y = sin(a) * distanceLen;

                return position + normal;
            }
            `;
      const begin_vertex = `
            vec2 foot = getFoot(vec2(cameraPosition.x, cameraPosition.z),  vec2(normal.x, normal.z), vec2(position.x, position.z));
            float height = top - bottom;
            float y = normal.y - bottom - height * time;
            y = y + (y < 0.0 ? height : 0.0);
            float ratio = (1.0 - y / height) * (1.0 - y / height);
            y = height * (1.0 - ratio);
            y += bottom;
            y += position.y - normal.y;
            vec3 transformed = vec3( foot.x, y, foot.y );
            // vec3 transformed = vec3( position );
            `;
      shader.vertexShader = shader.vertexShader.replace('#include <common>', getFoot);
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', begin_vertex);

      shader.uniforms.cameraPosition = {
        value: new THREE.Vector3(0, 200, 0),
      };
      shader.uniforms.top = {
        value: 5000,
      };
      shader.uniforms.bottom = {
        value: 0,
      };
      shader.uniforms.time = {
        value: 0,
      };
      material.uniforms = shader.uniforms;
    };

    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const normals = [];
    const uvs = [];
    const indices = [];
    // 存储各个雪花的xyz的移动速率
    const velocity = [];

    if (!scale || !size) return;

    for (let i = 0; i < (scale > 0 ? 10000 * scale : 1000); i += 1) {
      const pos = new THREE.Vector3();
      pos.x = Math.random() * (box.max.x - box.min.x) + box.min.x;
      pos.y = Math.random() * (box.max.y - box.min.y) + box.min.y;
      pos.z = Math.random() * (box.max.z - box.min.z) + box.min.z;

      const elHeight = (box.max.y - box.min.y) / 2500;
      const elWidth = elHeight;

      vertices.push(
        pos.x + elWidth,
        pos.y + elHeight / 2,
        pos.z,
        pos.x - elWidth,
        pos.y + elHeight / 2,
        pos.z,
        pos.x - elWidth,
        pos.y - elHeight / 2,
        pos.z,
        pos.x + elWidth,
        pos.y - elHeight / 2,
        pos.z,
      );

      normals.push(
        pos.x,
        pos.y,
        pos.z,
        pos.x,
        pos.y,
        pos.z,
        pos.x,
        pos.y,
        pos.z,
        pos.x,
        pos.y,
        pos.z,
      );

      uvs.push(1, 1, 0, 1, 0, 0, 1, 0);

      indices.push(i * 4 + 0, i * 4 + 1, i * 4 + 2, i * 4 + 0, i * 4 + 2, i * 4 + 3);

      velocity.push(
        (Math.random() - 0.5) / 3,
        config.velocity && config.velocity > 0
          ? 0.1 + (Math.random() / 5) * config.velocity
          : 0.1 + Math.random() / 5,
        (Math.random() - 0.5) / 3,
      );
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(normals), 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), 2));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(new Float32Array(velocity), 3));
    geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));

    // 使初始雪花位置错开
    const { position } = geometry.attributes;
    for (let i = 0; i < position.count; i += 1)
      position.setY(i, Math.random() * (box.max.y - box.min.y) + box.min.y);

    this.geometry = geometry;
    this.material = material;
  };
}
