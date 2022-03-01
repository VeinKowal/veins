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
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAACACAYAAADQxeN6AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyZpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMTQ1IDc5LjE2MzQ5OSwgMjAxOC8wOC8xMy0xNjo0MDoyMiAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTkgKFdpbmRvd3MpIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjdBQjhCODQwQ0JDMjExRUFCRTU3RDA0RDU0RjMzRTREIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjdBQjhCODQxQ0JDMjExRUFCRTU3RDA0RDU0RjMzRTREIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6N0FCOEI4M0VDQkMyMTFFQUJFNTdEMDRENTRGMzNFNEQiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6N0FCOEI4M0ZDQkMyMTFFQUJFNTdEMDRENTRGMzNFNEQiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz5mqkn7AAACRElEQVR42sxZQU4DMQyMk72UV/MYDvyjv4Aj4g9cyrBFrVhFHnsScmilqK0ar5PJeBy7BqCMvmqZeD240dZ9t2AuPCPrjOw20Q4G6I3qwQjkIRfmCc5e78bUqPcWAtGOm41AYehZ9IAtODPJU02WJ51TYZ4jIzAkvT2ZA3cKBLrPpniC83Rk6FkEwih66eH2yJXIUyEwIyPsMTzg8DBdXgq5BUgaM2qOF4l70TvUeEJm1Bx4q0crj0b9RCiMAFGlMHKRcdDbEwt1ip4FZyWHuwQ5iHTJYikHYSr+I+iFauQyQF1ecahkWX6yGTUaljB2TvRwLQj3kqHnGbtAbAncYVKzLMt7jGDsNoV7Rbl8bIQJZTY0kO0JJMtjGY1aoA1DnlKFnQ6NYe612eUxQTEVvaJoxJJwlxJ1i0RfEctQnj1PhXjBjEbI8ZQubzo0lp2ThF5EpXR5YEUnA0Iuhdos5BbcY9dB3oIlQWU5RhkBp6iUU43ECCQlnpzUoIaGV+qlOTfioFR9yoyQC5SqlOBLw33omlNJKEyHhpxqpLKhkctuGu7RJX7djeVftQZmzmmoDG9EH0xtAUHtfDRSnBT1nIaMphKAxzWpomY9lqp0CaS2lpFOVVqGR03Bofse1LYWnPYqVN2z0T0NBSHr70l9IyjLs6BnKV9zJDWyoGywpT3L7+7O1xtcvH18dGDUg0Jd3z89o9duYs/6lz9IgPt42sd5HxdnnG+//849Gl3HaR/P+3jbx9c+3m/fT8d59th/8PwIMAC28xE/4wZCqAAAAABJRU5ErkJggg==',
      ),
      depthWrite: false,
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
