import CombatEvent from "./combatEvent";

class FuryExpirationEvent extends CombatEvent {
    static type = "furyExpiration";

    constructor(time, furyAmount, source) {
        super(FuryExpirationEvent.type, time);
        
        this.furyAmount = furyAmount;
        this.source = source;
    }
}

export default FuryExpirationEvent;