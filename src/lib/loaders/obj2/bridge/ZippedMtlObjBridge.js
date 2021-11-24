/**
 * @author Kai Salmen / https://kaisalmen.de
 * Development repository: https://github.com/kaisalmen/WWOBJLoader
 */

import { ZippedMTLLoader } from '../../ZippedMTLLoader';

const ZippedMtlObjBridge = {
  /**
   *
   * @param processResult
   * @param assetLoader
   */
  link: function (processResult, assetLoader) {
    if (typeof assetLoader.addMaterials === 'function') {
      assetLoader.addMaterials(this.addMaterialsFromMtlLoader(processResult), true);
    }
  },

  /**
   * Returns the array instance of {@link MTLLoader.MaterialCreator}.
   *
   * @param Instance of {@link MTLLoader.MaterialCreator}
   */
  addMaterialsFromMtlLoader: function (materialCreator) {
    let newMaterials = {};
    if (materialCreator instanceof ZippedMTLLoader.MaterialCreator) {
      materialCreator.preload();
      newMaterials = materialCreator.materials;
    }
    return newMaterials;
  },
};

export { ZippedMtlObjBridge };
