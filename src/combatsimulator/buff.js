class Buff {
    startTime;

    constructor(buff, level = 1) {
        this.uniqueHrid = buff.uniqueHrid;
        this.typeHrid = buff.typeHrid;
        this.ratioBoost = buff.ratioBoost + (level - 1) * buff.ratioBoostLevelBonus;
        this.flatBoost = buff.flatBoost + (level - 1) * buff.flatBoostLevelBonus;
        this.duration = buff.duration;
        this.multiplierForSkillHrid = buff.multiplierForSkillHrid ?? "";
        this.multiplierPerSkillLevel = buff.multiplierPerSkillLevel ?? 0;
    }
}

export default Buff;
