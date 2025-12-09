import CombatEvent from "./combatEvent";

class CurseExpirationEvent extends CombatEvent {
    static type = "curseExpiration";
    static maxCurseStacks = 5;

    constructor(time, curseAmount, source) {
        super(CurseExpirationEvent.type, time);

        this.curseAmount = Math.min(curseAmount + 1, CurseExpirationEvent.maxCurseStacks);

        this.source = source;
    }
}

export default CurseExpirationEvent;