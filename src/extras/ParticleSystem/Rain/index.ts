import * as THREE from 'three';
import RainMaterial from './material';

type RainConfig = {
  // 区域范围的长度 默认4000
  length?: number;
  // 区域范围的高度 默认5000
  height?: number;
  // 雨水的水滴数量规模 默认值1约1000雨柱 小于0则变为默认值 等于0则不产生雨水
  scale?: number;
  // 水滴宽度 默认值1 小于0则变为默认值 等于0则不产生雨水
  blobWidth?: number;
  // 水滴长度 默认值1 小于0则变为默认值 等于0则不产生雨水
  blobLength?: number;
  // 水滴下落速率 默认值1 小于等于零则为默认值
  velocity?: number;
};

export default class Rain extends THREE.Mesh {
  private time: number = 0;
  private clock: THREE.Clock = new THREE.Clock();
  material: RainMaterial = new RainMaterial();
  private velocity: number = 1;
  constructor(
    config: RainConfig = {
      length: 4000,
      height: 5000,
      scale: 1,
      blobWidth: 1,
      blobLength: 1,
    },
  ) {
    super();
    this.createRain(config);
    this.userData.type = 'weather';
    config.velocity && config.velocity > 0 && (this.velocity = config.velocity);
  }

  public update = (cameraPosition: THREE.Vector3) => {
    this.time = (this.time + this.clock.getDelta() * 0.5 * this.velocity) % 1;

    this.material.cameraPosition = cameraPosition;

    if (this.material.uniforms) {
      this.material.uniforms.cameraPosition.value = cameraPosition;
      this.material.uniforms.time.value = this.time;
    }
  };

  private createRain = (config: RainConfig) => {
    const { length, height, scale, blobWidth, blobLength } = config;
    const box = new THREE.Box3(
      new THREE.Vector3(length ? -length : -4000, 0, length ? -length : -4000),
      new THREE.Vector3(length || 4000, height || 5000, length || 4000),
    );

    const material = new RainMaterial({
      transparent: true,
      opacity: 0.8,
      map: new THREE.TextureLoader().load(
        require('../assets/weather/rain.png'),
      ),
      depthWrite: false,
    });

    material.onBeforeCompile = shader => {
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
      shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        getFoot,
      );
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        begin_vertex,
      );

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

    if (!scale || !blobWidth || !blobLength) return;

    for (let i = 0; i < (scale > 0 ? 1000 * scale : 1000); i += 1) {
      const pos = new THREE.Vector3();
      pos.x = Math.random() * (box.max.x - box.min.x) + box.min.x;
      pos.y = Math.random() * (box.max.y - box.min.y) + box.min.y;
      pos.z = Math.random() * (box.max.z - box.min.z) + box.min.z;

      // 该代码用于控制雨滴长宽
      const elHeight = ((box.max.y - box.min.y) / 15) * scale;
      const elWidth = (elHeight / 60) * scale;

      blobWidth > 0 && elWidth * blobWidth;
      blobLength > 0 && elHeight * blobLength;

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

      indices.push(
        i * 4 + 0,
        i * 4 + 1,
        i * 4 + 2,
        i * 4 + 0,
        i * 4 + 2,
        i * 4 + 3,
      );
    }

    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(vertices), 3),
    );
    geometry.setAttribute(
      'normal',
      new THREE.BufferAttribute(new Float32Array(normals), 3),
    );
    geometry.setAttribute(
      'uv',
      new THREE.BufferAttribute(new Float32Array(uvs), 2),
    );
    geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));

    this.geometry = geometry;
    this.material = material;
  };
}
