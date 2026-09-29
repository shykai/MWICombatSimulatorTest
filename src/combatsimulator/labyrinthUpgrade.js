import Buff from "./buff";
import labyrinthUpgradeDetailMap from "./data/labyrinthUpgradeDetailMap.json";

class LabyrinthUpgrade {
    constructor(hrid, level) {
        this.hrid = hrid;
        this.level = level;

        let gameLabyrinthUpgrade = labyrinthUpgradeDetailMap[this.hrid];
        if (!gameLabyrinthUpgrade) {
            throw new Error("No labyrinth upgrade found for hrid: " + this.hrid);
        }

        this.buffs = [new Buff(gameLabyrinthUpgrade, level)];
    }
}

export default LabyrinthUpgrade;
