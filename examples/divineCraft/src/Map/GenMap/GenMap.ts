import { GenMapTile } from "./GenMapTile";
import { GenMapTilesRegister } from "./GenMapTilesRegister";
import { EntityTool } from "@divinevoxel/babylon-renderer/Defaults/Foundation/Tools/EntityTool";
import {
  Scene,
  Mesh,
  VertexBuffer,
  StandardMaterial,
  ShaderMaterial,
} from "@babylonjs/core";
import { LocationData } from "@divinevoxel/core/Math";
import { WorldSpaces } from "@divinevoxel/core/Data/World/WorldSpaces";
import { $2dMooreNeighborhood } from "@divinevoxel/core/Math/Constants/CardinalNeighbors.js";
import { Distance3D, Vec3Array, Vector3Like } from "@amodx/math";
import { GenMapTileMaterial } from "./GenMapTileMaterial";
import { WorldRegister } from "@divinevoxel/foundation/Data/World/WorldRegister";
import { Quad } from "../Quad";
export class GenMap {
  static Constants = {
    MAX_TILES: 2_000,
  };

  tilesRegister = new GenMapTilesRegister(this);

  tilesMaterial: ShaderMaterial;

  _colorBuffer: Float32Array;
  _instanceTool: EntityTool;
  _instanceMesh: Mesh;
  _previousLocation: LocationData;
  _searchQueue: Vec3Array[] = [];
  _visitedMap: Map<string, boolean> = new Map();
  constructor() {}

  init(scene: Scene) {
    const quadData = Quad.GetQuad();
    this._instanceMesh = new Mesh("world-map-tile-base", scene);
    this._instanceMesh.setVerticesData(
      VertexBuffer.PositionKind,
      quadData.positions
    );
    this._instanceMesh.setVerticesData(
      VertexBuffer.NormalKind,
      quadData.normals
    );
    this._instanceMesh.setVerticesData(VertexBuffer.UVKind, quadData.uvs);
    this._instanceMesh.setVerticesData(VertexBuffer.UVKind, quadData.uvs);
    this._instanceMesh.setIndices(quadData.indicies);
    this._instanceTool = new EntityTool(this._instanceMesh);
    this._instanceMesh.alwaysSelectAsActiveMesh = true;
    this.tilesMaterial = GenMapTileMaterial.create(scene);
    this._instanceMesh.material = this.tilesMaterial;
    this._instanceTool.setInstanceAmount(GenMap.Constants.MAX_TILES);

    const colorBuffer = new Float32Array(GenMap.Constants.MAX_TILES * 4);

    console.log(colorBuffer);
    this._instanceTool.addBuffer("tileColor", colorBuffer, 4);

    this._colorBuffer = colorBuffer;
  }

  updateTiles(location: LocationData) {
    if (!this._previousLocation) {
      this._previousLocation = [...location];
    }

    const worldColumnPOS = Vector3Like.Clone(
      WorldSpaces.column.getPositionXYZ(location[1], 0, location[3])
    );

    this._searchQueue.push([
      worldColumnPOS.x,
      worldColumnPOS.y,
      worldColumnPOS.z,
    ]);

    while (this._searchQueue.length) {
      const node = this._searchQueue.shift();

      if (!node) break;
      const cx = node[0];
      const cy = 0;
      const cz = node[2];
      const columnKey = WorldSpaces.column.getKeyXYZ(cx, 0, cz);

      if (this._visitedMap.has(columnKey)) continue;
      this._visitedMap.set(columnKey, true);

      const distance = Distance3D(
        worldColumnPOS.x,
        0,
        worldColumnPOS.z,
        cx,
        0,
        cz
      );
      if (distance > 600) continue;

      for (const n of $2dMooreNeighborhood) {
        const nx = cx + n[0] * WorldSpaces.column._bounds.x;
        const nz = cz + n[1] * WorldSpaces.column._bounds.z;
        const columnPOS = WorldSpaces.column.getPositionXYZ(nx, cy, nz),
          key = WorldSpaces.column.getKey();
        if (!this._visitedMap.has(key)) {
          this._searchQueue.push([columnPOS.x, cy, columnPOS.z]);
        }
      }

      const columnLocation: LocationData = [location[0], cx, 0, cz];

      const column = WorldRegister.instance.column.get(columnLocation);
      if (!column) {
        this.tilesRegister.column.remove(columnLocation);
      } else {
        if (!this.tilesRegister.column.get(columnLocation)) {
          this.tilesRegister.column.add(columnLocation);
        }
      }
      const columnTile = this.tilesRegister.column.get(columnLocation);
      if (columnTile) columnTile.update();
    }

    this._instanceTool.update();
    this._visitedMap.clear();
  }
  dispose() {
    this._instanceMesh.dispose();
  }
}
