import CombatUtilities from "./combatUtilities";
import AutoAttackEvent from "./events/autoAttackEvent";
import DamageOverTimeEvent from "./events/damageOverTimeEvent";
import CheckBuffExpirationEvent from "./events/checkBuffExpirationEvent";
import CombatStartEvent from "./events/combatStartEvent";
import ConsumableTickEvent from "./events/consumableTickEvent";
import CooldownReadyEvent from "./events/cooldownReadyEvent";
import EnemyRespawnEvent from "./events/enemyRespawnEvent";
import EventQueue from "./events/eventQueue";
import PlayerRespawnEvent from "./events/playerRespawnEvent";
import RegenTickEvent from "./events/regenTickEvent";
import StunExpirationEvent from "./events/stunExpirationEvent";
import BlindExpirationEvent from "./events/blindExpirationEvent";
import SilenceExpirationEvent from "./events/silenceExpirationEvent";
import CurseExpirationEvent from "./events/curseExpirationEvent";
import WeakenExpirationEvent from "./events/weakenExpirationEvent";
import FuryExpirationEvent from "./events/furyExpirationEvent";
import EnrageTickEvent from "./events/enrageTickEvent";
import SimResult from "./simResult";
import AbilityCastEndEvent from "./events/abilityCastEndEvent";
import AwaitCooldownEvent from "./events/awaitCooldownEvent";
import Monster from "./monster";
import Ability from "./ability";

const ONE_SECOND = 1e9;
const HOT_TICK_INTERVAL = 5 * ONE_SECOND;
const DOT_TICK_INTERVAL = 3 * ONE_SECOND;
const REGEN_TICK_INTERVAL = 10 * ONE_SECOND;
const ENEMY_RESPAWN_INTERVAL = 3 * ONE_SECOND;
const PLAYER_RESPAWN_INTERVAL = 150 * ONE_SECOND;
const RESTART_INTERVAL = 15 * ONE_SECOND;
const ENRAGE_TICK_INTERVAL = 60 * ONE_SECOND;

class CombatSimulator extends EventTarget {
    constructor(players, zone, options = {}) {
        super();
        this.players = players;
        this.zone = zone;
        this.eventQueue = new EventQueue();
        this.simResult = new SimResult(zone, players.length);
        this.allPlayersDead = false;
        this.enableHpMpVisualization = options.enableHpMpVisualization || false;

        this.wipeLogs = {
            buffer: new Array(200),
            index: 0,
            count: 0,
            maxSize: 200
        };
    }

        addToWipeLogs(logEntry) {
        const { buffer, maxSize } = this.wipeLogs;

        buffer[this.wipeLogs.index] = logEntry;
        this.wipeLogs.index = (this.wipeLogs.index + 1) % maxSize;
        this.wipeLogs.count = Math.min(this.wipeLogs.count + 1, maxSize);
    }

    logAndResetWipeLogs() {
        const logs = this.getOrderedWipeLogs();
        
        // console.log("===== 团灭日志 =====");
        // console.log(`最后 ${logs.length} 条战斗日志：`);
        
        logs.forEach(log => {
            if (log.error) {
                console.log(log.error);
                return;
            }
            
            const time = (log.time / 1e9).toFixed(2);
            // console.log(
            //     `[${time}s] [${log.source}] 用 [${log.ability}] ` +
            //     `对 ${log.target} 造成 ${log.damage} 伤害，` +
            //     `HP ${log.beforeHp} → ${log.afterHp}。` +
            //     `队伍生命值：${log.playersHp.map(p => `${p.hrid}: ${p.current}/${p.max}`).join(" | ")}`
            // );
        });

        this.wipeLogs.index = 0;
        this.wipeLogs.count = 0;
        // console.log("===== 团灭日志结束 =====");
    }
    
    buildCombatLog(source, ability, target, damageDone) {
        try {
            const sourceHrid = source?.hrid || "UNKNOWN_SOURCE";
            const targetHrid = target?.hrid || "UNKNOWN_TARGET";
            
            const afterHp = target?.combatDetails?.currentHitpoints || 0;
            const beforeHp = Math.max(0, afterHp + damageDone);

            const playersHp = this.players.map(p => ({
                hrid: p.hrid || "UNKNOWN_PLAYER",
                current: p.combatDetails?.currentHitpoints ?? 0,
                max: p.combatDetails?.maxHitpoints ?? 0
            }));
            
            return {
                time: this.simulationTime,
                wave: (this.zone.encountersKilled - 1),
                source: sourceHrid,
                ability: ability,
                target: targetHrid,
                damage: damageDone,
                beforeHp: beforeHp,
                afterHp: afterHp,
                playersHp: playersHp,
                // enemiesHp: enemiesHp,
                isCrit: false,
            };
        } catch (e) {
            return {
                error: `[日志生成错误] ${e.message}`
            };
        }
    }

    generateCombatLog(source, ability, target, attackResult) {
        try {
            const sourceHrid = source?.hrid || "UNKNOWN_SOURCE";
            const targetHrid = target?.hrid || "UNKNOWN_TARGET";
            const damage = attackResult?.damageDone || 0;
            
            const afterHp = target?.combatDetails?.currentHitpoints || 0;
            const beforeHp = Math.max(0, afterHp + damage);

            const playersHp = this.players.map(p => ({
                hrid: p.hrid || "UNKNOWN_PLAYER",
                current: p.combatDetails?.currentHitpoints ?? 0,
                max: p.combatDetails?.maxHitpoints ?? 0
            }));
            
            return {
                time: this.simulationTime,
                wave: (this.zone.encountersKilled - 1),
                source: sourceHrid,
                ability: ability,
                target: targetHrid,
                damage: damage,
                beforeHp: beforeHp,
                afterHp: afterHp,
                playersHp: playersHp,
                // enemiesHp: enemiesHp,
                isCrit: attackResult?.isCrit || false,
            };
        } catch (e) {
            return {
                error: `[日志生成错误] ${e.message}`
            };
        }
    }
    
    getOrderedWipeLogs() {
        const { buffer, maxSize, count } = this.wipeLogs;
        const logs = [];
        
        for (let i = 0; i < count; i++) {
            const idx = (this.wipeLogs.index - count + maxSize + i) % maxSize;
            logs.push(buffer[idx]);
        }
        
        return logs;
    }

    saveWipeLogsToSimResult(wave) {
        const logs = this.getOrderedWipeLogs();
        this.simResult.addWipeEvent(logs, this.simulationTime, wave);
    }

    async simulate(simulationTimeLimit) {
        this.reset();

        let ticks = 0;

        let combatStartEvent = new CombatStartEvent(0);
        this.eventQueue.addEvent(combatStartEvent);

        while (this.simulationTime < simulationTimeLimit) {
            let nextEvent = this.eventQueue.getNextEvent();
            await this.processEvent(nextEvent);

            ticks++;
            if (ticks == 1000) {
                ticks = 0;
                // 收集HP/MP时序数据
                if (this.enableHpMpVisualization) {
                    this.simResult.addTimeSeriesSnapshot(this.simulationTime, this.players);
                }
                let progressEvent = new CustomEvent("progress", {
                    detail: {
                        zone: this.zone.hrid,
                        difficultyTier: this.zone.difficultyTier,
                        progress: Math.min(this.simulationTime / simulationTimeLimit, 1),
                        timeSeriesData: this.enableHpMpVisualization ? this.simResult.timeSeriesData : null
                    },
                });
                this.dispatchEvent(progressEvent);
            }
        }

        // for (let i = 0; i < this.simResult.timeSpentAlive.length; i++) {
        //     if (this.simResult.timeSpentAlive[i].alive == true) {
        //         this.simResult.updateTimeSpentAlive(this.simResult.timeSpentAlive[i].name, false, simulationTimeLimit);
        //     }
        // }

        this.simResult.isDungeon = this.zone.isDungeon;
        if (this.simResult.isDungeon) {
            console.log("Timeout now at wave #" + (this.zone.encountersKilled - 1));

            this.simResult.dungeonsCompleted = this.zone.dungeonsCompleted;
            this.simResult.dungeonsFailed = this.zone.dungeonsFailed;
            if (this.simResult.dungeonsCompleted < 1) {
                this.simResult.maxWaveReached = 0;
                for (let i = 0; i <= this.zone.dungeonSpawnInfo.maxWaves; i++) {
                    let waveName = "#" + i.toString();
                    const idx = this.simResult.timeSpentAlive.findIndex(e => e.name === waveName);
                    if (idx == -1 || this.simResult.timeSpentAlive[idx].count == 0) {
                        break;
                    }
                    this.simResult.maxWaveReached = i;
                }
            } else {
                this.simResult.maxWaveReached = this.zone.dungeonSpawnInfo.maxWaves;
            }
        }
        this.simResult.simulatedTime = this.simulationTime;
        
        for (let i = 0; i < this.players.length; i++) {
            this.simResult.setDropRateMultipliers(this.players[i]);
            this.simResult.setManaUsed(this.players[i]);
        }

        if (this.zone.isDungeon) {
            Object.entries(this.zone.dungeonSpawnInfo.fixedSpawnsMap).forEach(([wave, monsters]) => {
                let waveName = "#" + wave.toString();
                monsters.forEach(monster => {
                    waveName += ',' + monster.combatMonsterHrid;
                });
                this.simResult.bossSpawns.push(waveName);
            });

        }
        if (this.zone.monsterSpawnInfo.bossSpawns) {
            for (const boss of this.zone.monsterSpawnInfo.bossSpawns) {
                this.simResult.bossSpawns.push(boss.combatMonsterHrid);
            }
        }

        return this.simResult;
    }

