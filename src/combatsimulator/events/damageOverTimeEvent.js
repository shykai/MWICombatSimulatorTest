import CombatEvent from "./combatEvent";

class DamageOverTimeEvent extends CombatEvent {
    static type = "damageOverTime";

    constructor(time, sourceRef, target, damage, totalTicks, currentTick, combatStyleHrid) {
        super(DamageOverTimeEvent.type, time);

        // Calling it 'source' would wrongly clear Damage Over Time when the source dies
        this.sourceRef = sourceRef;
        this.target = target;
        this.damage = damage;
        this.totalTicks = totalTicks;
        this.currentTick = currentTick;
        this.combatStyleHrid = combatStyleHrid;
    }
}

export default DamageOverTimeEvent;
