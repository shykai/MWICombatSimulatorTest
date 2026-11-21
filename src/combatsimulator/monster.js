import Ability from "./ability";
import CombatUnit from "./combatUnit";
import combatMonsterDetailMap from "./data/combatMonsterDetailMap.json";
import Drops from "./drops";

class Monster extends CombatUnit {

    difficultyTier = 0;
    
    LabyrinthMonsterBaseRoomLevel = 100; //Base stats are designed for room level 100, and scale proportionally    
    roomLevel = 0;

    constructor(hrid, difficultyTier = 0, roomLevel = 0) {
        super();

        this.isPlayer = false;
        this.hrid = hrid;
        this.difficultyTier = difficultyTier;
        this.roomLevel = roomLevel;
        if (this.roomLevel <= 0) {
            this.roomLevel = this.LabyrinthMonsterBaseRoomLevel;
        }

        let gameMonster = combatMonsterDetailMap[this.hrid];
        if (!gameMonster) {
            throw new Error("No monster found for hrid: " + this.hrid);
        }

        this.isBoss = gameMonster.isBoss ?? false;

        this.enrageTime = gameMonster.enrageTime;

        let labyrinthScaleFactor = this.roomLevel / this.LabyrinthMonsterBaseRoomLevel;
        for (let i = 0; i < gameMonster.abilities.length; i++) {
            if (gameMonster.abilities[i].minDifficultyTier > this.difficultyTier) {
                continue;
            }
            this.abilities[i] = new Ability(gameMonster.abilities[i].abilityHrid, Math.floor(gameMonster.abilities[i].level * labyrinthScaleFactor));
        }
        if(gameMonster.dropTable)
        for (let i = 0; i < gameMonster.dropTable.length; i++) {
            this.dropTable[i] = new Drops(gameMonster.dropTable[i].itemHrid, gameMonster.dropTable[i].dropRate, gameMonster.dropTable[i].minCount, gameMonster.dropTable[i].maxCount, gameMonster.dropTable[i].difficultyTier);
        }
        for (let i = 0; i < gameMonster.rareDropTable.length; i++) {
            let dropTableItem = (gameMonster.dropTable && i < gameMonster.dropTable.length) ? gameMonster.dropTable[i] : null;
            let difficultyTier = dropTableItem?.difficultyTier ?? gameMonster.rareDropTable[i].minDifficultyTier;

            this.rareDropTable[i] = new Drops(gameMonster.rareDropTable[i].itemHrid, gameMonster.rareDropTable[i].dropRate, gameMonster.rareDropTable[i].minCount, difficultyTier);
        }
    }

    updateCombatDetails() {
        let gameMonster = combatMonsterDetailMap[this.hrid];

        let levelMultiplier = 1.0 + 0.25 * this.difficultyTier;
        let defLevelMultiplier = 1.0 + 0.15 * this.difficultyTier;
        let levelBonus = 20.0 * this.difficultyTier;

        let labyrinthScaleFactor = this.roomLevel / this.LabyrinthMonsterBaseRoomLevel;

        this.staminaLevel = levelMultiplier * (gameMonster.combatDetails.staminaLevel + levelBonus) * labyrinthScaleFactor;
        this.intelligenceLevel = levelMultiplier * (gameMonster.combatDetails.intelligenceLevel + levelBonus) * labyrinthScaleFactor;
        this.attackLevel = levelMultiplier * (gameMonster.combatDetails.attackLevel + levelBonus) * labyrinthScaleFactor;
        this.meleeLevel = levelMultiplier * (gameMonster.combatDetails.meleeLevel + levelBonus) * labyrinthScaleFactor;
        this.defenseLevel = defLevelMultiplier * (gameMonster.combatDetails.defenseLevel + levelBonus) * labyrinthScaleFactor;
        this.rangedLevel = levelMultiplier * (gameMonster.combatDetails.rangedLevel + levelBonus) * labyrinthScaleFactor;
        this.magicLevel = levelMultiplier * (gameMonster.combatDetails.magicLevel + levelBonus) * labyrinthScaleFactor;
        
        let expMultiplier = 1.0 + 0.5 * this.difficultyTier;
        let expBonus = 5.0 * this.difficultyTier;

        this.experience = expMultiplier * (gameMonster.experience + expBonus);

        this.combatDetails.combatStats.combatStyleHrid = gameMonster.combatDetails.combatStats.combatStyleHrids[0];

        for (const [key, value] of Object.entries(gameMonster.combatDetails.combatStats)) {
            this.combatDetails.combatStats[key] = value;
        }

        this.combatDetails.combatStats.armor *= labyrinthScaleFactor;
        this.combatDetails.combatStats.waterResistance *= labyrinthScaleFactor;
        this.combatDetails.combatStats.natureResistance *= labyrinthScaleFactor;
        this.combatDetails.combatStats.fireResistance *= labyrinthScaleFactor;

        [
            "stabAccuracy",
            "slashAccuracy",
            "smashAccuracy",
            "rangedAccuracy",
            "magicAccuracy",
            "stabDamage",
            "slashDamage",
            "smashDamage",
            "rangedDamage",
            "magicDamage",
            "defensiveDamage",
            "taskDamage",
            "physicalAmplify",
            "waterAmplify",
            "natureAmplify",
            "fireAmplify",
            "healingAmplify",
            "stabEvasion",
            "slashEvasion",
            "smashEvasion",
            "rangedEvasion",
            "magicEvasion",
            "armor",
            "waterResistance",
            "natureResistance",
            "fireResistance",
            "maxHitpoints",
            "maxManapoints",
            "lifeSteal",
            "hpRegenPer10",
            "mpRegenPer10",
            "physicalThorns",
            "elementalThorns",
            "combatDropRate",
            "combatRareFind",
            "combatDropQuantity",
            "combatExperience",
            "criticalRate",
            "criticalDamage",
            "armorPenetration",
            "waterPenetration",
            "naturePenetration",
            "firePenetration",
            "abilityHaste",
            "tenacity",
            "manaLeech",
            "castSpeed",
            "threat",
            "parry",
            "mayhem",
            "pierce",
            "curse",
            "fury",
            "weaken",
            "ripple",
            "bloom",
            "blaze",
            "smite",
            "shatter",
            "overkill",
            "echo",
            "fortify",
            "consistency",
            "attackSpeed",
            "foodHaste",
            "drinkConcentration",
            "autoAttackDamage",
            "abilityDamage",
            "retaliation"
        ].forEach((stat) => {
            if (gameMonster.combatDetails.combatStats[stat] == null) {
                this.combatDetails.combatStats[stat] = 0;
            }
        });

        if (this.combatDetails.combatStats.attackInterval == 0) {
            this.combatDetails.combatStats.attackInterval = gameMonster.combatDetails.attackInterval;
        }

        super.updateCombatDetails();
    }
}

export default Monster;