    reset() {
        this.tempDungeonCount = 0;
        this.simulationTime = 0;
        this.eventQueue.clear();
        this.simResult = new SimResult(this.zone, this.players.length);
    }

    async processEvent(event) {
        this.simulationTime = event.time;

        // console.log(this.simulationTime / 1e9, event.type, event);

        switch (event.type) {
            case CombatStartEvent.type:
                this.processCombatStartEvent(event);
                break;
            case PlayerRespawnEvent.type:
                this.processPlayerRespawnEvent(event);
                break;
            case EnemyRespawnEvent.type:
                this.processEnemyRespawnEvent(event);
                break;
            case AutoAttackEvent.type:
                this.processAutoAttackEvent(event);
                break;
            case ConsumableTickEvent.type:
                this.processConsumableTickEvent(event);
                break;
            case DamageOverTimeEvent.type:
                this.processDamageOverTimeTickEvent(event);
                break;
            case CheckBuffExpirationEvent.type:
                this.processCheckBuffExpirationEvent(event);
                break;
            case RegenTickEvent.type:
                this.processRegenTickEvent(event);
                break;
            case StunExpirationEvent.type:
                this.processStunExpirationEvent(event);
                break;
            case BlindExpirationEvent.type:
                this.processBlindExpirationEvent(event);
                break;
            case SilenceExpirationEvent.type:
                this.processSilenceExpirationEvent(event);
                break;
            case CurseExpirationEvent.type:
                this.processCurseExpirationEvent(event);
                break;
            case WeakenExpirationEvent.type:
                this.processWeakenExpirationEvent(event);
                break;
            case FuryExpirationEvent.type:
                this.processFuryExpirationEvent(event);
                break;
            case EnrageTickEvent.type:
                this.processEnrageTickEvent(event);
                break;
            case AbilityCastEndEvent.type:
                this.tryUseAbility(event.source, event.ability);
                break;
            case AwaitCooldownEvent.type:
                // console.log("Await CD " + (this.simulationTime / 1000000000));
                this.addNextAttackEvent(event.source);
                break;
            case CooldownReadyEvent.type:
                // Only used to check triggers
                break;
        }

        this.checkTriggers();
    }

    processCombatStartEvent(event) {
        // console.log("Combat Start " + (this.simulationTime / 1000000000));
        for (let i = 0; i < this.players.length; i++) {
            if (event.time == 0) { // First combat start event
                this.players[i].generatePermanentBuffs();
            }
            this.players[i].reset(this.simulationTime);
        }
        let regenTickEvent = new RegenTickEvent(this.simulationTime + REGEN_TICK_INTERVAL);
        this.eventQueue.addEvent(regenTickEvent);

        this.startNewEncounter();
    }

    processPlayerRespawnEvent(event) {
        // console.log("Player " + event.hrid + " respawn at " + + (this.simulationTime / 1000000000));
        let respawningPlayer = this.players.find(player => player.hrid === event.hrid);
        respawningPlayer.combatDetails.currentHitpoints = respawningPlayer.combatDetails.maxHitpoints;
        respawningPlayer.combatDetails.currentManapoints = respawningPlayer.combatDetails.maxManapoints;
        respawningPlayer.clearBuffs();
        respawningPlayer.clearCCs();
        if (this.allPlayersDead) {
            this.allPlayersDead = false;
            this.startAttacks();
        } else {
            this.addNextAttackEvent(respawningPlayer);
        }
    }

    processEnemyRespawnEvent(event) {
        this.startNewEncounter();
    }

    startNewEncounter() {
        if (this.allPlayersDead) {
            this.allPlayersDead = false;
            this.zone.failWave();
        }

        if (!this.zone.isDungeon) {
            this.enemies = this.zone.getRandomEncounter();
        } else {
            this.enemies = this.zone.getNextWave();
            this.simResult.updateTimeSpentAlive("#" + (this.zone.encountersKilled - 1).toString(), true, this.simulationTime);
            let currentDungeonCount = this.zone.dungeonsCompleted;
            // console.log('wave at #' + (this.zone.encountersKilled - 1) +' completed:' + this.zone.dungeonsCompleted + ' failed:'+ this.zone.dungeonsFailed + ' temp:'+ this.tempDungeonCount);
            if (currentDungeonCount > this.tempDungeonCount) {
                this.tempDungeonCount = currentDungeonCount;
                for (let i = 0; i < this.players.length; i++) {
                    this.players[i].combatDetails.currentHitpoints = this.players[i].combatDetails.maxHitpoints;
                    this.players[i].combatDetails.currentManapoints = this.players[i].combatDetails.maxManapoints;
                    // this.simResult.playerRanOutOfMana[this.players[i].hrid] = false;
                }
            }
        }

        this.enemies.forEach((enemy) => {
            enemy.reset(this.simulationTime);
            this.simResult.updateTimeSpentAlive(enemy.hrid, true, this.simulationTime);
            //console.log(enemy.hrid, "spawned");
        });

        this.eventQueue.clearEventsOfType(EnrageTickEvent.type);
        let enrageTickEvent = new EnrageTickEvent(this.simulationTime + ENRAGE_TICK_INTERVAL, ENRAGE_TICK_INTERVAL);
        this.eventQueue.addEvent(enrageTickEvent);
        this.enrageBeginTime = this.simulationTime;

        this.eventQueue.clearEventsOfType(AbilityCastEndEvent.type);

        this.startAttacks();
    }

    startAttacks() {
        let units = [...this.players];
        if (this.enemies) {
            units.push(...this.enemies);
        }

        for (const unit of units) {
            if (unit.combatDetails.currentHitpoints <= 0) {
                continue;
            }

            /*-if (unit.isPlayer) {
                // console.log("Start Attacks " + (this.simulationTime / 1000000000));
            }*/
            this.addNextAttackEvent(unit);
        }
    }

    checkParry(targets) {
        let parryUnits = targets.filter((unit) => unit && unit.combatDetails.currentHitpoints > 0 && unit.combatDetails.combatStats.parry > 0);
        if (parryUnits.length <= 0) {
            return undefined;
        }
        let randomIndex = Math.floor(Math.random() * parryUnits.length);
        if (parryUnits[randomIndex].combatDetails.combatStats.parry > Math.random()) {
            return parryUnits[randomIndex];
        }
        return undefined;
    }

