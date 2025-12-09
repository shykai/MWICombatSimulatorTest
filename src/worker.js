import CombatSimulator from "./combatsimulator/combatSimulator";
import Player from "./combatsimulator/player";
import Zone from "./combatsimulator/zone";


onmessage = async function (event) {
    switch (event.data.type) {
        case "start_simulation":
            let extraBuffs = [];
            if (event.data.extra.mooPass) {
                const mooPassBuff = {
                    "uniqueHrid": "/buff_uniques/experience_moo_pass_buff",
                    "typeHrid": "/buff_types/wisdom",
                    "ratioBoost": 0,
                    "ratioBoostLevelBonus": 0,
                    "flatBoost": 0.05,
                    "flatBoostLevelBonus": 0,
                    "startTime": "0001-01-01T00:00:00Z",
                    "duration": 0
                };
                extraBuffs.push(mooPassBuff);
            }
            if (event.data.extra.comExp > 0) {
                const comExpBuff = {
                    "uniqueHrid": "/buff_uniques/experience_community_buff",
                    "typeHrid": "/buff_types/wisdom",
                    "ratioBoost": 0,
                    "ratioBoostLevelBonus": 0,
                    "flatBoost": 0.005 * (event.data.extra.comExp - 1) + 0.2,
                    "flatBoostLevelBonus": 0,
                    "startTime": "0001-01-01T00:00:00Z",
                    "duration": 0
                };
                extraBuffs.push(comExpBuff);
            }
            if (event.data.extra.comDrop > 0) {
                const comDropBuff = {
                    "uniqueHrid": "/buff_uniques/combat_community_buff",
                    "typeHrid": "/buff_types/combat_drop_quantity",
                    "ratioBoost": 0,
                    "ratioBoostLevelBonus": 0,
                    "flatBoost": 0.005 * (event.data.extra.comDrop - 1) + 0.2,
                    "flatBoostLevelBonus": 0,
                    "startTime": "0001-01-01T00:00:00Z",
                    "duration": 0
                };
                extraBuffs.push(comDropBuff);
            }
            // Achievement Novice: Wisdom +2% (经验+2%)
            if (event.data.extra.achievementNovice) {
                const achievementNoviceBuff = {
                    "uniqueHrid": "/buff_uniques/achievement_novice_wisdom",
                    "typeHrid": "/buff_types/wisdom",
                    "ratioBoost": 0,
                    "ratioBoostLevelBonus": 0,
                    "flatBoost": 0.02,
                    "flatBoostLevelBonus": 0,
                    "startTime": "0001-01-01T00:00:00Z",
                    "duration": 0
                };
                extraBuffs.push(achievementNoviceBuff);
            }
            // Achievement Elite: Damage +2% (伤害+2%，独立乘算)
            if (event.data.extra.achievementElite) {
                const achievementEliteBuff = {
                    "uniqueHrid": "/buff_uniques/achievement_elite_damage",
                    "typeHrid": "/buff_types/achievement_damage",
                    "ratioBoost": 0.02,
                    "ratioBoostLevelBonus": 0,
                    "flatBoost": 0,
                    "flatBoostLevelBonus": 0,
                    "startTime": "0001-01-01T00:00:00Z",
                    "duration": 0
                };
                extraBuffs.push(achievementEliteBuff);
            }

            let playersData = event.data.players;
            let players = [];
            let zone = new Zone(event.data.zone.zoneHrid, event.data.zone.difficultyTier);
            for (let i = 0; i < playersData.length; i++) {
                let currentPlayer = Player.createFromDTO(structuredClone(playersData[i]));
                currentPlayer.zoneBuffs = zone.buffs;
                currentPlayer.extraBuffs = extraBuffs;
                players.push(currentPlayer);
            }
            let simulationTimeLimit = event.data.simulationTimeLimit;
            let combatSimulator = new CombatSimulator(players, zone);
            combatSimulator.addEventListener("progress", (event) => {
                this.postMessage({ 
                    type: "simulation_progress", 
                    progress: event.detail.progress, 
                    zone: event.detail.zone, 
                    difficultyTier: event.detail.difficultyTier,
                    timeSeriesData: event.detail.timeSeriesData
                });
            });

            try {
                let simResult = await combatSimulator.simulate(simulationTimeLimit);
                this.postMessage({ type: "simulation_result", simResult: simResult });
            } catch (e) {
                console.log(e);
                this.postMessage({ type: "simulation_error", error: e });
            }
            break;
    }
};
