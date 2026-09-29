import Buff from "./buff";
import guildBuffDetailMap from "./data/guildBuffDetailMap.json";

class GuildBuff {
    constructor(hrid, level) {
        this.hrid = hrid;
        this.level = level;

        let gameGuildBuff = guildBuffDetailMap[this.hrid];
        if (!gameGuildBuff) {
            throw new Error("No guild buff found for hrid: " + this.hrid);
        }

        this.buffs = [];
        for (const buffDetail of gameGuildBuff.buffs) {
            this.buffs.push(new Buff(buffDetail, level));
        }
    }
}

export default GuildBuff;
