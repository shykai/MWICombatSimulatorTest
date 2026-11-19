import talismanModifierDetailMap from "./data/talismanModifierDetailMap.json";

const SPECIAL_MODIFIER_GROUP_HRID = "/talisman_modifier_groups/special";

class Talisman {
    constructor(talismanTypeHrid, modifiers, slotIndex) {
        this.talismanTypeHrid = talismanTypeHrid;
        this.modifiers = modifiers ?? [];
        this.slotIndex = slotIndex;
    }

    static createFromDTO(dto) {
        return new Talisman(
            dto.talismanTypeHrid,
            (dto.modifiers ?? []).map((modifier) => ({ hrid: modifier.hrid, grade: modifier.grade })),
            dto.slotIndex
        );
    }

    static isSpecialModifier(modifier) {
        return talismanModifierDetailMap[modifier.hrid]?.groupHrid == SPECIAL_MODIFIER_GROUP_HRID;
    }

    static getActiveModifierPositions(modifierLists) {
        let activePositions = new Set();
        let bestSpecialPositions = new Map();

        modifierLists.forEach((modifiers, listIndex) => {
            let seenHrids = new Set();
            (modifiers ?? []).forEach((modifier, modifierIndex) => {
                if (seenHrids.has(modifier.hrid)) {
                    return;
                }
                seenHrids.add(modifier.hrid);
                let positionKey = listIndex + ":" + modifierIndex;
                if (!Talisman.isSpecialModifier(modifier)) {
                    activePositions.add(positionKey);
                    return;
                }
                let grade = modifier.grade ?? 1;
                let bestSpecial = bestSpecialPositions.get(modifier.hrid);
                if (!bestSpecial || grade > bestSpecial.grade) {
                    bestSpecialPositions.set(modifier.hrid, { positionKey: positionKey, grade: grade });
                }
            });
        });

        bestSpecialPositions.forEach((bestSpecial) => activePositions.add(bestSpecial.positionKey));

        return activePositions;
    }

    getModifierValue(modifier, talismanPower) {
        let detail = talismanModifierDetailMap[modifier.hrid];
        if (!detail) {
            return 0;
        }
        let grade = Math.min(Math.max(modifier.grade ?? 1, 1), detail.gradeValues.length);
        return detail.gradeValues[grade - 1] * (1 + (talismanPower ?? 0));
    }

    getCombatStats(talismanPower, isModifierActive) {
        let stats = {};
        this.modifiers.forEach((modifier, modifierIndex) => {
            if (isModifierActive && !isModifierActive(modifier, modifierIndex)) {
                return;
            }
            let detail = talismanModifierDetailMap[modifier.hrid];
            if (!detail || detail.talismanTypeHrid != this.talismanTypeHrid) {
                return;
            }
            if (detail.targetHrid != "/talisman_modifier_targets/combat_stat") {
                return;
            }

            let value = this.getModifierValue(modifier, talismanPower);
            detail.keys.forEach((key) => {
                let stat = key.charAt(0).toLowerCase() + key.slice(1);
                stats[stat] = (stats[stat] ?? 0) + value;
            });
        });

        return stats;
    }
}

export default Talisman;
