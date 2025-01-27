import { LocationData } from "@divinevoxel/vlox/Math";
import { GenMap } from "./GenMap";
import { EntityInstance } from "@divinevoxel/vlox-babylon/Tools/EntityInstance";
import { ColumnStructIds } from "@divinevoxel/vlox/World/Column/ColumnStructIds";
import { SafeInterval } from "@amodx/core/Intervals/SafeInterval";
import { DivineVoxelEngineRender } from "@divinevoxel/vlox/Contexts/Render";
import { WorldRegister } from "@divinevoxel/vlox/World/WorldRegister";
import { Column } from "@divinevoxel/vlox/World/Column";
export class GenMapTile {
  static Tiles: GenMapTile[] = [];

  _instance: EntityInstance;
  _dispoed = false;

  constructor(
    public worldMap: GenMap,
    public column: Column,
    public location: LocationData
  ) {
    const instance = this.worldMap._instanceTool.getInstance();
    if (!instance) {
      console.warn(`Could not load tile instance for ${location}`);
    } else {
      this._instance = instance;
    }
    GenMapTile.Tiles.push(this);
    this._instance.position.set(location[1], location[2], location[3]);
    this._instance.scale.set(1, 1, 1);
    this.update();
  }

  update() {
    if (this._dispoed) return;

    Column.StateStruct.setData(this.column.columnState);
    if (
      Column.StateStruct.getProperty(ColumnStructIds.isWorldGenDone) &&
      Column.StateStruct.getProperty(ColumnStructIds.isWorldDecorDone) &&
      Column.StateStruct.getProperty(ColumnStructIds.isWorldSunDone) &&
      Column.StateStruct.getProperty(ColumnStructIds.isWorldPropagationDone) &&
      DivineVoxelEngineRender.instance.meshRegister.column.get(this.location)
    ) {
      this.setColor(0.0, 1.0, 0.0); // Green
      return;
    }
    if (Column.StateStruct.getProperty(ColumnStructIds.isWorldSunDone)) {
      this.setColor(1.0, 1.0, 0.0); // Yellow
      return;
    }
    if (
      Column.StateStruct.getProperty(ColumnStructIds.isWorldPropagationDone)
    ) {
      this.setColor(0.5, 0.0, 0.5); // Purple
      return;
    }
    if (Column.StateStruct.getProperty(ColumnStructIds.isWorldDecorDone)) {
      this.setColor(0.0, 0.0, 1.0); // Blue
      return;
    }
    if (Column.StateStruct.getProperty(ColumnStructIds.isWorldGenDone)) {
      this.setColor(0.0, 1.0, 1.0); // Cyan
      return;
    }

    if (Column.StateStruct.getProperty(ColumnStructIds.isDirty)) {
      this.setColor(0.0, 0.0, 1.0); // Blue
      return;
    }
    this.setColor(1, 1.0, 1.0);
  }

  setColor(r: number, g: number, b: number) {
    let index = this._instance.index * 4;

    this.worldMap._colorBuffer[index] = r;
    this.worldMap._colorBuffer[index + 1] = g;
    this.worldMap._colorBuffer[index + 2] = b;
    this.worldMap._colorBuffer[index + 3] = 1;
  }
  dispose() {
    this._dispoed = true;
    GenMapTile.Tiles = GenMapTile.Tiles.filter((_) => _ != this);
    this._instance.destroy();
  }
}
