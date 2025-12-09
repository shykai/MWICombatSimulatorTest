import CombatEvent from "./combatEvent";

class RegenTickEvent extends CombatEvent {
    static type = "regenTick";

    constructor(time) {
        super(RegenTickEvent.type, time);
    }
}

export default RegenTickEvent;
