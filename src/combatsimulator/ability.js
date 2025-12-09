import Buff from "./buff";
import abilityDetailMap from "./data/abilityDetailMap.json";
import Trigger from "./trigger";

const abilityFromCombatStat = {
    "blaze":
    {
        "hrid": "/abilities/blaze",
        "name": "Blaze",
        "description": "",
        "isSpecialAbility": false,
        "manaCost": 0,
        "cooldownDuration": 0,
        "castDuration": 0,
        "abilityEffects": [
            {
                "targetType": "allEnemies",
                "effectType": "/ability_effect_types/damage",
                "combatStyleHrid": "/combat_styles/magic",
                "damageType": "/damage_types/fire",
                "baseDamageFlat": 0,
                "baseDamageFlatLevelBonus": 0.0,
                "baseDamageRatio": 0.3,
                "baseDamageRatioLevelBonus": 0,
                "bonusAccuracyRatio": 0,
                "bonusAccuracyRatioLevelBonus": 0,
                "damageOverTimeRatio": 0,
                "damageOverTimeDuration": 0,
                "armorDamageRatio": 0,
                "armorDamageRatioLevelBonus": 0,
                "hpDrainRatio": 0,
                "pierceChance": 0,
                "blindChance": 0,
                "blindDuration": 0,
                "silenceChance": 0,
                "silenceDuration": 0,
                "stunChance": 0,
                "stunDuration": 0,
                "spendHpRatio": 0,
                "buffs": null
            }
        ],
        "defaultCombatTriggers": [
            {
                "dependencyHrid": "/combat_trigger_dependencies/all_enemies",
                "conditionHrid": "/combat_trigger_conditions/number_of_active_units",
                "comparatorHrid": "/combat_trigger_comparators/greater_than_equal",
                "value": 1
            },
            {
                "dependencyHrid": "/combat_trigger_dependencies/all_enemies",
                "conditionHrid": "/combat_trigger_conditions/current_hp",
                "comparatorHrid": "/combat_trigger_comparators/greater_than_equal",
                "value": 1
            }
        ],
    },
    "bloom":
    {
        "hrid": "/abilities/bloom",
        "name": "Bloom",
        "description": "",
        "isSpecialAbility": false,
        "manaCost": 0,
        "cooldownDuration": 0,
        "castDuration": 0,
        "abilityEffects": [
            {
                "targetType": "lowestHpAlly",
                "effectType": "/ability_effect_types/heal",
                "combatStyleHrid": "/combat_styles/magic",
                "damageType": "",
                "baseDamageFlat": 10,
                "baseDamageFlatLevelBonus": 0,
                "baseDamageRatio": 0.15,
                "baseDamageRatioLevelBonus": 0,
                "bonusAccuracyRatio": 0,
                "bonusAccuracyRatioLevelBonus": 0,
                "damageOverTimeRatio": 0,
                "damageOverTimeDuration": 0,
                "armorDamageRatio": 0,
                "armorDamageRatioLevelBonus": 0,
                "hpDrainRatio": 0,
                "pierceChance": 0,
                "blindChance": 0,
                "blindDuration": 0,
                "silenceChance": 0,
                "silenceDuration": 0,
                "stunChance": 0,
                "stunDuration": 0,
                "spendHpRatio": 0,
                "buffs": null
            }
        ],
        "defaultCombatTriggers": [
            {
                "dependencyHrid": "/combat_trigger_dependencies/all_allies",
                "conditionHrid": "/combat_trigger_conditions/lowest_hp_percentage",
                "comparatorHrid": "/combat_trigger_comparators/less_than_equal",
                "value": 100
            }
        ],
    }
}

class Ability {
    constructor(hrid, level = 1, triggers = null) {
        this.hrid = hrid;
        this.level = level;

        let gameAbility = abilityDetailMap[hrid];
        if (!gameAbility) {
            gameAbility = abilityFromCombatStat[hrid];
        }
        if (!gameAbility) {
            throw new Error("No ability found for hrid: " + this.hrid);
        }

        this.manaCost = gameAbility.manaCost;
        this.cooldownDuration = gameAbility.cooldownDuration;
        this.castDuration = gameAbility.castDuration;
        this.isSpecialAbility = gameAbility.isSpecialAbility;

        this.abilityEffects = [];

        for (const effect of gameAbility.abilityEffects) {
            let abilityEffect = {
                targetType: effect.targetType,
                effectType: effect.effectType,
                combatStyleHrid: effect.combatStyleHrid,
                damageType: effect.damageType,
                damageFlat: effect.baseDamageFlat + (this.level - 1) * effect.baseDamageFlatLevelBonus,
                damageRatio: effect.baseDamageRatio + (this.level - 1) * effect.baseDamageRatioLevelBonus,
                bonusAccuracyRatio: effect.bonusAccuracyRatio + (this.level - 1) * effect.bonusAccuracyRatioLevelBonus,
                damageOverTimeRatio: effect.damageOverTimeRatio,
                damageOverTimeDuration: effect.damageOverTimeDuration,
                armorDamageRatio: effect.armorDamageRatio + (this.level - 1) * effect.armorDamageRatioLevelBonus,
                hpDrainRatio: effect.hpDrainRatio,
                pierceChance: effect.pierceChance,
                blindChance: effect.blindChance,
                blindDuration: effect.blindDuration,
                silenceChance: effect.silenceChance,
                silenceDuration: effect.silenceDuration,
                stunChance: effect.stunChance,
                stunDuration: effect.stunDuration,
                spendHpRatio: effect.spendHpRatio,
                buffs: null,
            };
            if (effect.buffs) {
                abilityEffect.buffs = [];
                for (const buff of effect.buffs) {
                    abilityEffect.buffs.push(new Buff(buff, this.level));
                }
            }
            this.abilityEffects.push(abilityEffect);
        }

        if (triggers) {
            this.triggers = triggers;
        } else {
            this.triggers = [];
            for (const defaultTrigger of gameAbility.defaultCombatTriggers) {
                let trigger = new Trigger(
                    defaultTrigger.dependencyHrid,
                    defaultTrigger.conditionHrid,
                    defaultTrigger.comparatorHrid,
                    defaultTrigger.value
                );
                this.triggers.push(trigger);
            }
        }

        this.lastUsed = Number.MIN_SAFE_INTEGER;
    }

    static createFromDTO(dto) {
        let triggers = dto.triggers.map((trigger) => Trigger.createFromDTO(trigger));
        let ability = new Ability(dto.hrid, dto.level, triggers);

        return ability;
    }

    shouldTrigger(currentTime, source, target, friendlies, enemies) {
        if (source.isStunned) {
            return false;
        }

        if (source.isSilenced) {
            return false;
        }

        let haste = source.combatDetails.combatStats.abilityHaste;
        let cooldownDuration = this.cooldownDuration;
        if (haste > 0) {
            cooldownDuration = cooldownDuration * 100 / (100 + haste);
        }

        if (this.lastUsed + cooldownDuration > currentTime) {
            return false;
        }

        if (this.triggers.length == 0) {
            return true;
        }

        let shouldTrigger = true;
        for (const trigger of this.triggers) {
            if (!trigger.isActive(source, target, friendlies, enemies, currentTime)) {
                shouldTrigger = false;
            }
        }

        return shouldTrigger;
    }
}

export default Ability;
