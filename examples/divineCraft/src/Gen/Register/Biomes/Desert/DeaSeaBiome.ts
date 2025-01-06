import { Biome, BiomeConstructor, BiomeData } from "../../../Classes/Biome";
import { StandardCaves } from "../../Caves/StandardCaves";
import { VoxelData, Voxels } from "../Voxels";
import { Trees } from "../Tree";
import { Plants } from "../Plants";
import { Coral } from "../Coral";
import { Caves } from "../Caves";
const [xOffSet, zOffSet] = [1000, 10000];
const scale = 480;
export class DeaSeaBiome extends Biome {
  static data: BiomeData = {
    id: "dea-sea",
    heightBlendFactor: 1,
    color:[153, 131, 70],
    edgeBiomes:[]
  };
  caveCarver = new StandardCaves(this.nodes);

  getGenVoxel(x: number, y: number, z: number) {
    return VoxelData[Voxels.Stone];
  }

  getCarved(x: number, y: number, z: number): boolean {
    return Caves.getCarved(x,y,z);
  }
  getBlendtoHeight(x: number, y: number, z: number): number {
    return this.getHeight(x,y,z)
}
noiseQuery(x: number, y: number, z: number) {


  return (
    (1 +
      this.nodes.noise.worldGenNoise(
        (x + xOffSet) / scale,
        y / scale,
        (z + zOffSet) / scale
      )) /
    2
  );
}
getHeight(x: number, y: number, z: number): number {

  let height = this.noiseQuery(x, 0, z) * 30 + this.nodes.minHeight;
  return height;
}


  addTopLayer(x: number, y: number, z: number) {
    const { dataTool, brush } = this.nodes;
    dataTool.loadInAt(x, y + 1, z);
    const topAir = dataTool.isAir();
    dataTool.loadInAt(x, y, z);
    const voxel = dataTool.getStringId();
    if (topAir && voxel == Voxels.Stone) {
      brush.setData(VoxelData[Voxels.Sand]).setXYZ(x, y, z).paint();
      let i = 5;
      while (i--) {
        brush
          .setData(VoxelData[Voxels.Sand])
          .setXYZ(x, y - 1 - i, z)
          .paint();
      }
      return true;
    }
    return false;
  }
  fill(x: number, y: number, z: number) {
    return false;
  }
  decorate(x: number, y: number, z: number) {
    const { dataTool, brush } = this.nodes;
    dataTool.loadInAt(x, y + 1, z);
    const topAir = dataTool.isAir();
    dataTool.loadInAt(x, y, z);
    const voxel = dataTool.getStringId();
    if (topAir && voxel == Voxels.Sand) {
      const value = Math.random();
      if (value > 0.87 && value < 0.89) {
        Coral.generateRandomDeadCoral(x, y + 1, z);
        return;
      }
      if (value > 0.85 && value < 0.87) {
        Plants.generateRandomDeadCoral(this.nodes, x, y + 1, z);
        return;
      }
    }

  }

  getData(): BiomeData {
    return this.getClass().data;
  }
  getClass(): BiomeConstructor {
    return DeaSeaBiome;
  }
}