    processAutoAttackEvent(event) {
        // console.log("source:", event.source.hrid);
        // console.log("aa " + (this.simulationTime / 1000000000));

        let targets = event.source.isPlayer ? this.enemies : this.players;

        if (!targets) {
            return;
        }

        const aliveTargets = targets.filter((unit) => unit && unit.combatDetails.currentHitpoints > 0);

        for (let i = 0; i < aliveTargets.length; i++) {
            let target = aliveTargets[i];
            if (!event.source.isPlayer && aliveTargets.length > 1) {
                let cumulativeThreat = 0;
                let cumulativeRanges = [];
                aliveTargets.forEach(player => {
                    let playerThreat = player.combatDetails.combatStats.threat;
                    cumulativeThreat += playerThreat;
                    cumulativeRanges.push({
                        player: player,
                        rangeStart: cumulativeThreat - playerThreat,
                        rangeEnd: cumulativeThreat
                    });
                });
                let randomValueHit = Math.random() * cumulativeThreat;
                target = cumulativeRanges.find(range => randomValueHit >= range.rangeStart && randomValueHit < range.rangeEnd).player;
            }
            let source = event.source;

            let parryTarget = this.checkParry(targets);
            if (parryTarget) {
                target = source;
                source = parryTarget;
            }

            let attackResult = CombatUtilities.processAttack(source, target);
            if (this.zone.isDungeon && target.isPlayer && attackResult.didHit && attackResult.damageDone > 0) {
                const log = this.generateCombatLog(source, "autoAttack", target, attackResult);
                this.addToWipeLogs(log);
            }

            let mayhem = source.combatDetails.combatStats.mayhem > Math.random();

            if (attackResult.didHit && source.combatDetails.combatStats.curse > 0) {
                const curseExpireTime = 15000000000;
                let currentCurseEvent = this.eventQueue.getMatching((event) => event.type == CurseExpirationEvent.type && event.source == target);
                let currentCurseAmount = 0;
                if (currentCurseEvent) currentCurseAmount = currentCurseEvent.curseAmount;
                this.eventQueue.clearMatching((event) => event.type == CurseExpirationEvent.type && event.source == target);

                let curseExpirationEvent = new CurseExpirationEvent(this.simulationTime + curseExpireTime, currentCurseAmount, target);
                const curseBuff = {
                    "uniqueHrid": "/buff_uniques/curse",
                    "typeHrid": "/buff_types/damage_taken",
                    "ratioBoost": 0,
                    "ratioBoostLevelBonus": 0,
                    "flatBoost": source.combatDetails.combatStats.curse * curseExpirationEvent.curseAmount,
                    "flatBoostLevelBonus": 0,
                    "startTime": "0001-01-01T00:00:00Z",
                    "duration": curseExpireTime
                };
                target.addBuff(curseBuff);
                this.eventQueue.addEvent(curseExpirationEvent);
            }

            if (source.combatDetails.combatStats.fury > 0) {
                let currentFuryEvent = this.eventQueue.getMatching((event) => event.type == FuryExpirationEvent.type && event.source == source);
                this.eventQueue.clearMatching((event) => event.type == FuryExpirationEvent.type && event.source == source);

                const furyExpireTime = 15000000000;
                const maxFuryStack = 5;

                let furyAmount = 0;
                if (currentFuryEvent) furyAmount = currentFuryEvent.furyAmount;

                if (attackResult.didHit) {
                    furyAmount = Math.min(furyAmount + 1, maxFuryStack);
                } else {
                    furyAmount = Math.floor(furyAmount / 2);
                }

                const furyAccuracyBuf = {
                    "uniqueHrid": "/buff_uniques/fury_accuracy",
                    "typeHrid": "/buff_types/fury_accuracy",
                    "ratioBoost": furyAmount * source.combatDetails.combatStats.fury,
                    "ratioBoostLevelBonus": 0,
                    "flatBoost": 0,
                    "flatBoostLevelBonus": 0,
                    "startTime": "0001-01-01T00:00:00Z",
                    "duration": furyExpireTime
                };
                const furyDamageBuf = {
                    "uniqueHrid": "/buff_uniques/fury_damage",
                    "typeHrid": "/buff_types/fury_damage",
                    "ratioBoost": furyAmount * source.combatDetails.combatStats.fury,
                    "ratioBoostLevelBonus": 0,
                    "flatBoost": 0,
                    "flatBoostLevelBonus": 0,
                    "startTime": "0001-01-01T00:00:00Z",
                    "duration": furyExpireTime
                };

                if (furyAmount > 0) {
                    let furyExpirationEvent = new FuryExpirationEvent(this.simulationTime + furyExpireTime, furyAmount, source);
                    this.eventQueue.addEvent(furyExpirationEvent);

                    source.addBuff(furyAccuracyBuf, this.simulationTime);
                    source.addBuff(furyDamageBuf, this.simulationTime);
                }
                else {
                    source.removeBuff(furyAccuracyBuf);
                    source.removeBuff(furyDamageBuf);
                }
            }

            if (target.combatDetails.combatStats.weaken > 0) {
                const weakenExpireTime = 15000000000;
                let currentWeakenEvent = this.eventQueue.getMatching((event) => event.type == WeakenExpirationEvent.type && event.source == source);
                let weakenAmount = 0;
                if (currentWeakenEvent)
                    weakenAmount = currentWeakenEvent.weakenAmount;
                this.eventQueue.clearMatching((event) => event.type == WeakenExpirationEvent.type && event.source == source);
                let weakenExpirationEvent = new WeakenExpirationEvent(this.simulationTime + 15000000000, weakenAmount, source);
                const weakenBuff = {
                    "uniqueHrid": "/buff_uniques/weaken",
                    "typeHrid": "/buff_types/damage",
                    "ratioBoost": -1 * target.combatDetails.combatStats.weaken * weakenExpirationEvent.weakenAmount,
                    "ratioBoostLevelBonus": 0,
                    "flatBoost": 0,
                    "flatBoostLevelBonus": 0,
                    "startTime": "0001-01-01T00:00:00Z",
                    "duration": weakenExpireTime
                };
                source.addBuff(weakenBuff);
                this.eventQueue.addEvent(weakenExpirationEvent);
            }

            if (!mayhem || (mayhem && attackResult.didHit) || (mayhem && i == (aliveTargets.length - 1))) {
                let attackType = "autoAttack";
                if (parryTarget) attackType = "parry";
                this.simResult.addAttack(
                    source,
                    target,
                    "autoAttack",
                    attackResult.didHit ? attackResult.damageDone : "miss"
                );
            }

            if (attackResult.lifeStealHeal > 0) {
                this.simResult.addHitpointsGained(source, "lifesteal", attackResult.lifeStealHeal);
            }

            if (attackResult.manaLeechMana > 0) {
                this.simResult.addManapointsGained(source, "manaLeech", attackResult.manaLeechMana);
            }

            if (attackResult.thornDamageDone > 0) {
                this.simResult.addAttack(target, source, attackResult.thornType, attackResult.thornDamageDone);
            }
            if (this.zone.isDungeon && attackResult.thornDamageDone > 0 && source.isPlayer) {
                const log = this.buildCombatLog(target, attackResult.thornType, source, attackResult.thornDamageDone);
                this.addToWipeLogs(log);
            }

            if (target.combatDetails.combatStats.retaliation > 0) {
                this.simResult.addAttack(target, source, "retaliation", attackResult.retaliationDamageDone > 0?attackResult.retaliationDamageDone:"miss");
            }
            if (this.zone.isDungeon && attackResult.retaliationDamageDone > 0 && source.isPlayer) {
                const log = this.buildCombatLog(target, "retaliation", source, attackResult.retaliationDamageDone);
                this.addToWipeLogs(log);
            }

            if (target.combatDetails.currentHitpoints == 0) {
                this.eventQueue.clearEventsForUnit(target);
                this.simResult.addDeath(target);
                if (!target.isPlayer) {
                    this.simResult.updateTimeSpentAlive(target.hrid, false, this.simulationTime);
                }
                // console.log(target.hrid, "died");
            }

            // Could die from reflect damage
            if (source.combatDetails.currentHitpoints == 0 && 
                (attackResult.thornDamageDone != 0 || attackResult.retaliationDamageDone != 0)
            ) {
                this.eventQueue.clearEventsForUnit(source);
                this.simResult.addDeath(source);
                if (!source.isPlayer) {
                    this.simResult.updateTimeSpentAlive(source.hrid, false, this.simulationTime);
                }
                break;
            }

            if (mayhem && !attackResult.didHit) {
                continue;
            }

            if (!attackResult.didHit || parryTarget || source.combatDetails.combatStats.pierce <= Math.random()) {
                break;
            }
        }

        if (!this.checkEncounterEnd()) {
            // console.log("!EncounterEnd " + (this.simulationTime / 1000000000));
            this.addNextAttackEvent(event.source);
        }
    }

