import CombatEvent from "./combatEvent";

class BlindExpirationEvent extends CombatEvent {
    static type = "blindExpiration";

    constructor(time, source) {
        super(BlindExpirationEvent.type, time);

        this.source = source;
    }
}

export default BlindExpirationEvent;