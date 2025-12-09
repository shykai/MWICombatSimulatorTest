import CombatEvent from "./combatEvent";

class AwaitCooldownEvent extends CombatEvent {
    static type = "awaitCooldownEvent";

    constructor(time, source) {
        super(AwaitCooldownEvent.type, time);

        this.source = source;
    }
}

export default AwaitCooldownEvent;