    checkEncounterEnd() {
        if (this.enemies) {
            let deadEnemies = this.enemies.filter((enemy) => enemy.combatDetails.currentHitpoints <= 0 && enemy.experienceRate == 0);
            if (deadEnemies.length > 0) {
                deadEnemies.forEach(enemy => {
                    let aliveDuration = this.simulationTime - this.enrageBeginTime;
                    if (aliveDuration > enemy.enrageTime) {
                        aliveDuration = enemy.enrageTime;
                    }
                    enemy.experienceRate = 1.0 + aliveDuration / enemy.enrageTime;
                    // console.log(enemy.hrid, "alive duration", aliveDuration, "exp rate", enemy.experienceRate);
                })
            }
        }

        let encounterEnded = false;

        if (this.enemies && !this.enemies.some((enemy) => enemy.combatDetails.currentHitpoints > 0)) {
            this.eventQueue.clearEventsOfType(AutoAttackEvent.type);
            // this.eventQueue.clearEventsOfType(AbilityCastEndEvent.type);
            let enemyRespawnEvent = new EnemyRespawnEvent(this.simulationTime + ENEMY_RESPAWN_INTERVAL);
            this.eventQueue.addEvent(enemyRespawnEvent);

            //calc exp before clear
            if (this.enemies.some(enemy => enemy.experienceRate <= 0)) {
                console.log("WARN: Some enemies have no experience rate");
            }

            let totalExp = this.enemies.map(enemy => enemy.experience * enemy.experienceRate).reduce((a, b) => a + b, 0);
            this.players.forEach(player => {
                this.simResult.addExperienceGain(player, totalExp / this.players.length);
            });

            this.enemies = null;

            if (this.zone.isDungeon) {
                this.simResult.updateTimeSpentAlive("#" + (this.zone.encountersKilled - 1).toString(), false, this.simulationTime);
                if (this.zone.encountersKilled > this.zone.dungeonSpawnInfo.maxWaves) {
                    this.simResult.updateDungenonFinish("#1", this.simulationTime);
                }
            }
            this.simResult.addEncounterEnd();
            // console.log("All enemies died");

            encounterEnded = true;
            // console.log("encounter end " + (this.simulationTime / 1000000000))
        }

        this.players.forEach(player => {
            if ((player.combatDetails.currentHitpoints <= 0) && !this.eventQueue.containsEventOfTypeAndHrid(PlayerRespawnEvent.type, player.hrid)) {
                if (!this.zone.isDungeon) {
                    let playerRespawnEvent = new PlayerRespawnEvent(this.simulationTime + PLAYER_RESPAWN_INTERVAL, player.hrid);
                    this.eventQueue.addEvent(playerRespawnEvent);
                }
                this.simResult.addRanOutOfManaCount(player, false, this.simulationTime);
                // console.log(player.hrid + " died at " + (this.simulationTime / 1000000000) + 'in wave #' + (this.zone.encountersKilled - 1) + ' with ememies: ' + this.enemies?.map(enemy => (enemy.hrid+"("+(enemy.combatDetails.currentHitpoints*100/enemy.combatDetails.maxHitpoints).toFixed(2)+"%)")).join(", "));
            }
        });

        if (
            !this.players.some((player) => player.combatDetails.currentHitpoints > 0)
        ) {
            if (this.zone.isDungeon) {
                console.log("All Players died at wave #" + (this.zone.encountersKilled - 1) + " with ememies: " + this.enemies.map(enemy => (enemy.hrid+"("+(enemy.combatDetails.currentHitpoints*100/enemy.combatDetails.maxHitpoints).toFixed(2)+"%)")).join(", "));

                this.saveWipeLogsToSimResult(this.zone.encountersKilled - 1);
                // console.log(this.simResult)
                this.wipeLogs.index = 0;
                this.wipeLogs.count = 0;

                this.eventQueue.clear();
                this.enemies = null;

                let combatStartEvent = new CombatStartEvent(this.simulationTime + RESTART_INTERVAL);
                this.eventQueue.addEvent(combatStartEvent);
            } else {
                this.eventQueue.clearEventsOfType(AutoAttackEvent.type);
                this.eventQueue.clearEventsOfType(AbilityCastEndEvent.type);
            }
            // console.log("All Players died");
            encounterEnded = true;
            this.allPlayersDead = true;
        }

        return encounterEnded;
    }

    addNextAttackEvent(source) {
        if (this.eventQueue.getMatching((event) => (event.type == AbilityCastEndEvent.type || event.type == AutoAttackEvent.type)&& event.source == source)) {
            return;
        }

        let target;
        let friendlies;
        let enemies;
        if (source.isPlayer) {
            target = CombatUtilities.getTarget(this.enemies);
            friendlies = this.players;
            enemies = this.enemies;
        } else {
            target = CombatUtilities.getTarget(this.players);
            friendlies = this.enemies;
            enemies = this.players;
        }

        let usedAbility = false;
        let skipNextAbility = false; 

        source.abilities
            .filter((ability) => ability != null)
            .forEach((ability) => {
                if (!usedAbility && !skipNextAbility && ability.shouldTrigger(this.simulationTime, source, target, friendlies, enemies)) {
                    if (!this.canUseAbility(source, ability, true)) {
                        skipNextAbility = true;
                    }

                    if (!skipNextAbility) {
                        let castDuration = ability.castDuration;
                        castDuration /= (1 + source.combatDetails.combatStats.castSpeed)
                        let abilityCastEndEvent = new AbilityCastEndEvent(this.simulationTime + castDuration, source, ability);
                        this.eventQueue.addEvent(abilityCastEndEvent);
                        /*-if (source.isPlayer) {
                            let haste = source.combatDetails.combatStats.abilityHaste;
                            let cooldownDuration = ability.cooldownDuration;
                            if (haste > 0) {
                                cooldownDuration = cooldownDuration * 100 / (100 + haste);
                            }
                            // console.log((this.simulationTime / 1000000000) + " Casting " + ability.hrid + " Cast time " + (castDuration / 1e9) + " Off CD at " + ((this.simulationTime + cooldownDuration + castDuration) / 1e9) + " CD " + ((cooldownDuration) / 1e9));
                        }*/
                        usedAbility = true;
                    }
                }
            });

        if (usedAbility) {
            source.isOutOfMana = false;
            return;
        }

        if (!enemies) {
            return;
        }

        if (!source.isBlinded) {
            let autoAttackEvent = new AutoAttackEvent(
                this.simulationTime + source.combatDetails.combatStats.attackInterval,
                source
            );
            /*-if (source.isPlayer) {
                // console.log("next attack " + ((this.simulationTime + source.combatDetails.combatStats.attackInterval) / 1e9))
            }*/
            this.eventQueue.addEvent(autoAttackEvent);
        } else {
            source.isOutOfMana = true;
        }
    }

