/**
 *@description 加载OBJ文件的加载器.
 *@author guoweiyu.
 *@date 2021-08-24 09:26:49.
 */
import { OBJModelLoaderType } from './type';
import { OBJLoader2 } from '../../lib/loaders/OBJLoader2';
import ModelLoader from './ModelLoader';

class OBJModelLoader extends ModelLoader {
  load(config: OBJModelLoaderType) {
    const {
      url,
      complete,
      isOutline = true,
      process,
      position,
      angles,
    } = config;
    if (!url) return;
    const loader = new OBJLoader2();
    loader.load(
      url,
      (obj) => {
        this.moveToCenter(obj);
        isOutline && this.addEdgeOutline(obj);
        this.add(obj);
        position && this.position.set(...position);
        angles && this.rotation.set(...angles);
        complete && complete(this);
      },
      (info) => {
        process && process(info);
      },
    );
  }
}

export default OBJModelLoader;
