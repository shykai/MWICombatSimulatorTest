import CombatSimulator from "./combatsimulator/combatSimulator";
import Player from "./combatsimulator/player";
import Zone from "./combatsimulator/zone";


class SimulationManager {
    constructor() {
        this.simulations = [];
        this.simResults;
    }

    addSimulation(sim) {
        this.simulations.push(sim);
    }

    async startSimulations(simulationTimeLimit) {
        const simulationPromises = this.simulations.map(simulation => simulation.simulate(simulationTimeLimit));
        const results = await Promise.all(simulationPromises);
        return results;
    }
}

onmessage = async function (event) {
    const workerId = event.data.workerId;
    switch (event.data.type) {
        case "start_simulation":
            let playersData = event.data.players;
            let players = [];
            let zone = new Zone(event.data.zoneHrid);
            for (let i = 0; i < playersData.length; i++) {
                let currentPlayer = Player.createFromDTO(structuredClone(playersData[i]));
                currentPlayer.zoneBuffs = zone.buffs;
                players.push(currentPlayer);
            }
            let simulationTimeLimit = event.data.simulationTimeLimit;
            let combatSimulator = new CombatSimulator(players, zone);
            combatSimulator.addEventListener("progress", (event) => {
                this.postMessage({ type: "simulation_progress", progress: event.detail, workerId: workerId });
            });

            try {
                let simResult = await combatSimulator.simulate(simulationTimeLimit);
                this.postMessage({ type: "simulation_result", simResult: simResult, workerId: workerId });
            } catch (e) {
                console.log(e);
                this.postMessage({ type: "simulation_error", error: e });
            }
            break;
        case "start_simulation_all_zones":
            const simManager = new SimulationManager();
            const zoneHrids = event.data.zones;
            for (let i = 0; i < zoneHrids.length; i++) {
                const zoneInstance = new Zone(zoneHrids[i]);
                if (zoneInstance.monsterSpawnInfo.randomSpawnInfo.spawns) {
                    let players = [];
                    let playersData = event.data.players;
                    for (let i = 0; i < playersData.length; i++) {
                        let currentPlayer = Player.createFromDTO(structuredClone(playersData[i]));
                        currentPlayer.zoneBuffs = zoneInstance.buffs;
                        players.push(currentPlayer);
                    }
                    let simulation = new CombatSimulator(players, zoneInstance);
                    if(i == 0) {
                        simulation.addEventListener("progress", (event) => {
                            this.postMessage({ type: "simulation_progress", progress: event.detail, workerId: workerId });
                        });
                    }
                    simManager.addSimulation(simulation);
                }
            }
            try {
                const simResults = await simManager.startSimulations(event.data.simulationTimeLimit);
                    this.postMessage({ type: "simulation_result_allZones", simResults: simResults, workerId: workerId });
                } catch (e) {
                    console.log(e);
                    this.postMessage({ type: "simulation_error", error: e });
                }
            break;
    }
};