    processConsumableTickEvent(event) {
        if (event.consumable.hitpointRestore > 0) {
            let tickValue = CombatUtilities.calculateTickValue(
                event.consumable.hitpointRestore,
                event.totalTicks,
                event.currentTick
            );
            let hitpointsAdded = event.source.addHitpoints(tickValue);
            this.simResult.addHitpointsGained(event.source, event.consumable.hrid, hitpointsAdded);
            // console.log("Added hitpoints:", hitpointsAdded);
        }

        if (event.consumable.manapointRestore > 0) {
            let tickValue = CombatUtilities.calculateTickValue(
                event.consumable.manapointRestore,
                event.totalTicks,
                event.currentTick
            );
            let manapointsAdded = event.source.addManapoints(tickValue);
            this.simResult.addManapointsGained(event.source, event.consumable.hrid, manapointsAdded);
            // console.log("Added manapoints:", manapointsAdded);

            // when oom check ability trigger
            if (event.source.isOutOfMana) {
                let awaitCooldownEvent = new AwaitCooldownEvent(
                    this.simulationTime,
                    event.source
                );
                this.eventQueue.addEvent(awaitCooldownEvent);
            }
        }

        if (event.currentTick < event.totalTicks) {
            let consumableTickEvent = new ConsumableTickEvent(
                this.simulationTime + HOT_TICK_INTERVAL,
                event.source,
                event.consumable,
                event.totalTicks,
                event.currentTick + 1
            );
            this.eventQueue.addEvent(consumableTickEvent);
        }
    }

    processDamageOverTimeTickEvent(event) {
        let tickDamage = CombatUtilities.calculateTickValue(event.damage, event.totalTicks, event.currentTick);
        let damage = Math.min(tickDamage, event.target.combatDetails.currentHitpoints);

        event.target.combatDetails.currentHitpoints -= damage;
        this.simResult.addAttack(event.sourceRef, event.target, "damageOverTime", damage);

        const log = this.buildCombatLog("", "damageOverTime", event.target, damage);
        this.addToWipeLogs(log);

        // console.log(event.target.hrid, "bleed for", damage);

        if (event.currentTick < event.totalTicks) {
            let damageOverTimeTickEvent = new DamageOverTimeEvent(
                this.simulationTime + DOT_TICK_INTERVAL,
                event.sourceRef,
                event.target,
                event.damage,
                event.totalTicks,
                event.currentTick + 1,
                event.combatStyleHrid
            );
            this.eventQueue.addEvent(damageOverTimeTickEvent);
        }

        if (event.target.combatDetails.currentHitpoints == 0) {
            this.eventQueue.clearEventsForUnit(event.target);
            this.simResult.addDeath(event.target);
            if (!event.target.isPlayer) {
                this.simResult.updateTimeSpentAlive(event.target.hrid, false, this.simulationTime);
            }
        }

        this.checkEncounterEnd();
    }

    processRegenTickEvent(event) {
        let units = [...this.players];

        // regen of emeny always set to 0, ingore the proc time
        // if (this.enemies) {
        //     units.push(...this.enemies);
        // }

        for (const unit of units) {
            if (unit.combatDetails.currentHitpoints <= 0) {
                continue;
            }

            let hitpointRegen = Math.floor(unit.combatDetails.maxHitpoints * unit.combatDetails.combatStats.hpRegenPer10);
            let hitpointsAdded = unit.addHitpoints(hitpointRegen);
            this.simResult.addHitpointsGained(unit, "regen", hitpointsAdded);
            // console.log("Added hitpoints:", hitpointsAdded);

            let manapointRegen = Math.floor(unit.combatDetails.maxManapoints * unit.combatDetails.combatStats.mpRegenPer10);
            let manapointsAdded = unit.addManapoints(manapointRegen);
            this.simResult.addManapointsGained(unit, "regen", manapointsAdded);
            // console.log("Added manapoints:", manapointsAdded);

            // when oom check ability trigger
            if (unit.isOutOfMana) {
                let awaitCooldownEvent = new AwaitCooldownEvent(
                    this.simulationTime,
                    unit
                );
                this.eventQueue.addEvent(awaitCooldownEvent);
            }
        }

        let regenTickEvent = new RegenTickEvent(this.simulationTime + REGEN_TICK_INTERVAL);
        this.eventQueue.addEvent(regenTickEvent);
    }

    processCheckBuffExpirationEvent(event) {
        event.source.removeExpiredBuffs(this.simulationTime);
    }

    processStunExpirationEvent(event) {
        event.source.isStunned = false;
        // console.log("Stun " + (this.simulationTime / 1000000000));
        this.addNextAttackEvent(event.source);
    }

    processBlindExpirationEvent(event) {
        event.source.isBlinded = false;
        this.addNextAttackEvent(event.source);
    }

    processSilenceExpirationEvent(event) {
        event.source.isSilenced = false;
    }

    processCurseExpirationEvent(event) {
        event.source.removeExpiredBuffs(this.simulationTime);
    }

    processWeakenExpirationEvent(event) {
        event.source.removeExpiredBuffs(this.simulationTime);
    }

    processFuryExpirationEvent(event) {
        event.source.removeExpiredBuffs(this.simulationTime);
        console.log("Fury Timeout");
    }

    processEnrageTickEvent(event) {
        if (!this.enemies) return;
        const maxEnrageStack = 10;
        this.enemies.filter((enemy) => enemy.combatDetails.currentHitpoints > 0).forEach((enemy) => {
            let nowStack = Math.min(maxEnrageStack, Math.floor(event.encounterTime / enemy.enrageTime));

            if (nowStack <= 0) {
                return;
            }

            console.log(enemy.hrid, nowStack, " stack Enrage at ", (event.encounterTime / ONE_SECOND));

            const enrageDamageBuff = {
                    "uniqueHrid": "/buff_uniques/enrage_damage",
                    "typeHrid": "/buff_types/damage",
                    "ratioBoost": nowStack * 0.1,
                    "ratioBoostLevelBonus": 0,
                    "flatBoost": 0,
                    "flatBoostLevelBonus": 0,
                    "startTime": "0001-01-01T00:00:00Z",
                    "duration": ENRAGE_TICK_INTERVAL
            };
            const enrageAccuracyBuff = {
                    "uniqueHrid": "/buff_uniques/enrage_accuracy",
                    "typeHrid": "/buff_types/accuracy",
                    "ratioBoost": nowStack * 0.1,
                    "ratioBoostLevelBonus": 0,
                    "flatBoost": 0,
                    "flatBoostLevelBonus": 0,
                    "startTime": "0001-01-01T00:00:00Z",
                    "duration": ENRAGE_TICK_INTERVAL
            };
            enemy.addBuff(enrageDamageBuff);
            enemy.addBuff(enrageAccuracyBuff);
            
            this.simResult.maxEnrageStack = Math.max(this.simResult.maxEnrageStack, nowStack);
        });

        let enrageTickEvent = new EnrageTickEvent(this.simulationTime + ENRAGE_TICK_INTERVAL, event.encounterTime + ENRAGE_TICK_INTERVAL);
        this.eventQueue.addEvent(enrageTickEvent);
    }

    checkTriggers() {
        let triggeredSomething;

        do {
            triggeredSomething = false;

            this.players
                .filter((player) => player.combatDetails.currentHitpoints > 0)
                .forEach((player) => {
                    if (this.checkTriggersForUnit(player, this.players, this.enemies)) {
                        triggeredSomething = true;
                    }
                });

            if (this.enemies) {
                this.enemies
                    .filter((enemy) => enemy.combatDetails.currentHitpoints > 0)
                    .forEach((enemy) => {
                        if (this.checkTriggersForUnit(enemy, this.enemies, this.players)) {
                            triggeredSomething = true;
                        }
                    });
            }
        } while (triggeredSomething);
    }

    checkTriggersForUnit(unit, friendlies, enemies) {
        if (unit.combatDetails.currentHitpoints <= 0) {
            throw new Error("Checking triggers for a dead unit");
        }

        let triggeredSomething = false;
        let target = CombatUtilities.getTarget(enemies);

        for (const food of unit.food) {
            if (food && food.shouldTrigger(this.simulationTime, unit, target, friendlies, enemies)) {
                let result = this.tryUseConsumable(unit, food);
                if (result) {
                    triggeredSomething = true;
                }
            }
        }

        for (const drink of unit.drinks) {
            if (drink && drink.shouldTrigger(this.simulationTime, unit, target, friendlies, enemies)) {
                let result = this.tryUseConsumable(unit, drink);
                if (result) {
                    triggeredSomething = true;
                }
            }
        }

        return triggeredSomething;
    }

