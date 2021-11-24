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
      map: new THREE.TextureLoader().load(require('../assets/weather/snow.png')),
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
