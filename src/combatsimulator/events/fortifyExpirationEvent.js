import CombatEvent from "./combatEvent";

class FortifyExpirationEvent extends CombatEvent {
    static type = "fortifyExpiration";
    static maxFortifyStacks = 4;

    constructor(time, fortifyAmount, source) {
        super(FortifyExpirationEvent.type, time);
        this.fortifyAmount = Math.min(
            fortifyAmount + 1,
            FortifyExpirationEvent.maxFortifyStacks
        );
        this.source = source;
    }
}

export default FortifyExpirationEvent;