    tryUseConsumable(source, consumable) {
        // console.log("Consuming:", consumable);

        if (source.combatDetails.currentHitpoints <= 0) {
            return false;
        }

        consumable.lastUsed = this.simulationTime;
        let consumeCooldown = consumable.cooldownDuration;
        if (source.combatDetails.combatStats.drinkConcentration > 0 && consumable.catagoryHrid.includes("drink")) {
            consumeCooldown = consumeCooldown / (1 + source.combatDetails.combatStats.drinkConcentration);
        } else if (source.combatDetails.combatStats.foodHaste > 0 && consumable.catagoryHrid.includes("food")) {
            consumeCooldown = consumeCooldown / (1 + source.combatDetails.combatStats.foodHaste);
        }
        let cooldownReadyEvent = new CooldownReadyEvent(this.simulationTime + consumeCooldown);
        this.eventQueue.addEvent(cooldownReadyEvent);

        this.simResult.addConsumableUse(source, consumable);

        if (consumable.recoveryDuration == 0) {
            if (consumable.hitpointRestore > 0) {
                let hitpointsAdded = source.addHitpoints(consumable.hitpointRestore);
                this.simResult.addHitpointsGained(source, consumable.hrid, hitpointsAdded);
                // console.log("Added hitpoints:", hitpointsAdded);
            }

            if (consumable.manapointRestore > 0) {
                let manapointsAdded = source.addManapoints(consumable.manapointRestore);
                this.simResult.addManapointsGained(source, consumable.hrid, manapointsAdded);
                // console.log("Added manapoints:", manapointsAdded);

                // when oom check ability trigger
                if (source.isOutOfMana) {
                    let awaitCooldownEvent = new AwaitCooldownEvent(
                        this.simulationTime,
                        source
                    );
                    this.eventQueue.addEvent(awaitCooldownEvent);
                }
            }
        } else {
            let consumableTickEvent = new ConsumableTickEvent(
                this.simulationTime + HOT_TICK_INTERVAL,
                source,
                consumable,
                consumable.recoveryDuration / HOT_TICK_INTERVAL,
                1
            );
            this.eventQueue.addEvent(consumableTickEvent);
        }

        for (const buff of consumable.buffs) {
            let currentBuff = structuredClone(buff);
            if (source.combatDetails.combatStats.drinkConcentration > 0 && consumable.catagoryHrid.includes("drink")) {
                currentBuff.ratioBoost *= (1 + source.combatDetails.combatStats.drinkConcentration);
                currentBuff.flatBoost *= (1 + source.combatDetails.combatStats.drinkConcentration);
                currentBuff.duration = currentBuff.duration / (1 + source.combatDetails.combatStats.drinkConcentration);
            }
            source.addBuff(currentBuff, this.simulationTime);
            // console.log("Added buff:", currentBuff);
            let checkBuffExpirationEvent = new CheckBuffExpirationEvent(this.simulationTime + currentBuff.duration, source);
            this.eventQueue.addEvent(checkBuffExpirationEvent);
        }

        return true;
    }

    canUseAbility(source, ability, oomCheck) {
        if (source.combatDetails.currentHitpoints <= 0) {
            return false;
        }

        if (source.combatDetails.currentManapoints < ability.manaCost) {
            if (source.isPlayer && oomCheck) {
                // if (this.simResult.playerRanOutOfMana[source.hrid] == false) {
                //     console.log(source.hrid + " ran out of mana" + ' at wave #' + (this.zone.encountersKilled - 1) + ' at time ' + this.simulationTime / 1000000000 + 's');
                // }
                this.simResult.addRanOutOfManaCount(source, true, this.simulationTime);
            }
            return false;
        }
        if (source.isPlayer && oomCheck) {
            this.simResult.addRanOutOfManaCount(source, false, this.simulationTime);
        }
        return true;
    }

    tryUseAbility(source, ability) {

        if (!this.canUseAbility(source, ability, true)) {
            // console.log("Falseeeeeee");
            return false;
        }

        // console.log("Casting:", ability);

        if (source.isPlayer) {
            if (source.abilityManaCosts.has(ability.hrid)) {
                source.abilityManaCosts.set(ability.hrid, source.abilityManaCosts.get(ability.hrid) + ability.manaCost);
            } else {
                source.abilityManaCosts.set(ability.hrid, ability.manaCost);
            }
        }

        source.combatDetails.currentManapoints -= ability.manaCost;

        ability.lastUsed = this.simulationTime;

        let haste = source.combatDetails.combatStats.abilityHaste;
        let cooldownDuration = ability.cooldownDuration;
        if (haste > 0) {
            cooldownDuration = cooldownDuration * 100 / (100 + haste);
        }

        /*-if (source.isPlayer) {
            let castDuration = ability.castDuration;
            castDuration /= (1 + source.combatDetails.combatStats.castSpeed)
            // console.log((this.simulationTime / 1000000000) + " Used ability " + ability.hrid + " Cast time " + (castDuration / 1e9));
        }*/

        let todoAbilities = [ability];

        if (source.combatDetails.combatStats.blaze > 0 && Math.random() < source.combatDetails.combatStats.blaze) {
            todoAbilities.push(new Ability("blaze"));
        }

        if (source.combatDetails.combatStats.bloom > 0 && Math.random() < source.combatDetails.combatStats.bloom) {
            todoAbilities.push(new Ability("bloom"));
        }

        for (const todoAbility of todoAbilities) {
            for (const abilityEffect of todoAbility.abilityEffects) {
                switch (abilityEffect.effectType) {
                    case "/ability_effect_types/buff":
                        this.processAbilityBuffEffect(source, todoAbility, abilityEffect);
                        break;
                    case "/ability_effect_types/damage":
                        this.processAbilityDamageEffect(source, todoAbility, abilityEffect);
                        break;
                    case "/ability_effect_types/heal":
                        this.processAbilityHealEffect(source, todoAbility, abilityEffect);
                        break;
                    case "/ability_effect_types/spend_hp":
                        this.processAbilitySpendHpEffect(source, todoAbility, abilityEffect);
                        break;
                    case "/ability_effect_types/revive":
                        this.processAbilityReviveEffect(source, todoAbility, abilityEffect);
                        break;
                    case "/ability_effect_types/promote":
                        this.eventQueue.clearEventsForUnit(source);
                        source = this.processAbilityPromoteEffect(source, todoAbility, abilityEffect);
                        this.addNextAttackEvent(source);
                        break;
                    default:
                        throw new Error("Unsupported effect type for ability: " + todoAbility.hrid + " effectType: " + abilityEffect.effectType);
                }
            }
        }

        if (source.combatDetails.combatStats.ripple > 0 && Math.random() < source.combatDetails.combatStats.ripple) {
            let manapointsAdded = source.addManapoints(10);
            this.simResult.addManapointsGained(source, "ripple", manapointsAdded);
            for (const ability of source.abilities) {
                if (ability && ability.lastUsed) {
                    const remainingCooldown = ability.lastUsed + ability.cooldownDuration - this.simulationTime;
                    if (remainingCooldown > 0) {
                        ability.lastUsed = Math.max(ability.lastUsed - ONE_SECOND * 2, this.simulationTime - ability.cooldownDuration);
                    }
                }
            }
        }

        this.addNextAttackEvent(source);

        // Could die from reflect damage
        if (source.combatDetails.currentHitpoints == 0) {
            this.eventQueue.clearEventsForUnit(source);
            this.simResult.addDeath(source);
            if (!source.isPlayer) {
                this.simResult.updateTimeSpentAlive(source.hrid, false, this.simulationTime);
            }
        }

        this.checkEncounterEnd();

        return true;
    }

