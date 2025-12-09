import CombatEvent from "./combatEvent";

class CooldownReadyEvent extends CombatEvent {
    static type = "cooldownReady";

    constructor(time) {
        super(CooldownReadyEvent.type, time);
    }
}

export default CooldownReadyEvent;
