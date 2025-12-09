import CombatEvent from "./combatEvent";

class AutoAttackEvent extends CombatEvent {
    static type = "autoAttack";

    constructor(time, source) {
        super(AutoAttackEvent.type, time);

        this.source = source;
    }
}

export default AutoAttackEvent;