    processAbilityBuffEffect(source, ability, abilityEffect) {
        if (abilityEffect.targetType == "allAllies") {
            let targets = source.isPlayer ? this.players : this.enemies;
            for (const target of targets.filter((unit) => unit && unit.combatDetails.currentHitpoints > 0)) {
                for (const buff of abilityEffect.buffs) {
                    if (ability.isSpecialAbility && buff.multiplierForSkillHrid && buff.multiplierPerSkillLevel > 0) {
                        let multiplier = 1.0 + source.combatDetails[buff.multiplierForSkillHrid.split('/')[2] + 'Level'] * buff.multiplierPerSkillLevel;
                        let currentBuff = structuredClone(buff);
                        currentBuff.flatBoost *= multiplier;
                        target.addBuff(currentBuff, this.simulationTime);
                    } else {
                        target.addBuff(buff, this.simulationTime);
                    }
                    let checkBuffExpirationEvent = new CheckBuffExpirationEvent(this.simulationTime + buff.duration, target);
                    this.eventQueue.addEvent(checkBuffExpirationEvent);
                }
            }
            return;
        }

        if (abilityEffect.targetType != "self") {
            throw new Error("Unsupported target type for buff ability effect: " + ability.hrid);
        }

        for (const buff of abilityEffect.buffs) {
            source.addBuff(buff, this.simulationTime);
            // console.log("Added buff:", abilityEffect.buff);
            let checkBuffExpirationEvent = new CheckBuffExpirationEvent(this.simulationTime + buff.duration, source);
            this.eventQueue.addEvent(checkBuffExpirationEvent);
        }
    }

    processAbilityDamageEffect(source, ability, abilityEffect) {
        let targets;
        switch (abilityEffect.targetType) {
            case "enemy":
            case "allEnemies":
                targets = source.isPlayer ? this.enemies : this.players;
                break;
            default:
                throw new Error("Unsupported target type for damage ability effect: " + ability.hrid);
        }

        if (!targets) {
            return;
        }

        let avoidTarget = [];

        let isSkipParry = false;

        for (let target of targets.filter((unit) => unit && unit.combatDetails.currentHitpoints > 0)) {
            let parryTarget = undefined;
            if (!isSkipParry) {
                parryTarget = this.checkParry(targets);
                isSkipParry = true; //  parry check only once on first target
            }
            
            if (parryTarget) {
                let tempTarget = source;
                let tempSource = parryTarget;

                let attackResult = CombatUtilities.processAttack(tempSource, tempTarget);

                this.simResult.addAttack(
                    tempSource,
                    tempTarget,
                    "parry",
                    attackResult.didHit ? attackResult.damageDone : "miss"
                );

                if (attackResult.lifeStealHeal > 0) {
                    this.simResult.addHitpointsGained(tempSource, "lifesteal", attackResult.lifeStealHeal);
                }

                if (attackResult.manaLeechMana > 0) {
                    this.simResult.addManapointsGained(tempSource, "manaLeech", attackResult.manaLeechMana);
                }

                if (attackResult.thornDamageDone > 0) {
                    this.simResult.addAttack(tempTarget, tempSource, attackResult.thornType, attackResult.thornDamageDone);
                }
                if (tempTarget.combatDetails.combatStats.retaliation > 0) {
                    this.simResult.addAttack(tempTarget, tempSource, "retaliation", attackResult.retaliationDamageDone > 0 ? attackResult.retaliationDamageDone : "miss");
                }

                if (tempTarget.combatDetails.currentHitpoints == 0) {
                    this.eventQueue.clearEventsForUnit(tempTarget);
                    this.simResult.addDeath(tempTarget);
                    if (!tempTarget.isPlayer) {
                        this.simResult.updateTimeSpentAlive(tempTarget.hrid, false, this.simulationTime);
                    }
                    // console.log(tempTarget.hrid, "died");
                }

                // Could die from reflect damage
                if (tempSource.combatDetails.currentHitpoints == 0 && 
                    (attackResult.thornDamageDone != 0 || attackResult.retaliationDamageDone != 0)
                ) {
                    this.eventQueue.clearEventsForUnit(tempSource);
                    this.simResult.addDeath(tempSource);
                    if (!tempSource.isPlayer) {
                        this.simResult.updateTimeSpentAlive(tempSource.hrid, false, this.simulationTime);
                    }
                }
            } else {
                targets = targets.filter((unit) => unit && !avoidTarget.includes(unit.hrid) && unit.combatDetails.currentHitpoints > 0);
                if (!source.isPlayer && targets.length > 0 && abilityEffect.targetType == "enemy") {
                    let cumulativeThreat = 0;
                    let cumulativeRanges = [];
                    targets.forEach(player => {
                        let playerThreat = player.combatDetails.combatStats.threat;
                        cumulativeThreat += playerThreat;
                        cumulativeRanges.push({
                            player: player,
                            rangeStart: cumulativeThreat - playerThreat,
                            rangeEnd: cumulativeThreat
                        });
                    });
                    let randomValueHit = Math.random() * cumulativeThreat;
                    target = cumulativeRanges.find(range => randomValueHit >= range.rangeStart && randomValueHit < range.rangeEnd).player;
                    avoidTarget.push(target.hrid);
                }
                if (targets.length <= 0) {
                    break;
                }

                let attackResult = CombatUtilities.processAttack(source, target, abilityEffect);

                if (this.zone.isDungeon && target.isPlayer && attackResult.didHit && attackResult.damageDone > 0) {
                    const log = this.generateCombatLog(source, ability.hrid, target, attackResult);
                    this.addToWipeLogs(log);
                }

                if (attackResult.hpDrain > 0) {
                    this.simResult.addHitpointsGained(source, ability.hrid, attackResult.hpDrain);
                }

                if (attackResult.didHit && abilityEffect.buffs) {
                    for (const buff of abilityEffect.buffs) {
                        target.addBuff(buff, this.simulationTime);
                        let checkBuffExpirationEvent = new CheckBuffExpirationEvent(
                            this.simulationTime + buff.duration,
                            target
                        );
                        this.eventQueue.addEvent(checkBuffExpirationEvent);
                    }
                }

                if (abilityEffect.damageOverTimeRatio > 0 && attackResult.damageDone > 0) {
                    let damageOverTimeEvent = new DamageOverTimeEvent(
                        this.simulationTime + DOT_TICK_INTERVAL,
                        source,
                        target,
                        attackResult.damageDone * abilityEffect.damageOverTimeRatio,
                        abilityEffect.damageOverTimeDuration / DOT_TICK_INTERVAL,
                        1, abilityEffect.combatStyleHrid
                    );
                    this.eventQueue.addEvent(damageOverTimeEvent);
                }

                if (attackResult.didHit && abilityEffect.stunChance > 0 && Math.random() < (abilityEffect.stunChance * 100 / (100 + target.combatDetails.combatStats.tenacity))) {
                    target.isStunned = true;
                    target.stunExpireTime = this.simulationTime + abilityEffect.stunDuration;
                    this.eventQueue.clearMatching((event) => (event.type == AutoAttackEvent.type || event.type == AbilityCastEndEvent.type || event.type == StunExpirationEvent.type) && event.source == target);
                    let stunExpirationEvent = new StunExpirationEvent(target.stunExpireTime, target);
                    this.eventQueue.addEvent(stunExpirationEvent);
                }

                if (attackResult.didHit && abilityEffect.blindChance > 0 && Math.random() < (abilityEffect.blindChance * 100 / (100 + target.combatDetails.combatStats.tenacity))) {
                    target.isBlinded = true;
                    target.blindExpireTime = this.simulationTime + abilityEffect.blindDuration;
                    this.eventQueue.clearMatching((event) => event.type == BlindExpirationEvent.type && event.source == target)
                    if (this.eventQueue.clearMatching((event) => event.type == AutoAttackEvent.type && event.source == target)) {
                        // console.log("Blind " + (this.simulationTime / 1000000000));
                        this.addNextAttackEvent(target);
                    }
                    let blindExpirationEvent = new BlindExpirationEvent(target.blindExpireTime, target);
                    this.eventQueue.addEvent(blindExpirationEvent);
                }

                if (attackResult.didHit && abilityEffect.silenceChance > 0 && Math.random() < (abilityEffect.silenceChance * 100 / (100 + target.combatDetails.combatStats.tenacity))) {
                    target.isSilenced = true;
                    target.silenceExpireTime = this.simulationTime + abilityEffect.silenceDuration;
                    this.eventQueue.clearMatching((event) => event.type == SilenceExpirationEvent.type && event.source == target)
                    if (this.eventQueue.clearMatching((event) => event.type == AbilityCastEndEvent.type && event.source == target)) {
                        // console.log("Silence " + (this.simulationTime / 1000000000));
                        this.addNextAttackEvent(target);
                    }
                    let silenceExpirationEvent = new SilenceExpirationEvent(target.silenceExpireTime, target);
                    this.eventQueue.addEvent(silenceExpirationEvent);
                }

                if (attackResult.didHit && source.combatDetails.combatStats.curse > 0 && Math.random() < (100 / (100 + target.combatDetails.combatStats.tenacity))) {
                    const curseExpireTime = 15000000000;
                    let currentCurseEvent = this.eventQueue.getMatching((event) => event.type == CurseExpirationEvent.type && event.source == target);
                    let currentCurseAmount = 0;
                    if (currentCurseEvent) currentCurseAmount = currentCurseEvent.curseAmount;
                    this.eventQueue.clearMatching((event) => event.type == CurseExpirationEvent.type && event.source == target);

                    let curseExpirationEvent = new CurseExpirationEvent(this.simulationTime + curseExpireTime, currentCurseAmount, target);
                    const curseBuff = {
                        "uniqueHrid": "/buff_uniques/curse",
                        "typeHrid": "/buff_types/damage_taken",
                        "ratioBoost": 0,
                        "ratioBoostLevelBonus": 0,
                        "flatBoost": source.combatDetails.combatStats.curse * curseExpirationEvent.curseAmount,
                        "flatBoostLevelBonus": 0,
                        "startTime": "0001-01-01T00:00:00Z",
                        "duration": curseExpireTime
                    };
                    target.addBuff(curseBuff);
                    this.eventQueue.addEvent(curseExpirationEvent);
                }

                if (target.combatDetails.combatStats.weaken > 0) {
                    const weakenExpireTime = 15000000000;
                    source.weakenExpireTime = this.simulationTime + weakenExpireTime;
                    let currentWeakenEvent = this.eventQueue.getMatching((event) => event.type == WeakenExpirationEvent.type && event.source == source);
                    let weakenAmount = 0;
                    if (currentWeakenEvent)
                        weakenAmount = currentWeakenEvent.weakenAmount;
                    this.eventQueue.clearMatching((event) => event.type == WeakenExpirationEvent.type && event.source == source);
                    let weakenExpirationEvent = new WeakenExpirationEvent(this.simulationTime + weakenExpireTime, weakenAmount, source);
                    const weakenBuff = {
                        "uniqueHrid": "/buff_uniques/weaken",
                        "typeHrid": "/buff_types/damage",
                        "ratioBoost": -1 * target.combatDetails.combatStats.weaken * weakenExpirationEvent.weakenAmount,
                        "ratioBoostLevelBonus": 0,
                        "flatBoost": 0,
                        "flatBoostLevelBonus": 0,
                        "startTime": "0001-01-01T00:00:00Z",
                        "duration": weakenExpireTime
                    };
                    source.addBuff(weakenBuff);
                    this.eventQueue.addEvent(weakenExpirationEvent);
                }

                this.simResult.addAttack(
                    source,
                    target,
                    ability.hrid,
                    attackResult.didHit ? attackResult.damageDone : "miss"
                );

                if (attackResult.thornDamageDone > 0) {
                    this.simResult.addAttack(target, source, attackResult.thornType, attackResult.thornDamageDone);
                }
                if (this.zone.isDungeon && attackResult.thornDamageDone > 0 && source.isPlayer) {
                    const log = this.buildCombatLog(target, attackResult.thornType, source, attackResult.thornDamageDone);
                    this.addToWipeLogs(log);
                }

                if (target.combatDetails.combatStats.retaliation > 0) {
                    this.simResult.addAttack(target, source, "retaliation", attackResult.retaliationDamageDone > 0 ? attackResult.retaliationDamageDone : "miss");
                }
                if (this.zone.isDungeon && attackResult.retaliationDamageDone > 0 && source.isPlayer) {
                    const log = this.buildCombatLog(target, "retaliation", source, attackResult.retaliationDamageDone);
                    this.addToWipeLogs(log);
                }

                if (target.combatDetails.currentHitpoints == 0) {
                    this.eventQueue.clearEventsForUnit(target);
                    this.simResult.addDeath(target);
                    if (!target.isPlayer) {
                        this.simResult.updateTimeSpentAlive(target.hrid, false, this.simulationTime);
                    }
                    // console.log(target.hrid, "died");
                }


                if (attackResult.didHit && abilityEffect.pierceChance > Math.random()) {
                    continue;
                }
            }
            
            if (parryTarget)
            {
                break;
            }

            if (abilityEffect.targetType == "enemy") {
                break;
            }
        }
    }

