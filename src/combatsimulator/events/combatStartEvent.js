import CombatEvent from "./combatEvent";

class CombatStartEvent extends CombatEvent {
    static type = "combatStart";

    constructor(time) {
        super(CombatStartEvent.type, time);
    }
}

export default CombatStartEvent;