    processAbilityHealEffect(source, ability, abilityEffect) {

        if (abilityEffect.targetType == "allAllies") {
            let targets = source.isPlayer ? this.players : this.enemies;
            for (const target of targets.filter((unit) => unit && unit.combatDetails.currentHitpoints > 0)) {
                let amountHealed = CombatUtilities.processHeal(source, abilityEffect, target);

                this.simResult.addHitpointsGained(target, ability.hrid, amountHealed);
            }
            return;
        }

        if (abilityEffect.targetType == "lowestHpAlly") {
            let targets = source.isPlayer ? this.players : this.enemies;
            let healTarget;
            for (const target of targets.filter((unit) => unit && unit.combatDetails.currentHitpoints > 0)) {
                if (!healTarget) {
                    healTarget = target;
                    continue;
                }
                if (target.combatDetails.currentHitpoints < healTarget.combatDetails.currentHitpoints) {
                    healTarget = target;
                }
            }

            if (healTarget) {
                let amountHealed = CombatUtilities.processHeal(source, abilityEffect, healTarget);

                this.simResult.addHitpointsGained(healTarget, ability.hrid, amountHealed);
            }
            return;
        }

        if (abilityEffect.targetType != "self") {
            throw new Error("Unsupported target type for heal ability effect: " + ability.hrid);
        }

        let amountHealed = CombatUtilities.processHeal(source, abilityEffect, source);

        this.simResult.addHitpointsGained(source, ability.hrid, amountHealed);
    }

    processAbilityReviveEffect(source, ability, abilityEffect) {
        if (abilityEffect.targetType != "deadAlly") {
            throw new Error("Unsupported target type for revive ability effect: " + ability.hrid);
        }

        let targets = source.isPlayer ? this.players : this.enemies;
        let reviveTarget = targets.find((unit) => unit && unit.combatDetails.currentHitpoints <= 0);

        if (reviveTarget) {
            this.eventQueue.clearMatching((event) => event.type == PlayerRespawnEvent.type && event.hrid == reviveTarget.hrid);

            reviveTarget.removeExpiredBuffs(this.simulationTime);

            let amountHealed = CombatUtilities.processRevive(source, abilityEffect, reviveTarget);

            this.simResult.addHitpointsGained(reviveTarget, ability.hrid, amountHealed);

            this.addNextAttackEvent(reviveTarget);

            if (!source.isPlayer) {
                this.simResult.updateTimeSpentAlive(reviveTarget.hrid, true, this.simulationTime);
            }

            // console.log(source.hrid + " revived " + reviveTarget.hrid + " with " + amountHealed + " HP." + ' at wave #' + (this.zone.encountersKilled - 1) + ' at time ' + this.simulationTime / 1000000000 + 's');
        }
        return;
    }

    processAbilityPromoteEffect(source, ability, abilityEffect) {
        const promotionHrids = ["/monsters/enchanted_rook", "/monsters/enchanted_knight", "/monsters/enchanted_bishop"];
        let randomPromotionIndex = Math.floor(Math.random() * promotionHrids.length);
        return new Monster(promotionHrids[randomPromotionIndex], source.difficultyTier);
    }

    processAbilitySpendHpEffect(source, ability, abilityEffect) {
        if (abilityEffect.targetType != "self") {
            throw new Error("Unsupported target type for spend hp ability effect: " + ability.hrid);
        }

        let hpSpent = CombatUtilities.processSpendHp(source, abilityEffect);

        this.simResult.addHitpointsSpent(source, ability.hrid, hpSpent);
    }
}

export default CombatSimulator;
