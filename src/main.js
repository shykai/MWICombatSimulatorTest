import Equipment from "./combatsimulator/equipment.js";
import Player from "./combatsimulator/player.js";
import abilityDetailMap from "./combatsimulator/data/abilityDetailMap.json";
import itemDetailMap from "./combatsimulator/data/itemDetailMap.json";
import houseRoomDetailMap from "./combatsimulator/data/houseRoomDetailMap.json";
import Ability from "./combatsimulator/ability.js";
import Consumable from "./combatsimulator/consumable.js";
import HouseRoom from "./combatsimulator/houseRoom"
import Buff from "./combatsimulator/buff.js";
import Achievement from "./combatsimulator/achievement.js";
import combatTriggerDependencyDetailMap from "./combatsimulator/data/combatTriggerDependencyDetailMap.json";
import combatTriggerConditionDetailMap from "./combatsimulator/data/combatTriggerConditionDetailMap.json";
import combatTriggerComparatorDetailMap from "./combatsimulator/data/combatTriggerComparatorDetailMap.json";
import abilitySlotsLevelRequirementList from "./combatsimulator/data/abilitySlotsLevelRequirementList.json";
import actionDetailMap from "./combatsimulator/data/actionDetailMap.json";
import combatMonsterDetailMap from "./combatsimulator/data/combatMonsterDetailMap.json";
import damageTypeDetailMap from "./combatsimulator/data/damageTypeDetailMap.json";
import combatStyleDetailMap from "./combatsimulator/data/combatStyleDetailMap.json";
import openableLootDropMap from "./combatsimulator/data/openableLootDropMap.json";
import achievementTierMap from "./combatsimulator/data/achievementTierDetailMap.json"
import achievementDetailMap from "./combatsimulator/data/achievementDetailMap.json"

import patchNote from "../patchNote.json";

const ONE_SECOND = 1e9;
const ONE_HOUR = 60 * 60 * ONE_SECOND;

let buttonStartSimulation = document.getElementById("buttonStartSimulation");
let buttonStopSimulation = document.getElementById("buttonStopSimulation");
let progressbar = document.getElementById("simulationProgressBar");
let simStartTime = 0;

let worker = new Worker(new URL("worker.js", import.meta.url));
let multiWorker = new Worker(new URL("multiWorker.js", import.meta.url));
let workerPool = [];


let player = new Player();
let selectedPlayers = [];
let food = [null, null, null];
let drinks = [null, null, null];
let abilities = [null, null, null, null];
let triggerMap = {};
let modalTriggers = [];
let currentSimResults = {};

let currentPlayerTabId = '1';
let playerDataMap = {
    "1": "{\"player\":{\"attackLevel\":1,\"magicLevel\":1,\"meleeLevel\":1,\"rangedLevel\":1,\"defenseLevel\":1,\"staminaLevel\":1,\"intelligenceLevel\":1,\"equipment\":[]},\"food\":{\"/action_types/combat\":[{\"itemHrid\":\"\"},{\"itemHrid\":\"\"},{\"itemHrid\":\"\"}]},\"drinks\":{\"/action_types/combat\":[{\"itemHrid\":\"\"},{\"itemHrid\":\"\"},{\"itemHrid\":\"\"}]},\"abilities\":[{\"abilityHrid\":\"\",\"level\":\"1\"},{\"abilityHrid\":\"\",\"level\":\"1\"},{\"abilityHrid\":\"\",\"level\":\"1\"},{\"abilityHrid\":\"\",\"level\":\"1\"},{\"abilityHrid\":\"\",\"level\":\"1\"}],\"triggerMap\":{},\"zone\":\"/actions/combat/fly\",\"simulationTime\":\"100\",\"houseRooms\":{\"/house_rooms/dairy_barn\":0,\"/house_rooms/garden\":0,\"/house_rooms/log_shed\":0,\"/house_rooms/forge\":0,\"/house_rooms/workshop\":0,\"/house_rooms/sewing_parlor\":0,\"/house_rooms/kitchen\":0,\"/house_rooms/brewery\":0,\"/house_rooms/laboratory\":0,\"/house_rooms/dining_room\":0,\"/house_rooms/library\":0,\"/house_rooms/dojo\":0,\"/house_rooms/gym\":0,\"/house_rooms/armory\":0,\"/house_rooms/archery_range\":0,\"/house_rooms/mystical_study\":0,\"/house_rooms/observatory\":0},\"achievements\":{}}",
    "2": "{\"player\":{\"attackLevel\":1,\"magicLevel\":1,\"meleeLevel\":1,\"rangedLevel\":1,\"defenseLevel\":1,\"staminaLevel\":1,\"intelligenceLevel\":1,\"equipment\":[]},\"food\":{\"/action_types/combat\":[{\"itemHrid\":\"\"},{\"itemHrid\":\"\"},{\"itemHrid\":\"\"}]},\"drinks\":{\"/action_types/combat\":[{\"itemHrid\":\"\"},{\"itemHrid\":\"\"},{\"itemHrid\":\"\"}]},\"abilities\":[{\"abilityHrid\":\"\",\"level\":\"1\"},{\"abilityHrid\":\"\",\"level\":\"1\"},{\"abilityHrid\":\"\",\"level\":\"1\"},{\"abilityHrid\":\"\",\"level\":\"1\"},{\"abilityHrid\":\"\",\"level\":\"1\"}],\"triggerMap\":{},\"zone\":\"/actions/combat/fly\",\"simulationTime\":\"100\",\"houseRooms\":{\"/house_rooms/dairy_barn\":0,\"/house_rooms/garden\":0,\"/house_rooms/log_shed\":0,\"/house_rooms/forge\":0,\"/house_rooms/workshop\":0,\"/house_rooms/sewing_parlor\":0,\"/house_rooms/kitchen\":0,\"/house_rooms/brewery\":0,\"/house_rooms/laboratory\":0,\"/house_rooms/dining_room\":0,\"/house_rooms/library\":0,\"/house_rooms/dojo\":0,\"/house_rooms/gym\":0,\"/house_rooms/armory\":0,\"/house_rooms/archery_range\":0,\"/house_rooms/mystical_study\":0,\"/house_rooms/observatory\":0},\"achievements\":{}}",
    "3": "{\"player\":{\"attackLevel\":1,\"magicLevel\":1,\"meleeLevel\":1,\"rangedLevel\":1,\"defenseLevel\":1,\"staminaLevel\":1,\"intelligenceLevel\":1,\"equipment\":[]},\"food\":{\"/action_types/combat\":[{\"itemHrid\":\"\"},{\"itemHrid\":\"\"},{\"itemHrid\":\"\"}]},\"drinks\":{\"/action_types/combat\":[{\"itemHrid\":\"\"},{\"itemHrid\":\"\"},{\"itemHrid\":\"\"}]},\"abilities\":[{\"abilityHrid\":\"\",\"level\":\"1\"},{\"abilityHrid\":\"\",\"level\":\"1\"},{\"abilityHrid\":\"\",\"level\":\"1\"},{\"abilityHrid\":\"\",\"level\":\"1\"},{\"abilityHrid\":\"\",\"level\":\"1\"}],\"triggerMap\":{},\"zone\":\"/actions/combat/fly\",\"simulationTime\":\"100\",\"houseRooms\":{\"/house_rooms/dairy_barn\":0,\"/house_rooms/garden\":0,\"/house_rooms/log_shed\":0,\"/house_rooms/forge\":0,\"/house_rooms/workshop\":0,\"/house_rooms/sewing_parlor\":0,\"/house_rooms/kitchen\":0,\"/house_rooms/brewery\":0,\"/house_rooms/laboratory\":0,\"/house_rooms/dining_room\":0,\"/house_rooms/library\":0,\"/house_rooms/dojo\":0,\"/house_rooms/gym\":0,\"/house_rooms/armory\":0,\"/house_rooms/archery_range\":0,\"/house_rooms/mystical_study\":0,\"/house_rooms/observatory\":0},\"achievements\":{}}",
    "4": "{\"player\":{\"attackLevel\":1,\"magicLevel\":1,\"meleeLevel\":1,\"rangedLevel\":1,\"defenseLevel\":1,\"staminaLevel\":1,\"intelligenceLevel\":1,\"equipment\":[]},\"food\":{\"/action_types/combat\":[{\"itemHrid\":\"\"},{\"itemHrid\":\"\"},{\"itemHrid\":\"\"}]},\"drinks\":{\"/action_types/combat\":[{\"itemHrid\":\"\"},{\"itemHrid\":\"\"},{\"itemHrid\":\"\"}]},\"abilities\":[{\"abilityHrid\":\"\",\"level\":\"1\"},{\"abilityHrid\":\"\",\"level\":\"1\"},{\"abilityHrid\":\"\",\"level\":\"1\"},{\"abilityHrid\":\"\",\"level\":\"1\"},{\"abilityHrid\":\"\",\"level\":\"1\"}],\"triggerMap\":{},\"zone\":\"/actions/combat/fly\",\"simulationTime\":\"100\",\"houseRooms\":{\"/house_rooms/dairy_barn\":0,\"/house_rooms/garden\":0,\"/house_rooms/log_shed\":0,\"/house_rooms/forge\":0,\"/house_rooms/workshop\":0,\"/house_rooms/sewing_parlor\":0,\"/house_rooms/kitchen\":0,\"/house_rooms/brewery\":0,\"/house_rooms/laboratory\":0,\"/house_rooms/dining_room\":0,\"/house_rooms/library\":0,\"/house_rooms/dojo\":0,\"/house_rooms/gym\":0,\"/house_rooms/armory\":0,\"/house_rooms/archery_range\":0,\"/house_rooms/mystical_study\":0,\"/house_rooms/observatory\":0},\"achievements\":{}}",
    "5": "{\"player\":{\"attackLevel\":1,\"magicLevel\":1,\"meleeLevel\":1,\"rangedLevel\":1,\"defenseLevel\":1,\"staminaLevel\":1,\"intelligenceLevel\":1,\"equipment\":[]},\"food\":{\"/action_types/combat\":[{\"itemHrid\":\"\"},{\"itemHrid\":\"\"},{\"itemHrid\":\"\"}]},\"drinks\":{\"/action_types/combat\":[{\"itemHrid\":\"\"},{\"itemHrid\":\"\"},{\"itemHrid\":\"\"}]},\"abilities\":[{\"abilityHrid\":\"\",\"level\":\"1\"},{\"abilityHrid\":\"\",\"level\":\"1\"},{\"abilityHrid\":\"\",\"level\":\"1\"},{\"abilityHrid\":\"\",\"level\":\"1\"},{\"abilityHrid\":\"\",\"level\":\"1\"}],\"triggerMap\":{},\"zone\":\"/actions/combat/fly\",\"simulationTime\":\"100\",\"houseRooms\":{\"/house_rooms/dairy_barn\":0,\"/house_rooms/garden\":0,\"/house_rooms/log_shed\":0,\"/house_rooms/forge\":0,\"/house_rooms/workshop\":0,\"/house_rooms/sewing_parlor\":0,\"/house_rooms/kitchen\":0,\"/house_rooms/brewery\":0,\"/house_rooms/laboratory\":0,\"/house_rooms/dining_room\":0,\"/house_rooms/library\":0,\"/house_rooms/dojo\":0,\"/house_rooms/gym\":0,\"/house_rooms/armory\":0,\"/house_rooms/archery_range\":0,\"/house_rooms/mystical_study\":0,\"/house_rooms/observatory\":0},\"achievements\":{}}"
};
window.revenue = 0;
window.noRngRevenue = 0;
window.expenses = 0;
window.profit = 0;
window.noRngProfit = 0;

// #region Worker

function onWorkerMessage(event) {
    switch (event.data.type) {
        case "simulation_result":
            progressbar.style.width = "100%";
            progressbar.innerHTML = "100% (" + ((Date.now() - simStartTime) / 1000).toFixed(2) + "s)";
            //console.log("SIM RESULTS: ", event.data.simResult);
            showSimulationResult(event.data.simResult);
            updateContent();
            buttonStartSimulation.disabled = false;
            buttonStopSimulation.style.display = 'none';
            document.getElementById('buttonShowAllSimData').style.display = 'none';
            break;
        case "simulation_progress":
            let progress = Math.floor(100 * event.data.progress);
            progressbar.style.width = progress + "%";
            progressbar.innerHTML = progress + "% (" + ((Date.now() - simStartTime) / 1000).toFixed(2) + "s)";
            // 实时更新图表
            if (event.data.timeSeriesData && document.getElementById('hpMpVisualizationToggle').checked) {
                updateChartsRealtime(event.data.timeSeriesData);
            }
            break;
        case "simulation_error":
            showErrorModal(event.data.error.toString());
            break;
    }
};

function onMultiWorkerMessage(event) {
    switch (event.data.type) {
        case "simulation_result_allZones":
            progressbar.style.width = "100%";
            progressbar.innerHTML = "100% (" + ((Date.now() - simStartTime) / 1000).toFixed(2) + "s)";
            showAllSimulationResults(event.data.simResults);
            updateContent();
            buttonStartSimulation.disabled = false;
            buttonStopSimulation.style.display = 'none';
            document.getElementById('buttonShowAllSimData').style.display = 'block';
            break;
        case "simulation_progress":
            let progress = Math.floor(100 * event.data.progress);
            progressbar.style.width = progress + "%";
            progressbar.innerHTML = progress + "% (" + ((Date.now() - simStartTime) / 1000).toFixed(2) + "s)";
            break;
        case "simulation_error":
            showErrorModal(event.data.error.toString());
            break;
    }
};

// #endregion

// #region Equipment

function initEquipmentSection() {
    ["head", "body", "legs", "feet", "hands", "main_hand", "two_hand", "off_hand", "pouch", "neck", "earrings", "ring", "back", "charm"].forEach((type) => {
        initEquipmentSelect(type);
        initEnhancementLevelInput(type);
    });
}

function initEquipmentSelect(equipmentType) {
    let selectId = "selectEquipment_";
    if (equipmentType == "main_hand" || equipmentType == "two_hand") {
        selectId += "weapon";
    } else {
        selectId += equipmentType;
    }
    let selectElement = document.getElementById(selectId);

    let gameEquipment = Object.values(itemDetailMap)
        .filter((item) => item.categoryHrid == "/item_categories/equipment")
        .filter((item) => item.equipmentDetail.type == "/equipment_types/" + equipmentType)
        .sort((a, b) => a.sortIndex - b.sortIndex);

    for (const equipment of Object.values(gameEquipment)) {
        let opt = new Option(equipment.name, equipment.hrid);
        opt.setAttribute("data-i18n", "itemNames." + equipment.hrid);
        selectElement.add(opt);
    }

    selectElement.addEventListener("change", (event) => {
        equipmentSelectHandler(event, equipmentType);
    });
}

function initHouseRoomsModal() {
    let houseRoomsList = document.getElementById("houseRoomsList");
    let newChildren = [];
    let houseRooms = Object.values(houseRoomDetailMap).sort((a, b) => a.sortIndex - b.sortIndex);
    player.houseRooms = {};

    for (const room of Object.values(houseRooms)) {
        player.houseRooms[room.hrid] = 0;

        let row = createElement("div", "row mb-2");

        let nameCol = createElement("div", "col-md-4 offset-md-3 align-self-center", room.name);
        nameCol.setAttribute("data-i18n", "houseRoomNames." + room.hrid);
        row.appendChild(nameCol);

        let levelCol = createElement("div", "col-md-2");
        let levelInput = createHouseInput(room.hrid);

        levelInput.addEventListener("input", function (e) {
            let inputValue = e.target.value;
            const hrid = e.target.dataset.houseHrid;
            player.houseRooms[hrid] = parseInt(inputValue);
            // 如果开启入战属性模式，实时更新
            if (isCombatReadyMode) {
                updateCombatStatsUI();
            }
        });

        levelCol.appendChild(levelInput);
        row.appendChild(levelCol);

        newChildren.push(row);
    }

    houseRoomsList.replaceChildren(...newChildren);
}

function createHouseInput(hrid) {
    let levelInput = document.createElement("input");
    levelInput.className = "form-control";
    levelInput.type = "number";
    levelInput.placeholder = 0;
    levelInput.min = 0;
    levelInput.max = 8;
    levelInput.step = 1;
    levelInput.dataset.houseHrid = hrid;

    return levelInput;
}

function refreshAchievementStatics() {
    let tierMap = Object.values(achievementTierMap).sort((a, b) => a.sortIndex - b.sortIndex);
    for(const tier of Object.values(tierMap)) {
        const checks = document.querySelectorAll(`input[data-achievement-hrid][data-tier="${tier.sortIndex}"]`);
        const done = Array.from(checks).filter(cb => cb.checked).length;
        const total = checks.length;

        const stat = document.getElementById(`AchTier${tier.sortIndex}Statics`);
        stat.innerText = `(${done}/${total})`;
        if (done == total) {
            // set to green
            stat.classList.remove("text-secondary");
            stat.classList.add("text-success");
        } else {
            // set to secondary
            stat.classList.remove("text-success");
            stat.classList.add("text-secondary");
        }
    }
}

function initAchievementsModal(){
    let achievementsList = document.getElementById("achievementsList");
    let newChildren = [];
    player.achievements = {};

    let tierMap = Object.values(achievementTierMap).sort((a, b) => a.sortIndex - b.sortIndex);
    for(const tier of Object.values(tierMap)) {
        let detailMap = Object.values(achievementDetailMap).filter((detail) => detail.tierHrid == tier.hrid).sort((a, b) => a.sortIndex - b.sortIndex);
        let detailMapCount = detailMap.length;
        if (detailMapCount <= 0) continue;

        let card = createElement("div", "card");
        let cardHeader = createElement("div", "card-header d-flex align-items-center");

        let cardTitle = createElement("a", "btn", tier.name);
        cardTitle.setAttribute("data-bs-toggle","collapse");
        cardTitle.setAttribute("href", `#AchTier${tier.sortIndex}`);
        cardTitle.setAttribute("data-i18n", "achievementTierNames."+tier.hrid);
        cardHeader.appendChild(cardTitle);

        let bufDesc = createElement("div", "small text-secondary");
        let buffName = createElement("i", "");
        buffName.setAttribute("data-i18n", "buffTypeNames."+tier["buff"].typeHrid);
        bufDesc.appendChild(buffName);
        let buffValue = createElement("i", "");
        buffValue.innerText = ":+" + parseFloat(tier["buff"].ratioBoost==0?tier["buff"].flatBoost:tier["buff"].ratioBoost)*100 + "%";
        bufDesc.appendChild(buffValue);
        cardHeader.appendChild(bufDesc);

        let cardStatics = createElement("div", "ms-auto btn", `(0/${detailMapCount})`);
        cardStatics.id = `AchTier${tier.sortIndex}Statics`;
        cardStatics.dataset.checked = "true";
        cardStatics.addEventListener("click", function (e) {
            const checks = document.querySelectorAll(`input[data-achievement-hrid][data-tier="${tier.sortIndex}"]`);
            for (const check of checks) {
                check.checked = cardStatics.dataset.checked == "true";
                const hrid = check.dataset.achievementHrid;
                player.achievements[hrid] = check.checked;
            }
            cardStatics.dataset.checked = cardStatics.dataset.checked == "true" ? "false" : "true";
            refreshAchievementStatics();
            // 如果开启入战属性模式，实时更新
            if (isCombatReadyMode) {
                updateCombatStatsUI();
            }
        });
        cardHeader.appendChild(cardStatics);

        card.appendChild(cardHeader);

        let cardMain = createElement("div", "collapse");
        cardMain.id = `AchTier${tier.sortIndex}`;
        let cardBody = createElement("div", "card-body");

        for (const detail of Object.values(detailMap)) {
            let row = createElement("div", "row mb-2");

            let formCheck = createElement("div", "form-check");
            let input = createElement("input", "form-check-input");
            input.setAttribute("type", "checkbox");
            input.setAttribute("data-tier", tier.sortIndex);
            input.id = `AchDetail${detail.sortIndex}`;
            input.dataset.achievementHrid = detail.hrid;
            input.addEventListener("change", function (e) {
                const hrid = e.target.dataset.achievementHrid;
                player.achievements[hrid] = e.target.checked;

                refreshAchievementStatics();
                // 如果开启入战属性模式，实时更新
                if (isCombatReadyMode) {
                    updateCombatStatsUI();
                }
            });
            formCheck.appendChild(input);

            let name = createElement("label", "form-check-label", detail.name);
            name.setAttribute("data-i18n", "achievementNames." + detail.hrid);
            name.setAttribute("for", `AchDetail${detail.sortIndex}`);
            formCheck.appendChild(name);
            row.appendChild(formCheck);
            cardBody.appendChild(row);
        }
        cardMain.appendChild(cardBody);
        card.appendChild(cardMain);

        newChildren.push(card);
    }

    achievementsList.replaceChildren(...newChildren);
}

function initEnhancementLevelInput(equipmentType) {
    let inputId = "inputEquipmentEnhancementLevel_";
    if (equipmentType == "main_hand" || equipmentType == "two_hand") {
        inputId += "weapon";
    } else {
        inputId += equipmentType;
    }

    let inputElement = document.getElementById(inputId);
    inputElement.value = 0;
    inputElement.addEventListener("change", enhancementLevelInputHandler);
}

function equipmentSelectHandler(event, type) {
    let equipmentType = "/equipment_types/" + type;

    if (!event.target.value) {
        updateEquipmentState();
        updateUI();
        return;
    }

    let gameItem = itemDetailMap[event.target.value];

    // Weapon select has two handlers because of mainhand and twohand weapons. Ignore the handler with the wrong type
    if (gameItem.equipmentDetail.type != equipmentType) {
        return;
    }

    if (type == "two_hand") {
        document.getElementById("selectEquipment_off_hand").value = "";
        document.getElementById("inputEquipmentEnhancementLevel_off_hand").value = 0;
    }
    if (type == "off_hand" && player.equipment["/equipment_types/two_hand"]) {
        document.getElementById("selectEquipment_weapon").value = "";
        document.getElementById("inputEquipmentEnhancementLevel_weapon").value = 0;
    }

    updateEquipmentState();
    updateUI();
}

function enhancementLevelInputHandler() {
    updateEquipmentState();
    updateUI();
}

function updateEquipmentState() {
    ["head", "body", "legs", "feet", "hands", "main_hand", "two_hand", "off_hand", "pouch", "neck", "earrings", "ring", "back", "charm"].forEach((type) => {
        let equipmentType = "/equipment_types/" + type;
        let selectType = type;
        if (type == "main_hand" || type == "two_hand") {
            selectType = "weapon";
        }

        let equipmentSelect = document.getElementById("selectEquipment_" + selectType);
        let equipmentHrid = equipmentSelect.value;

        if (!equipmentHrid) {
            player.equipment[equipmentType] = null;
            return;
        }

        let gameItem = itemDetailMap[equipmentHrid];

        // Clear old weapon if a weapon of a different type is equipped
        if (gameItem.equipmentDetail.type != equipmentType) {
            player.equipment[equipmentType] = null;
            return;
        }

        let enhancementLevel = Number(document.getElementById("inputEquipmentEnhancementLevel_" + selectType).value);
        player.equipment[equipmentType] = new Equipment(gameItem.hrid, enhancementLevel);
    });
}

document.getElementById("selectEquipment_set").onchange = changeEquipmentSetListener;

function changeEquipmentSetListener() {
    let value = this.value
    let optgroupType = this.options[this.selectedIndex].parentNode.label;

    ["head", "body", "legs", "feet", "hands"].forEach((type) => {
        let selectType = type;

        let currentEquipment = document.getElementById("selectEquipment_" + selectType);
        if (type === "feet") {
            type = "_boots";
        }
        if (type === "hands") {
            if (optgroupType === "RANGED") {
                type = "_bracers";
            } else if (optgroupType === "MAGIC") {
                type = "_gloves";
            } else {
                type = "_gauntlets";
            }
        }
        if (type === "head") {
            if (optgroupType === "RANGED") {
                type = "_hood";
            } else if (optgroupType === "MAGIC") {
                type = "_hat";
            } else {
                type = "_helmet";
            }
        }
        if (type === "legs") {
            if (optgroupType === "RANGED") {
                type = "_chaps";
            } else if (optgroupType === "MAGIC") {
                type = "_robe_bottoms";
            } else {
                type = "_plate_legs";
            }
        }
        if (type === "body") {
            if (optgroupType === "RANGED") {
                type = "_tunic";
            } else if (optgroupType === "MAGIC") {
                type = "_robe_top";
            } else {
                type = "_plate_body";
            }
        }
        currentEquipment.value = "/items/" + value.toLowerCase() + type;
    });
    updateEquipmentState();
    updateUI();
}

// #endregion

// #region Combat Stats

// 存储基础属性和入战属性的对比数据
let baseStats = {};
let combatReadyStats = {};
let isCombatReadyMode = false;

// 光环技能列表（按照后放覆盖先放的逻辑）
const AURA_ABILITIES = [
    "/abilities/critical_aura",
    "/abilities/fierce_aura",
    "/abilities/guardian_aura",
    "/abilities/mystic_aura",
    "/abilities/speed_aura"
];

// 咖啡类饮料列表（用于识别咖啡）
function isCoffee(hrid) {
    return hrid && hrid.includes("coffee");
}

// 计算入战时的所有永久buff
function calculateCombatReadyBuffs() {
    let buffs = [];
    
    // 1. 房屋buff
    Object.entries(player.houseRooms).forEach(([hrid, level]) => {
        if (level > 0) {
            try {
                let houseRoom = new HouseRoom(hrid, level);
                houseRoom.buffs.forEach(buff => {
                    buffs.push(buff);
                });
            } catch (e) {
                // 跳过无效的房间
            }
        }
    });
    
    // 2. 成就buff
    if (player.achievements && Object.keys(player.achievements).length > 0) {
        let achievement = new Achievement(player.achievements);
        achievement.buffs.forEach(buff => {
            buffs.push(buff);
        });
    }
    
    // 3. 社区经验buff
    if (document.getElementById("comExpToggle").checked) {
        let comExp = Number(document.getElementById("comExpInput").value);
        if (comExp > 0) {
            const comExpBuff = {
                uniqueHrid: "/buff_uniques/experience_community_buff",
                typeHrid: "/buff_types/wisdom",
                ratioBoost: 0,
                ratioBoostLevelBonus: 0,
                flatBoost: 0.005 * (comExp - 1) + 0.2,
                flatBoostLevelBonus: 0,
                duration: 0
            };
            buffs.push(new Buff(comExpBuff));
        }
    }
    
    // 4. 社区掉落buff
    if (document.getElementById("comDropToggle").checked) {
        let comDrop = Number(document.getElementById("comDropInput").value);
        if (comDrop > 0) {
            const comDropBuff = {
                uniqueHrid: "/buff_uniques/combat_community_buff",
                typeHrid: "/buff_types/combat_drop_quantity",
                ratioBoost: 0,
                ratioBoostLevelBonus: 0,
                flatBoost: 0.005 * (comDrop - 1) + 0.2,
                flatBoostLevelBonus: 0,
                duration: 0
            };
            buffs.push(new Buff(comDropBuff));
        }
    }
    
    // 5. MooPass buff
    if (document.getElementById("mooPassToggle").checked) {
        const mooPassBuff = {
            uniqueHrid: "/buff_uniques/experience_moo_pass_buff",
            typeHrid: "/buff_types/wisdom",
            ratioBoost: 0,
            ratioBoostLevelBonus: 0,
            flatBoost: 0.05,
            flatBoostLevelBonus: 0,
            duration: 0
        };
        buffs.push(new Buff(mooPassBuff));
    }
    
    // 6. 咖啡buff（考虑饮料浓度）
    let drinkConcentration = player.combatDetails.combatStats.drinkConcentration;
    for (let i = 0; i < 3; i++) {
        let drinkSelect = document.getElementById("selectDrink_" + i);
        if (drinkSelect && drinkSelect.value && isCoffee(drinkSelect.value)) {
            let drinkHrid = drinkSelect.value;
            let gameItem = itemDetailMap[drinkHrid];
            if (gameItem && gameItem.consumableDetail && gameItem.consumableDetail.buffs) {
                for (const buffData of gameItem.consumableDetail.buffs) {
                    let buffCopy = structuredClone(buffData);
                    // 应用饮料浓度加成
                    if (drinkConcentration > 0) {
                        buffCopy.ratioBoost = buffCopy.ratioBoost * (1 + drinkConcentration);
                        buffCopy.flatBoost = buffCopy.flatBoost * (1 + drinkConcentration);
                    }
                    buffs.push(new Buff(buffCopy));
                }
            }
        }
    }
    
    // 7. 光环技能buff（按顺序处理，后放覆盖先放）
    let auraBuffMap = {}; // 用于处理覆盖
    for (let i = 0; i < 5; i++) {
        let abilitySelect = document.getElementById("selectAbility_" + i);
        if (abilitySelect && abilitySelect.value && AURA_ABILITIES.includes(abilitySelect.value)) {
            let abilityHrid = abilitySelect.value;
            let abilityLevel = Number(document.getElementById("inputAbilityLevel_" + i).value) || 1;
            let gameAbility = abilityDetailMap[abilityHrid];
            if (gameAbility && gameAbility.abilityEffects) {
                for (const effect of gameAbility.abilityEffects) {
                    if (effect.buffs) {
                        for (const buffData of effect.buffs) {
                            let buff = new Buff(buffData, abilityLevel);
                            // 使用uniqueHrid作为key，后放覆盖先放
                            auraBuffMap[buff.uniqueHrid] = buff;
                        }
                    }
                }
            }
        }
    }
    // 添加光环buff
    Object.values(auraBuffMap).forEach(buff => {
        buffs.push(buff);
    });
    
    return buffs;
}

// 创建一个临时player来计算入战属性
function calculateCombatReadyPlayer() {
    // 深拷贝当前player的基础数据
    let tempPlayer = new Player();
    tempPlayer.staminaLevel = player.staminaLevel;
    tempPlayer.intelligenceLevel = player.intelligenceLevel;
    tempPlayer.attackLevel = player.attackLevel;
    tempPlayer.meleeLevel = player.meleeLevel;
    tempPlayer.defenseLevel = player.defenseLevel;
    tempPlayer.rangedLevel = player.rangedLevel;
    tempPlayer.magicLevel = player.magicLevel;
    tempPlayer.equipment = player.equipment;
    tempPlayer.food = player.food;
    tempPlayer.drinks = player.drinks;
    tempPlayer.abilities = player.abilities;
    tempPlayer.houseRooms = [];
    tempPlayer.achievements = null;
    
    // 计算基础属性
    tempPlayer.updateCombatDetails();
    
    // 收集所有入战buff
    let combatBuffs = calculateCombatReadyBuffs();
    
    // 将buff添加到permanentBuffs
    combatBuffs.forEach(buff => {
        if (tempPlayer.permanentBuffs[buff.typeHrid]) {
            tempPlayer.permanentBuffs[buff.typeHrid].flatBoost += buff.flatBoost;
            tempPlayer.permanentBuffs[buff.typeHrid].ratioBoost += buff.ratioBoost;
        } else {
            tempPlayer.permanentBuffs[buff.typeHrid] = buff;
        }
    });
    
    // 复制到combatBuffs
    tempPlayer.combatBuffs = structuredClone(tempPlayer.permanentBuffs);
    
    // 重新计算战斗属性
    tempPlayer.updateCombatDetails();
    
    return tempPlayer;
}

// 保存基础属性快照
function saveBaseStats() {
    player.updateCombatDetails();
    baseStats = {
        combatDetails: structuredClone(player.combatDetails)
    };
}

// 保存入战属性快照
function saveCombatReadyStats() {
    let combatReadyPlayer = calculateCombatReadyPlayer();
    combatReadyStats = {
        combatDetails: structuredClone(combatReadyPlayer.combatDetails)
    };
}

// 判断属性是否被增益（用于高亮显示）
function isStatBoosted(statName, isFloor = false, isCombatStats = false) {
    if (!isCombatReadyMode) return false;
    if (!baseStats.combatDetails || !combatReadyStats.combatDetails) return false;
    
    let baseValue, combatValue;
    if (isCombatStats) {
        baseValue = baseStats.combatDetails.combatStats[statName];
        combatValue = combatReadyStats.combatDetails.combatStats[statName];
    } else {
        baseValue = baseStats.combatDetails[statName];
        combatValue = combatReadyStats.combatDetails[statName];
    }
    
    if (baseValue === undefined || combatValue === undefined) return false;
    
    if (isFloor) {
        return Math.floor(combatValue) > Math.floor(baseValue);
    }
    return combatValue > baseValue + 0.0001; // 浮点数比较容差
}

// 获取当前应该显示的属性源
function getCurrentDisplayStats() {
    return isCombatReadyMode ? combatReadyStats : baseStats;
}

function updateCombatStatsUI() {
    // 先保存基础属性
    saveBaseStats();
    
    // 如果开启入战属性模式，计算入战属性
    if (isCombatReadyMode) {
        saveCombatReadyStats();
    }
    
    // 获取要显示的属性
    let displayStats = isCombatReadyMode ? combatReadyStats.combatDetails : player.combatDetails;
    if (!displayStats) {
        player.updateCombatDetails();
        displayStats = player.combatDetails;
    }

    let combatStyleElement = document.getElementById("combatStat_combatStyleHrid");
    let combatStyle = displayStats.combatStats.combatStyleHrid;
    combatStyleElement.setAttribute("data-i18n", "combatStyleNames." + combatStyle);
    combatStyleElement.innerHTML = combatStyleDetailMap[combatStyle].name;

    let damageTypeElement = document.getElementById("combatStat_damageType");
    let damageType = damageTypeDetailMap[displayStats.combatStats.damageType];
    damageTypeElement.setAttribute("data-i18n", "damageTypeNames." + damageType.hrid);
    damageTypeElement.innerHTML = damageType.name;

    let attackIntervalElement = document.getElementById("combatStat_attackInterval");
    let attackIntervalValue = (displayStats.combatStats.attackInterval / 1e9).toLocaleString() + "s";
    attackIntervalElement.innerHTML = attackIntervalValue;
    // 攻速变快时也高亮（数值变小）
    if (isCombatReadyMode && baseStats.combatDetails && 
        displayStats.combatStats.attackInterval < baseStats.combatDetails.combatStats.attackInterval - 1000) {
        attackIntervalElement.style.color = "#0d6efd";
        attackIntervalElement.style.fontWeight = "bold";
    } else {
        attackIntervalElement.style.color = "";
        attackIntervalElement.style.fontWeight = "";
    }

    let primaryTrainingElement = document.getElementById("combatStat_primaryTraining");
    let primaryTraining = displayStats.combatStats.primaryTraining;
    primaryTrainingElement.setAttribute("data-i18n", "skillNames." + primaryTraining);
    primaryTrainingElement.innerHTML = primaryTraining;

    let focusTrainingElement = document.getElementById("combatStat_focusTraining");
    let focusTraining = displayStats.combatStats.focusTraining;
    if (focusTraining) {
        focusTrainingElement.setAttribute("data-i18n", "skillNames." + focusTraining);
    } else {
        focusTrainingElement.setAttribute("data-i18n", "characterSelectPage.slots.empty");
    }
    focusTrainingElement.innerHTML = focusTraining;

    [
        "maxHitpoints",
        "maxManapoints",
        "stabAccuracyRating",
        "stabMaxDamage",
        "slashAccuracyRating",
        "slashMaxDamage",
        "smashAccuracyRating",
        "smashMaxDamage",
        "rangedAccuracyRating",
        "rangedMaxDamage",
        "magicAccuracyRating",
        "magicMaxDamage",
        "defensiveMaxDamage",
        "stabEvasionRating",
        "slashEvasionRating",
        "smashEvasionRating",
        "rangedEvasionRating",
        "magicEvasionRating",
        "totalArmor",
        "totalWaterResistance",
        "totalNatureResistance",
        "totalFireResistance",
        "totalThreat"
    ].forEach((stat) => {
        let element = document.getElementById("combatStat_" + stat);
        element.innerHTML = Math.floor(displayStats[stat]);
        if (isStatBoosted(stat, true, false)) {
            element.style.color = "#0d6efd";
            element.style.fontWeight = "bold";
        } else {
            element.style.color = "";
            element.style.fontWeight = "";
        }
    });

    [
        "abilityHaste",
        "tenacity"
    ].forEach((stat) => {
        let element = document.getElementById("combatStat_" + stat);
        element.innerHTML = Math.floor(displayStats.combatStats[stat]);
        if (isStatBoosted(stat, true, true)) {
            element.style.color = "#0d6efd";
            element.style.fontWeight = "bold";
        } else {
            element.style.color = "";
            element.style.fontWeight = "";
        }
    });

    [
        "physicalAmplify",
        "waterAmplify",
        "natureAmplify",
        "fireAmplify",
        "healingAmplify",
        "lifeSteal",
        "hpRegenPer10",
        "mpRegenPer10",
        "physicalThorns",
        "elementalThorns",
        "criticalRate",
        "criticalDamage",
        "combatExperience",
        "taskDamage",
        "armorPenetration",
        "waterPenetration",
        "naturePenetration",
        "firePenetration",
        "manaLeech",
        "castSpeed",
        "parry",
        "mayhem",
        "pierce",
        "curse",
        "fury",
        "weaken",
        "ripple",
        "bloom",
        "blaze",
        "attackSpeed",
        "autoAttackDamage",
        "abilityDamage",
        "drinkConcentration",
        "foodHaste",
        "staminaExperience",
        "intelligenceExperience",
        "attackExperience",
        "defenseExperience",
        "meleeExperience",
        "rangedExperience",
        "magicExperience"

    ].forEach((stat) => {
        let element = document.getElementById("combatStat_" + stat);
        let value = (100 * displayStats.combatStats[stat]).toLocaleString([], {
            minimumFractionDigits: 0,
            maximumFractionDigits: 4,
        });
        element.innerHTML = value + "%";
        if (isStatBoosted(stat, false, true)) {
            element.style.color = "#0d6efd";
            element.style.fontWeight = "bold";
        } else {
            element.style.color = "";
            element.style.fontWeight = "";
        }
    });
}

// 初始化入战属性开关
function initCombatReadyStatsToggle() {
    let toggle = document.getElementById("combatReadyStatsToggle");
    if (!toggle) return;
    
    // 从localStorage读取状态
    let savedState = localStorage.getItem('combatReadyStatsEnabled');
    if (savedState === 'true') {
        toggle.checked = true;
        isCombatReadyMode = true;
    }
    
    toggle.addEventListener('change', () => {
        isCombatReadyMode = toggle.checked;
        localStorage.setItem('combatReadyStatsEnabled', toggle.checked);
        updateUI();
    });
}

// #endregion

// #region Level

function initLevelSection() {
    ["stamina", "intelligence", "attack", "melee", "defense", "ranged", "magic"].forEach((skill) => {
        let levelInput = document.getElementById("inputLevel_" + skill);
        levelInput.value = 1;
        levelInput.addEventListener("change", levelInputHandler);
    });
}

function levelInputHandler() {
    updateLevels();
    updateUI();
}

function updateLevels() {
    ["stamina", "intelligence", "attack", "melee", "defense", "ranged", "magic"].forEach((skill) => {
        let levelInput = document.getElementById("inputLevel_" + skill);
        player[skill + "Level"] = Number(levelInput.value);
    });
    updateCombatLevel();
}

function calcCombatLevel(staminaLevel, intelligenceLevel, defenseLevel, attackLevel, meleeLevel, rangedLevel, magicLevel) {
    return Math.floor(
        0.1 * (staminaLevel + intelligenceLevel + attackLevel + defenseLevel + Math.max(meleeLevel, rangedLevel, magicLevel))
        + 0.5 * Math.max(attackLevel, defenseLevel, meleeLevel, rangedLevel, magicLevel)
    );
}


function updateCombatLevel() {
    let staminaLevel = player["staminaLevel"];
    let intelligenceLevel = player["intelligenceLevel"];
    let defenseLevel = player["defenseLevel"];
    let attackLevel = player["attackLevel"];
    let meleeLevel = player["meleeLevel"];
    let rangedLevel = player["rangedLevel"];
    let magicLevel = player["magicLevel"];

    let levelInput = document.getElementById("inputLevel_combat");
    levelInput.value = calcCombatLevel(staminaLevel, intelligenceLevel, defenseLevel, attackLevel, meleeLevel, rangedLevel, magicLevel);;
}

// #endregion

// #region Food

function initFoodSection() {
    for (let i = 0; i < 3; i++) {
        let element = document.getElementById("selectFood_" + i);

        let gameFoods = Object.values(itemDetailMap)
            .filter((item) => item.categoryHrid == "/item_categories/food")
            .sort((a, b) => a.sortIndex - b.sortIndex);

        for (const food of Object.values(gameFoods)) {
            let opt = new Option(food.name, food.hrid);
            opt.setAttribute("data-i18n", "itemNames." + food.hrid);
            element.add(opt);
        }

        element.addEventListener("change", foodSelectHandler);
    }
}

function foodSelectHandler() {
    updateFoodState();
    updateUI();
}

function updateFoodState() {
    for (let i = 0; i < 3; i++) {
        let foodSelect = document.getElementById("selectFood_" + i);
        food[i] = foodSelect.value;
        if (food[i] && !triggerMap[food[i]]) {
            let gameItem = itemDetailMap[food[i]];
            triggerMap[food[i]] = structuredClone(gameItem.consumableDetail.defaultCombatTriggers);
        }
    }
}

function updateFoodUI() {
    for (let i = 0; i < 3; i++) {
        let selectElement = document.getElementById("selectFood_" + i);
        let triggerButton = document.getElementById("buttonFoodTrigger_" + i);

        selectElement.disabled = i >= player.combatDetails.combatStats.foodSlots;
        triggerButton.disabled = i >= player.combatDetails.combatStats.foodSlots || !food[i];
    }
}

// #endregion

// #region Drinks

function initDrinksSection() {
    for (let i = 0; i < 3; i++) {
        let element = document.getElementById("selectDrink_" + i);

        let gameDrinks = Object.values(itemDetailMap)
            .filter((item) => item.categoryHrid == "/item_categories/drink")
            .filter((item) => item.consumableDetail.usableInActionTypeMap["/action_types/combat"])
            .sort((a, b) => a.sortIndex - b.sortIndex);

        for (const drink of Object.values(gameDrinks)) {
            let opt = new Option(drink.name, drink.hrid);
            opt.setAttribute("data-i18n", "itemNames." + drink.hrid);
            element.add(opt);
        }

        element.addEventListener("change", drinkSelectHandler);
    }
}

function drinkSelectHandler() {
    updateDrinksState();
    updateDrinksUI();
    // 如果开启入战属性模式，实时更新（咖啡会影响入战属性）
    if (isCombatReadyMode) {
        updateCombatStatsUI();
    }
}

function updateDrinksState() {
    for (let i = 0; i < 3; i++) {
        let drinkSelect = document.getElementById("selectDrink_" + i);
        drinks[i] = drinkSelect.value;
        if (drinks[i] && !triggerMap[drinks[i]]) {
            let gameItem = itemDetailMap[drinks[i]];
            triggerMap[drinks[i]] = structuredClone(gameItem.consumableDetail.defaultCombatTriggers);
        }
    }
}

function updateDrinksUI() {
    for (let i = 0; i < 3; i++) {
        let selectElement = document.getElementById("selectDrink_" + i);
        let triggerButton = document.getElementById("buttonDrinkTrigger_" + i);

        selectElement.disabled = i >= player.combatDetails.combatStats.drinkSlots;
        triggerButton.disabled = i >= player.combatDetails.combatStats.drinkSlots || !drinks[i];
    }
}

// #endregion

// #region Abilities

function initAbilitiesSection() {
    for (let i = 0; i < 5; i++) {
        let selectElement = document.getElementById("selectAbility_" + i);
        let inputElement = document.getElementById("inputAbilityLevel_" + i);

        inputElement.value = 1;

        let gameAbilities;
        if (i == 0) {
            gameAbilities = Object.values(abilityDetailMap).filter(x => x.isSpecialAbility).sort((a, b) => a.sortIndex - b.sortIndex);
        } else {
            gameAbilities = Object.values(abilityDetailMap).filter(x => !x.isSpecialAbility).sort((a, b) => a.sortIndex - b.sortIndex);
        }


        for (const ability of Object.values(gameAbilities)) {
            let opt = new Option(ability.name, ability.hrid);
            opt.setAttribute("data-i18n", "abilityNames." + ability.hrid);
            selectElement.add(opt);
        }

        selectElement.addEventListener("change", abilitySelectHandler);
        // 技能等级改变时也需要更新入战属性
        inputElement.addEventListener("input", abilityLevelInputHandler);
    }
}

function abilityLevelInputHandler() {
    // 如果开启入战属性模式，实时更新（光环技能等级会影响入战属性）
    if (isCombatReadyMode) {
        updateCombatStatsUI();
    }
}

function abilitySelectHandler() {
    updateAbilityState();
    updateAbilityUI();
    // 如果开启入战属性模式，实时更新（光环技能会影响入战属性）
    if (isCombatReadyMode) {
        updateCombatStatsUI();
    }
}

function updateAbilityState() {
    for (let i = 0; i < 5; i++) {
        let abilitySelect = document.getElementById("selectAbility_" + i);
        abilities[i] = abilitySelect.value;
        if (abilities[i] && !triggerMap[abilities[i]]) {
            let gameAbility = abilityDetailMap[abilities[i]];
            triggerMap[abilities[i]] = structuredClone(gameAbility.defaultCombatTriggers);
        }
    }
}

function updateAbilityUI() {
    for (let i = 0; i < 5; i++) {
        let selectElement = document.getElementById("selectAbility_" + i);
        let inputElement = document.getElementById("inputAbilityLevel_" + i);
        let triggerButton = document.getElementById("buttonAbilityTrigger_" + i);

        selectElement.disabled = player.intelligenceLevel < abilitySlotsLevelRequirementList[i + 1];
        inputElement.disabled = player.intelligenceLevel < abilitySlotsLevelRequirementList[i + 1];
        triggerButton.disabled = player.intelligenceLevel < abilitySlotsLevelRequirementList[i + 1] || !abilities[i];
        let moveUpButton = document.getElementById("selectAbilityMoveUp_" + i);
        moveUpButton.onclick = () => swapAbilityOrder(i, -1);
    }
}

function swapAbilityOrder(abilityIndex, step) {
    const swapIndex = abilityIndex + step;
    if (swapIndex < 0 || swapIndex > 4) {
        return;
    }

    let abilitySelect = document.getElementById("selectAbility_" + abilityIndex);
    let abilityLevelInput = document.getElementById("inputAbilityLevel_" + abilityIndex);

    const tempAbility = abilities[abilityIndex];
    abilities[abilityIndex] = abilities[swapIndex];
    abilities[swapIndex] = tempAbility;

    const tempLevel = abilityLevelInput.value;
    abilityLevelInput.value = document.getElementById("inputAbilityLevel_" + swapIndex).value;
    document.getElementById("inputAbilityLevel_" + swapIndex).value = tempLevel;

    abilitySelect.value = document.getElementById("selectAbility_" + (swapIndex)).value;
    document.getElementById("selectAbility_" + swapIndex).value = abilities[swapIndex];

    updateAbilityState();
    updateAbilityUI();
}

// #endregion

// #region Trigger

function initTriggerModal() {
    let modal = document.getElementById("triggerModal");
    modal.addEventListener("show.bs.modal", (event) => triggerModalShownHandler(event));

    let triggerSaveButton = document.getElementById("buttonTriggerModalSave");
    triggerSaveButton.addEventListener("click", (event) => triggerModalSaveHandler(event));

    let triggerAddButton = document.getElementById("buttonAddTrigger");
    triggerAddButton.addEventListener("click", (event) => triggerAddButtonHandler(event));

    let triggerDefaultButton = document.getElementById("buttonDefaultTrigger");
    triggerDefaultButton.addEventListener("click", (event) => triggerDefaultButtonHandler(event));

    for (let i = 0; i < 4; i++) {
        let triggerDependencySelect = document.getElementById("selectTriggerDependency_" + i);
        let triggerConditionSelect = document.getElementById("selectTriggerCondition_" + i);
        let triggerComparatorSelect = document.getElementById("selectTriggerComparator_" + i);
        let triggerValueInput = document.getElementById("inputTriggerValue_" + i);
        let triggerRemoveButton = document.getElementById("buttonRemoveTrigger_" + i);

        triggerDependencySelect.addEventListener("change", (event) => triggerDependencySelectHandler(event, i));
        triggerConditionSelect.addEventListener("change", (event) => triggerConditionSelectHandler(event, i));
        triggerComparatorSelect.addEventListener("change", (event) => triggerComparatorSelectHander(event, i));
        triggerValueInput.addEventListener("change", (event) => triggerValueInputHandler(event, i));
        triggerRemoveButton.addEventListener("click", (event) => triggerRemoveButtonHandler(event, i));
    }
}

function triggerModalShownHandler(event) {
    let triggerButton = event.relatedTarget;

    let triggerType = triggerButton.getAttribute("data-bs-triggertype");
    let triggerIndex = Number(triggerButton.getAttribute("data-bs-triggerindex"));

    let triggerTarget;
    switch (triggerType) {
        case "food":
            triggerTarget = food[triggerIndex];
            break;
        case "drink":
            triggerTarget = drinks[triggerIndex];
            break;
        case "ability":
            triggerTarget = abilities[triggerIndex];
            break;
    }

    let triggerTargetnput = document.getElementById("inputModalTriggerTarget");
    triggerTargetnput.value = triggerTarget;
    modalTriggers = triggerMap[triggerTarget];
    updateTriggerModal();
}

function triggerModalSaveHandler(event) {
    let triggerTargetnput = document.getElementById("inputModalTriggerTarget");
    let triggerTarget = triggerTargetnput.value;

    triggerMap[triggerTarget] = modalTriggers;
}

function triggerDependencySelectHandler(event, index) {
    modalTriggers[index].dependencyHrid = event.target.value;
    modalTriggers[index].conditionHrid = "";
    modalTriggers[index].comparatorHrid = "";
    modalTriggers[index].value = 0;

    updateTriggerModal();
}

function triggerConditionSelectHandler(event, index) {
    modalTriggers[index].conditionHrid = event.target.value;
    modalTriggers[index].comparatorHrid = "";
    modalTriggers[index].value = 0;

    updateTriggerModal();
}

function triggerComparatorSelectHander(event, index) {
    modalTriggers[index].comparatorHrid = event.target.value;

    updateTriggerModal();
}

function triggerValueInputHandler(event, index) {
    modalTriggers[index].value = Number(event.target.value);

    updateTriggerModal();
}

function triggerRemoveButtonHandler(event, index) {
    modalTriggers.splice(index, 1);

    updateTriggerModal();
}

function triggerAddButtonHandler(event) {
    if (modalTriggers.length == 4) {
        return;
    }

    modalTriggers.push({
        dependencyHrid: "",
        conditionHrid: "",
        comparatorHrid: "",
        value: 0,
    });

    updateTriggerModal();
}

function triggerDefaultButtonHandler(event) {
    let triggerTargetnput = document.getElementById("inputModalTriggerTarget");
    let triggerTarget = triggerTargetnput.value;

    if (triggerTarget.startsWith("/items/")) {
        modalTriggers = structuredClone(itemDetailMap[triggerTarget].consumableDetail.defaultCombatTriggers);
    } else {
        modalTriggers = structuredClone(abilityDetailMap[triggerTarget].defaultCombatTriggers);
    }

    updateTriggerModal();
}

function updateTriggerModal() {
    let triggerStartTextElement = document.getElementById("triggerStartText");
    if (modalTriggers.length == 0) {
        triggerStartTextElement.innerHTML = "Activate as soon as it's off cooldown";
    } else {
        triggerStartTextElement.innerHTML = "Activate when:";
    }

    let triggerAddButton = document.getElementById("buttonAddTrigger");
    triggerAddButton.disabled = modalTriggers.length == 4;

    let triggersValid = true;

    for (let i = 0; i < 4; i++) {
        let triggerElement = document.getElementById("modalTrigger_" + i);

        if (!modalTriggers[i]) {
            hideElement(triggerElement);
            continue;
        }

        showElement(triggerElement);

        let triggerDependencySelect = document.getElementById("selectTriggerDependency_" + i);
        let triggerConditionSelect = document.getElementById("selectTriggerCondition_" + i);
        let triggerComparatorSelect = document.getElementById("selectTriggerComparator_" + i);
        let triggerValueInput = document.getElementById("inputTriggerValue_" + i);

        showElement(triggerDependencySelect);
        fillTriggerDependencySelect(triggerDependencySelect);

        if (modalTriggers[i].dependencyHrid == "") {
            hideElement(triggerConditionSelect);
            hideElement(triggerComparatorSelect);
            hideElement(triggerValueInput);
            triggersValid = false;
            continue;
        }

        triggerDependencySelect.value = modalTriggers[i].dependencyHrid;
        showElement(triggerConditionSelect);
        fillTriggerConditionSelect(triggerConditionSelect, modalTriggers[i].dependencyHrid);

        if (modalTriggers[i].conditionHrid == "") {
            hideElement(triggerComparatorSelect);
            hideElement(triggerValueInput);
            triggersValid = false;
            continue;
        }

        triggerConditionSelect.value = modalTriggers[i].conditionHrid;
        showElement(triggerComparatorSelect);
        fillTriggerComparatorSelect(triggerComparatorSelect, modalTriggers[i].conditionHrid);

        if (modalTriggers[i].comparatorHrid == "") {
            hideElement(triggerValueInput);
            triggersValid = false;
            continue;
        }

        triggerComparatorSelect.value = modalTriggers[i].comparatorHrid;

        if (combatTriggerComparatorDetailMap[modalTriggers[i].comparatorHrid].allowValue) {
            showElement(triggerValueInput);
            triggerValueInput.value = modalTriggers[i].value;
        } else {
            hideElement(triggerValueInput);
        }
    }

    let triggerSaveButton = document.getElementById("buttonTriggerModalSave");
    triggerSaveButton.disabled = !triggersValid;

    updateContent();
}

function fillTriggerDependencySelect(element) {
    element.length = 0;
    element.add(new Option("", ""));

    for (const dependency of Object.values(combatTriggerDependencyDetailMap).sort(
        (a, b) => a.sortIndex - b.sortIndex
    )) {
        let opt = new Option(dependency.name, dependency.hrid);
        opt.setAttribute("data-i18n", "combatTriggerDependencyNames." + dependency.hrid);
        element.add(opt);
    }
}

function fillTriggerConditionSelect(element, dependencyHrid) {
    let dependency = combatTriggerDependencyDetailMap[dependencyHrid];

    let conditions;
    if (dependency.isSingleTarget) {
        conditions = Object.values(combatTriggerConditionDetailMap).filter((condition) => condition.isSingleTarget);
    } else {
        conditions = Object.values(combatTriggerConditionDetailMap).filter((condition) => condition.isMultiTarget);
    }

    element.length = 0;
    element.add(new Option("", ""));

    for (const condition of Object.values(conditions).sort((a, b) => a.sortIndex - b.sortIndex)) {
        let opt = new Option(condition.name, condition.hrid);
        opt.setAttribute("data-i18n", "combatTriggerConditionNames." + condition.hrid);
        element.add(opt);
    }
}

function fillTriggerComparatorSelect(element, conditionHrid) {
    let condition = combatTriggerConditionDetailMap[conditionHrid];

    let comparators = condition.allowedComparatorHrids.map((hrid) => combatTriggerComparatorDetailMap[hrid]);

    element.length = 0;
    element.add(new Option("", ""));

    for (const comparator of Object.values(comparators).sort((a, b) => a.sortIndex - b.sortIndex)) {
        let opt = new Option(comparator.name, comparator.hrid);
        opt.setAttribute("data-i18n", "combatTriggerComparatorNames." + comparator.hrid);
        element.add(opt);
    }
}

function hideElement(element) {
    element.classList.remove("d-flex");
    element.classList.add("d-none");
}

function showElement(element) {
    element.classList.remove("d-none");
    element.classList.add("d-flex");
}

// #endregion

// #region Zones

function initZones() {
    let zoneSelect = document.getElementById("selectZone");

    // TOOD dungeon wave spawns
    let gameZones = Object.values(actionDetailMap)
        .filter((action) => action.type == "/action_types/combat" && action.category != "/action_categories/combat/dungeons")
        .sort((a, b) => a.sortIndex - b.sortIndex);

    for (const zone of Object.values(gameZones)) {
        let opt = new Option(zone.name, zone.hrid);
        opt.setAttribute("data-i18n", "actionNames." + zone.hrid);
        zoneSelect.add(opt);
    }


    let zoneCheckBox = document.getElementById("zoneCheckBox");
    let checkAllZonesToggle = document.getElementById('checkAllZones');

    let simAllZonesToggle = document.getElementById("simAllZoneToggle");
    simAllZonesToggle.addEventListener("change", (event) => {
        if (simAllZonesToggle.checked) {
            zoneCheckBox.classList.remove("d-none");
            zoneCheckBox.querySelectorAll(".zone-checkbox").forEach(checkbox => checkbox.checked = true);
            checkAllZonesToggle.checked = true;
        } else {
            zoneCheckBox.classList.add("d-none");
        }
    });

    let zoneHrids = Object.values(actionDetailMap)
        .filter((action) => action.type == "/action_types/combat" && action.category != "/action_categories/combat/dungeons" && action.combatZoneInfo.fightInfo.randomSpawnInfo.maxSpawnCount > 1)
        .sort((a, b) => a.sortIndex - b.sortIndex)
        .flat();

    for (const zoneHrid of zoneHrids) {
        const newZone = document.createElement('div');
        newZone.classList.add('form-check');
        newZone.innerHTML = `
            <input class="form-check-input zone-checkbox" type="checkbox" id="${zoneHrid.hrid}">
            <label class="form-check-label" for="${zoneHrid.hrid}" data-i18n="actionNames.${zoneHrid.hrid}">
                ${zoneHrid.name}
            </label>
        `;
        zoneCheckBox.append(newZone);
    }

    let checkZoneToggles = document.querySelectorAll('.zone-checkbox');
    checkAllZonesToggle.addEventListener('change', () => {
        checkZoneToggles.forEach(cb => cb.checked = checkAllZonesToggle.checked);
    });

    checkZoneToggles.forEach(cb =>
        cb.addEventListener('change', () => {
            checkAllZonesToggle.checked = [...checkZoneToggles].every(x => x.checked);
        })
    );


    let soloCheckBox = document.getElementById("soloCheckBox");
    let checkAllSolosToggle = document.getElementById('checkAllSolos');

    let simAllSoloToggle = document.getElementById("simAllSoloToggle");
    simAllSoloToggle.addEventListener("change", (event) => {
        if (simAllSoloToggle.checked) {
            soloCheckBox.classList.remove("d-none");
            soloCheckBox.querySelectorAll(".solo-checkbox").forEach(checkbox => checkbox.checked = true);
            checkAllSolosToggle.checked = true;
        } else {
            soloCheckBox.classList.add("d-none");
        }
    });

    let soloHrids = Object.values(actionDetailMap)
        .filter((action) => action.type == "/action_types/combat" && action.category != "/action_categories/combat/dungeons" && action.combatZoneInfo.fightInfo.randomSpawnInfo.maxSpawnCount == 1)
        .sort((a, b) => a.sortIndex - b.sortIndex)
        .flat();

    for (const zoneHrid of soloHrids) {
        const newZone = document.createElement('div');
        newZone.classList.add('form-check');
        newZone.innerHTML = `
            <input class="form-check-input solo-checkbox" type="checkbox" id="${zoneHrid.hrid}">
            <label class="form-check-label" for="${zoneHrid.hrid}" data-i18n="actionNames.${zoneHrid.hrid}">
                ${zoneHrid.name}
            </label>
        `;
        soloCheckBox.append(newZone);
    }

    let checkSoloToggles = document.querySelectorAll('.solo-checkbox');
    checkAllSolosToggle.addEventListener('change', () => {
        checkSoloToggles.forEach(cb => cb.checked = checkAllSolosToggle.checked);
    });

    checkSoloToggles.forEach(cb =>
        cb.addEventListener('change', () => {
            checkAllSolosToggle.checked = [...checkSoloToggles].every(x => x.checked);
        })
    );
}

function initDungeons() {
    let dungeonSelect = document.getElementById("selectDungeon");

    let gameDungeons = Object.values(actionDetailMap)
        .filter((action) => action.type == "/action_types/combat" && action.category == "/action_categories/combat/dungeons")
        .sort((a, b) => a.sortIndex - b.sortIndex);

    for (const dungeon of Object.values(gameDungeons)) {
        let opt = new Option(dungeon.name, dungeon.hrid);
        opt.setAttribute("data-i18n", "actionNames." + dungeon.hrid);
        dungeonSelect.add(opt);
    }
}

// #endregion

// #region Simulation Result

function createDamageDoneAccordion(enemyIndex) {
    const accordionDiv = createElement('div', 'row d-none', '', `simulationResultDamageDoneAccordionEnemy${enemyIndex}`);

    const colDiv = createElement('div', 'col');
    const accordionMainDiv = createElement('div', 'accordion');
    const accordionItemDiv = createElement('div', 'accordion-item');

    const headerH2 = createElement('h2', 'accordion-header');
    const button = createElement('button', 'accordion-button collapsed',
        `<b>Damage Done (Enemy ${enemyIndex})</b>`,
        `buttonSimulationResultDamageDoneAccordionEnemy${enemyIndex}`
    );
    button.setAttribute('type', 'button');
    button.setAttribute('data-bs-toggle', 'collapse');
    button.setAttribute('data-bs-target', `#collapseDamageDone${enemyIndex}`);
    button.style.padding = '0.5em';

    const collapseDiv = createElement('div', 'accordion-collapse collapse', '', `collapseDamageDone${enemyIndex}`);
    const accordionBodyDiv = createElement('div', 'accordion-body');

    const headerRow = createElement('div', 'row');
    headerRow.innerHTML = `
        <div class="col-md-5"><b data-i18n="common:simulationResults.source">Source</b></div>
        <div class="col-md-3 text-end"><b data-i18n="common:simulationResults.hitChance">Hitchance</b></div>
        <div class="col-md-2 text-end"><b>DPS</b></div>
        <div class="col-md-2 text-end"><b>%</b></div>
    `;

    const resultDiv = createElement('div', '', '', `simulationResultDamageDoneEnemy${enemyIndex}`);

    accordionBodyDiv.appendChild(headerRow);
    accordionBodyDiv.appendChild(resultDiv);
    collapseDiv.appendChild(accordionBodyDiv);
    headerH2.appendChild(button);
    accordionItemDiv.appendChild(headerH2);
    accordionItemDiv.appendChild(collapseDiv);
    accordionMainDiv.appendChild(accordionItemDiv);
    colDiv.appendChild(accordionMainDiv);
    accordionDiv.appendChild(colDiv);

    return accordionDiv;
}
function createDamageTakenAccordion(enemyIndex) {
    const accordionDiv = createElement('div', 'row d-none', '', `simulationResultDamageTakenAccordionEnemy${enemyIndex}`);

    const colDiv = createElement('div', 'col');
    const accordionMainDiv = createElement('div', 'accordion');
    const accordionItemDiv = createElement('div', 'accordion-item');

    const headerH2 = createElement('h2', 'accordion-header');
    const button = createElement('button', 'accordion-button collapsed',
        `<b>Damage Taken (Enemy ${enemyIndex})</b>`,
        `buttonSimulationResultDamageTakenAccordionEnemy${enemyIndex}`
    );
    button.setAttribute('type', 'button');
    button.setAttribute('data-bs-toggle', 'collapse');
    button.setAttribute('data-bs-target', `#collapseDamageTaken${enemyIndex}`);
    button.style.padding = '0.5em';

    const collapseDiv = createElement('div', 'accordion-collapse collapse', '', `collapseDamageTaken${enemyIndex}`);
    const accordionBodyDiv = createElement('div', 'accordion-body');

    const headerRow = createElement('div', 'row');
    headerRow.innerHTML = `
        <div class="col-md-5"><b data-i18n="common:simulationResults.source">Source</b></div>
        <div class="col-md-3 text-end"><b data-i18n="common:simulationResults.hitChance">Hitchance</b></div>
        <div class="col-md-2 text-end"><b>DPS</b></div>
        <div class="col-md-2 text-end"><b>%</b></div>
    `;

    const resultDiv = createElement('div', '', '', `simulationResultDamageTakenEnemy${enemyIndex}`);

    accordionBodyDiv.appendChild(headerRow);
    accordionBodyDiv.appendChild(resultDiv);
    collapseDiv.appendChild(accordionBodyDiv);
    headerH2.appendChild(button);
    accordionItemDiv.appendChild(headerH2);
    accordionItemDiv.appendChild(collapseDiv);
    accordionMainDiv.appendChild(accordionItemDiv);
    colDiv.appendChild(accordionMainDiv);
    accordionDiv.appendChild(colDiv);

    return accordionDiv;
}


function initDamageDoneTaken() {
    for (let i = 64; i > 0; i--) {
        document.getElementById("simulationResultTotalDamageDone").insertAdjacentElement('afterend', createDamageDoneAccordion(i));
        document.getElementById("simulationResultTotalDamageTaken").insertAdjacentElement('afterend', createDamageTakenAccordion(i));
    }
}

function showSimulationResult(simResult) {
    currentSimResults = simResult;
    let expensesModalTable = document.querySelector("#expensesTable > tbody");
    expensesModalTable.innerHTML = '<th data-i18n=\"marketplacePanel.item\">Item</th><th data-i18n=\"marketplacePanel.price\">Price</th><th data-i18n=\"common:amount\">Amount</th><th data-i18n=\"common:total\">Total</th>';
    let revenueModalTable = document.querySelector("#revenueTable > tbody");
    revenueModalTable.innerHTML = '<th data-i18n=\"marketplacePanel.item\">Item</th><th data-i18n=\"marketplacePanel.price\">Price</th><th data-i18n=\"common:amount\">Amount</th><th data-i18n=\"common:total\">Total</th>';
    let noRngRevenueModalTable = document.querySelector("#noRngRevenueTable > tbody");
    noRngRevenueModalTable.innerHTML = '<th data-i18n=\"marketplacePanel.item\">Item</th><th data-i18n=\"marketplacePanel.price\">Price</th><th data-i18n=\"common:amount\">Amount</th><th data-i18n=\"common:total\">Total</th>';
    let playerToDisplay = "player1";
    if (selectedPlayers.includes(parseInt(currentPlayerTabId))) {
        playerToDisplay = "player" + currentPlayerTabId;
    }
    if (!simResult.dropRateMultiplier[playerToDisplay]) {
        return;
    }

    showKills(simResult, playerToDisplay);
    showDeaths(simResult, playerToDisplay);
    showExperienceGained(simResult, playerToDisplay);
    showConsumablesUsed(simResult, playerToDisplay);
    showHpSpent(simResult, playerToDisplay);
    showManaUsed(simResult, playerToDisplay);
    showHitpointsGained(simResult, playerToDisplay);
    showManapointsGained(simResult, playerToDisplay);
    showDamageDone(simResult, playerToDisplay);
    showDamageTaken(simResult, playerToDisplay);
    renderWipeEvents(simResult);
    window.profit = window.revenue - window.expenses;
    document.getElementById('profitSpan').innerText = window.profit.toLocaleString();
    document.getElementById('profitPreview').innerText = window.profit.toLocaleString();
    window.noRngProfit = window.noRngRevenue - window.expenses;
    document.getElementById('noRngProfitSpan').innerText = window.noRngProfit.toLocaleString();
    document.getElementById('noRngProfitPreview').innerText = window.noRngProfit.toLocaleString();
    
    // 显示战斗图表
    if (document.getElementById('hpMpVisualizationToggle').checked) {
        renderCombatCharts(simResult);
    }
}

function showAllSimulationResults(simResults) {
    let displaySimResults = manipulateSimResultsDataForDisplay(simResults);
    updateAllSimsModal(displaySimResults);
}

// #region 战斗图表功能

let combatCharts = {
    hpChart: null,
    mpChart: null
};

let lastUpdateTime = 0;
const UPDATE_INTERVAL = 1000; // 每秒更新一次图表

// 实时更新图表
function updateChartsRealtime(timeSeriesData) {
    // 节流：避免过于频繁的更新
    const now = Date.now();
    if (now - lastUpdateTime < UPDATE_INTERVAL) {
        return;
    }
    lastUpdateTime = now;
    
    if (!timeSeriesData || !timeSeriesData.timestamps || timeSeriesData.timestamps.length === 0) {
        return;
    }
    
    // 显示图表容器
    const container = document.getElementById('combatChartsContainer');
    if (container) {
        container.classList.remove('d-none');
    }
    
    // 如果图表不存在，先创建
    if (!combatCharts.hpChart || !combatCharts.mpChart) {
        initializeRealtimeCharts();
        // 等待下一次更新周期再更新数据
        return;
    }
    
    const timeLabels = timeSeriesData.timestamps.map(t => (t / ONE_SECOND).toFixed(1));
    const playerIds = Object.keys(timeSeriesData.players);
    
    // 生成颜色方案
    const colors = [
        { border: 'rgb(75, 192, 192)', bg: 'rgba(75, 192, 192, 0.2)' },
        { border: 'rgb(255, 99, 132)', bg: 'rgba(255, 99, 132, 0.2)' },
        { border: 'rgb(54, 162, 235)', bg: 'rgba(54, 162, 235, 0.2)' },
        { border: 'rgb(255, 206, 86)', bg: 'rgba(255, 206, 86, 0.2)' },
        { border: 'rgb(153, 102, 255)', bg: 'rgba(153, 102, 255, 0.2)' }
    ];
    
    // 重建datasets以确保完整更新
    const hpDatasets = playerIds.map((playerId, index) => {
        const playerData = timeSeriesData.players[playerId];
        return {
            label: playerId + ' HP',
            data: playerData.hp,
            borderColor: colors[index % colors.length].border,
            backgroundColor: colors[index % colors.length].bg,
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.1
        };
    });
    
    const mpDatasets = playerIds.map((playerId, index) => {
        const playerData = timeSeriesData.players[playerId];
        return {
            label: playerId + ' MP',
            data: playerData.mp,
            borderColor: colors[index % colors.length].border,
            backgroundColor: colors[index % colors.length].bg,
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.1
        };
    });
    
    // 更新HP图表
    combatCharts.hpChart.data.labels = timeLabels;
    combatCharts.hpChart.data.datasets = hpDatasets;
    combatCharts.hpChart.options.plugins.legend.display = true;
    combatCharts.hpChart.options.plugins.title.text = i18next.t('common:Experiment.hpOverTime');
    combatCharts.hpChart.update('none');
    
    // 更新MP图表
    combatCharts.mpChart.data.labels = timeLabels;
    combatCharts.mpChart.data.datasets = mpDatasets;
    combatCharts.mpChart.options.plugins.legend.display = true;
    combatCharts.mpChart.options.plugins.title.text = i18next.t('common:Experiment.mpOverTime');
    combatCharts.mpChart.update('none');
}

function renderCombatCharts(simResult) {
    // 显示图表容器
    const container = document.getElementById('combatChartsContainer');
    if (container) {
        container.classList.remove('d-none');
    }
    
    if (!simResult.timeSeriesData || !simResult.timeSeriesData.timestamps || simResult.timeSeriesData.timestamps.length === 0) {
        // 显示空状态
        showEmptyCharts();
        return;
    }
    
    const timeLabels = simResult.timeSeriesData.timestamps.map(t => (t / ONE_SECOND).toFixed(1));
    
    // 获取所有玩家
    const playerIds = Object.keys(simResult.timeSeriesData.players);
    
    // 生成颜色方案
    const colors = [
        { border: 'rgb(75, 192, 192)', bg: 'rgba(75, 192, 192, 0.2)' },
        { border: 'rgb(255, 99, 132)', bg: 'rgba(255, 99, 132, 0.2)' },
        { border: 'rgb(54, 162, 235)', bg: 'rgba(54, 162, 235, 0.2)' },
        { border: 'rgb(255, 206, 86)', bg: 'rgba(255, 206, 86, 0.2)' },
        { border: 'rgb(153, 102, 255)', bg: 'rgba(153, 102, 255, 0.2)' }
    ];
    
    // HP图表
    destroyChart('hpChart');
    const hpDatasets = playerIds.map((playerId, index) => {
        const playerData = simResult.timeSeriesData.players[playerId];
        return {
            label: playerId + ' HP',
            data: playerData.hp,
            borderColor: colors[index % colors.length].border,
            backgroundColor: colors[index % colors.length].bg,
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.1
        };
    });
    
    combatCharts.hpChart = new Chart(document.getElementById('hpChart'), {
        type: 'line',
        data: {
            labels: timeLabels,
            datasets: hpDatasets
        },
        options: getChartOptions(i18next.t('common:Experiment.hpOverTime'), i18next.t('common:Experiment.timeInSeconds'), 'HP')
    });
    
    // MP图表
    destroyChart('mpChart');
    const mpDatasets = playerIds.map((playerId, index) => {
        const playerData = simResult.timeSeriesData.players[playerId];
        return {
            label: playerId + ' MP',
            data: playerData.mp,
            borderColor: colors[index % colors.length].border,
            backgroundColor: colors[index % colors.length].bg,
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.1
        };
    });
    
    combatCharts.mpChart = new Chart(document.getElementById('mpChart'), {
        type: 'line',
        data: {
            labels: timeLabels,
            datasets: mpDatasets
        },
        options: getChartOptions(i18next.t('common:Experiment.mpOverTime'), i18next.t('common:Experiment.timeInSeconds'), 'MP')
    });
}

function destroyChart(chartName) {
    if (combatCharts[chartName]) {
        combatCharts[chartName].destroy();
        combatCharts[chartName] = null;
    }
}

function getChartOptions(title, xLabel, yLabel) {
    return {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                display: true,
                position: 'top',
                labels: {
                    color: '#eee',
                    font: {
                        size: 11
                    }
                }
            },
            title: {
                display: true,
                text: title,
                color: '#eee',
                font: {
                    size: 14
                }
            }
        },
        scales: {
            x: {
                display: true,
                title: {
                    display: true,
                    text: xLabel,
                    color: '#eee'
                },
                ticks: {
                    color: '#ccc',
                    maxTicksLimit: 10
                },
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                }
            },
            y: {
                display: true,
                title: {
                    display: true,
                    text: yLabel,
                    color: '#eee'
                },
                ticks: {
                    color: '#ccc'
                },
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                }
            }
        },
        interaction: {
            intersect: false,
            mode: 'index'
        }
    };
}

// 初始化实时图表（用于模拟过程中更新）
function initializeRealtimeCharts() {
    // 销毁现有图表
    destroyChart('hpChart');
    destroyChart('mpChart');
    
    const hpCanvas = document.getElementById('hpChart');
    const mpCanvas = document.getElementById('mpChart');
    
    if (!hpCanvas || !mpCanvas) {
        console.warn('图表canvas元素未找到');
        return;
    }
    
    // 显示等待状态
    const emptyOptions = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: { display: false },
            title: {
                display: true,
                text: i18next.t('common:Experiment.waitingForData'),
                color: '#888',
                font: { size: 14 }
            }
        },
        scales: {
            x: {
                display: true,
                ticks: { color: '#555' },
                grid: { color: 'rgba(255, 255, 255, 0.05)' }
            },
            y: {
                display: true,
                ticks: { color: '#555' },
                grid: { color: 'rgba(255, 255, 255, 0.05)' }
            }
        }
    };
    
    try {
        combatCharts.hpChart = new Chart(hpCanvas, {
            type: 'line',
            data: { labels: [], datasets: [] },
            options: emptyOptions
        });
        
        combatCharts.mpChart = new Chart(mpCanvas, {
            type: 'line',
            data: { labels: [], datasets: [] },
            options: emptyOptions
        });
    } catch (e) {
        console.error('创建图表时出错:', e);
    }
}

// 显示空图表状态
function showEmptyCharts() {
    initializeRealtimeCharts();
}

// 初始化HP/MP可视化开关事件
function initHpMpVisualization() {
    const toggle = document.getElementById('hpMpVisualizationToggle');
    const container = document.getElementById('combatChartsContainer');
    
    if (toggle && container) {
        toggle.addEventListener('change', function() {
            if (this.checked) {
                container.classList.remove('d-none');
                showEmptyCharts();
            } else {
                container.classList.add('d-none');
                destroyChart('hpChart');
                destroyChart('mpChart');
            }
        });
    }
}

// #endregion

function manipulateSimResultsDataForDisplay(simResults) {
    let displaySimResults = [];
    for (let i = 0; i < simResults.length; i++) {
        for (let j = 0; j < selectedPlayers.length; j++) {
            let playerToDisplay = "player" + selectedPlayers[j].toString();
            let simResult = simResults[i];
            let hoursSimulated = simResult.simulatedTime / ONE_HOUR;
            let zoneName = simResult.zoneName;
            let difficultyTier = simResult.difficultyTier;
            let encountersPerHour = (simResult.encounters / hoursSimulated).toFixed(1);
            let playerDeaths = simResult.deaths[playerToDisplay] ?? 0;
            let deathsPerHour = (playerDeaths / hoursSimulated).toFixed(2);

            let totalExperience = 0;
            if (simResult.experienceGained[playerToDisplay]) {
                totalExperience = Object.values(simResult.experienceGained[playerToDisplay]).reduce((prev, cur) => prev + cur, 0);
            }
            let totalExperiencePerHour = (totalExperience / hoursSimulated).toFixed(0);

            let experiencePerHour = {};
            const skills = ["Stamina", "Intelligence", "Attack", "Melee", "Defense", "Ranged", "Magic"];
            skills.forEach((skill) => {
                const skillLower = skill.toLowerCase();
                let experience = simResult.experienceGained[playerToDisplay]?.[skillLower] ?? 0;
                let experiencePerHourValue = 0;
                if (experience != 0) {
                    experiencePerHourValue = (experience / hoursSimulated).toFixed(0);
                }
                experiencePerHour[skill] = experiencePerHourValue;
            });
            getDropProfit(simResult, playerToDisplay);
            let noRngRevenue = simResult["noRngRevenue"];
            let noRngProfit = simResult["noRngProfit"];
            let expenses = simResult["expenses"];

            let displaySimRow = {
                "ZoneName": zoneName, "DifficultyTier": difficultyTier, "Player": playerToDisplay, "Encounters": encountersPerHour, "Deaths": deathsPerHour,
                "TotalExperience": totalExperiencePerHour, "Stamina": experiencePerHour["Stamina"],
                "Intelligence": experiencePerHour["Intelligence"], "Attack": experiencePerHour["Attack"],
                "Magic": experiencePerHour["Magic"], "Ranged": experiencePerHour["Ranged"],
                "Melee": experiencePerHour["Melee"], "Defense": experiencePerHour["Defense"],
                "noRngRevenue": noRngRevenue,
                "expenses": expenses,
                "noRngProfit": noRngProfit
            };
            displaySimResults.push(displaySimRow);
        }
    }
    return displaySimResults;
}

function fidDropAmount(dropAmount) {
  if (Number.isInteger(dropAmount)) return dropAmount;

  const intPart   = Math.floor(dropAmount);
  const fracPart  = dropAmount - intPart;
  return Math.random() < fracPart ? intPart + 1 : intPart;
}

function calcDropMaps(simResult, playerToDisplay) {
    let dropRateMultiplier = simResult.dropRateMultiplier[playerToDisplay];
    let rareFindMultiplier = simResult.rareFindMultiplier[playerToDisplay];
    let combatDropQuantity = simResult.combatDropQuantity[playerToDisplay];
    let debuffOnLevelGap = simResult.debuffOnLevelGap[playerToDisplay];

    let numberOfPlayers = simResult.numberOfPlayers;
    let monsters = Object.keys(simResult.deaths)
        .filter(enemy => enemy !== "player1" && enemy !== "player2" && enemy !== "player3" && enemy !== "player4" && enemy !== "player5")
        .sort();

    const totalDropMap = new Map();
    const noRngTotalDropMap = new Map();
    for (const monster of monsters) {
        const dropMap = new Map();
        const rareDropMap = new Map();
        if (combatMonsterDetailMap[monster].dropTable) {
            for (const drop of combatMonsterDetailMap[monster].dropTable) {
                if (drop.minDifficultyTier > simResult.difficultyTier) {
                    continue;
                }

                let multiplier = 1.0 + 0.1 * simResult.difficultyTier;
                let dropRate = Math.min(1.0, multiplier * (drop.dropRate + (drop.dropRatePerDifficultyTier ?? 0) * simResult.difficultyTier));
                if (dropRate <= 0) continue;

                dropMap.set(drop.itemHrid, { "dropRate": Math.min(1.0, dropRate * dropRateMultiplier), "number": 0, "dropMin": drop.minCount, "dropMax": drop.maxCount, "noRngDropAmount": 0 });
            }
            if (combatMonsterDetailMap[monster].rareDropTable)
                for (const drop of combatMonsterDetailMap[monster].rareDropTable) {
                    if (drop.minDifficultyTier > simResult.difficultyTier) {
                        continue;
                    }
                    rareDropMap.set(drop.itemHrid, { "dropRate": drop.dropRate * rareFindMultiplier, "number": 0, "dropMin": drop.minCount, "dropMax": drop.maxCount, "noRngDropAmount": 0 });
                }

            for (let dropObject of dropMap.values()) {
                dropObject.noRngDropAmount += simResult.deaths[monster] * dropObject.dropRate * ((dropObject.dropMax + dropObject.dropMin) / 2) * (1 + debuffOnLevelGap) * (1 + combatDropQuantity) / numberOfPlayers;

            }
            for (let dropObject of rareDropMap.values()) {
                dropObject.noRngDropAmount += simResult.deaths[monster] * dropObject.dropRate * ((dropObject.dropMax + dropObject.dropMin) / 2) * (1 + debuffOnLevelGap) * (1 + combatDropQuantity) / numberOfPlayers;
            }

            for (let i = 0; i < simResult.deaths[monster]; i++) {
                for (let dropObject of dropMap.values()) {
                    let chance = Math.random();
                    if (chance <= dropObject.dropRate / numberOfPlayers) {
                        let amount = Math.floor(Math.random() * (dropObject.dropMax - dropObject.dropMin + 1) + dropObject.dropMin) * (1 + debuffOnLevelGap) * (1 + combatDropQuantity);
                        dropObject.number = dropObject.number + fidDropAmount(amount);
                    }
                }
                for (let dropObject of rareDropMap.values()) {
                    let chance = Math.random();
                    if (chance <= dropObject.dropRate / numberOfPlayers) {
                        let amount = Math.floor(Math.random() * (dropObject.dropMax - dropObject.dropMin + 1) + dropObject.dropMin) * (1 + debuffOnLevelGap) * (1 + combatDropQuantity);
                        dropObject.number = dropObject.number + fidDropAmount(amount);
                    }
                }
            }
            for (let [name, dropObject] of dropMap.entries()) {
                if (totalDropMap.has(name)) {
                    totalDropMap.set(name, totalDropMap.get(name) + dropObject.number);
                } else {
                    totalDropMap.set(name, dropObject.number);
                }
                if (noRngTotalDropMap.has(name)) {
                    noRngTotalDropMap.set(name, noRngTotalDropMap.get(name) + dropObject.noRngDropAmount);
                } else {
                    noRngTotalDropMap.set(name, dropObject.noRngDropAmount);
                }
            }
            for (let [name, dropObject] of rareDropMap.entries()) {
                if (totalDropMap.has(name)) {
                    totalDropMap.set(name, totalDropMap.get(name) + dropObject.number);
                } else {
                    totalDropMap.set(name, dropObject.number);
                }
                if (noRngTotalDropMap.has(name)) {
                    noRngTotalDropMap.set(name, noRngTotalDropMap.get(name) + dropObject.noRngDropAmount);
                } else {
                    noRngTotalDropMap.set(name, dropObject.noRngDropAmount);
                }
            }
        }
    }

    return { totalDropMap, noRngTotalDropMap };
}

function getDropProfit(simResult, playerToDisplay) {
    let { totalDropMap, noRngTotalDropMap } = calcDropMaps(simResult, playerToDisplay);

    let noRngTotal = 0;
    for (let [name, dropAmount] of noRngTotalDropMap.entries()) {
        let price = -1;
        let revenueSetting = document.getElementById('selectPrices_drops').value;
        if (window.prices) {
            let item = window.prices[name];
            if (item) {
                if (revenueSetting == 'bid') {
                    if (item['bid'] !== -1) {
                        price = item['bid'];
                    } else if (item['ask'] !== -1) {
                        price = item['ask'];
                    }
                } else if (revenueSetting == 'ask') {
                    if (item['ask'] !== -1) {
                        price = item['ask'];
                    } else if (item['bid'] !== -1) {
                        price = item['bid'];
                    }
                }
                if (price == -1) {
                    price = item['vendor'];
                }
            }
        }
        noRngTotal += price * dropAmount;
    }

    let consumablesUsed = simResult.consumablesUsed?.[playerToDisplay];

    if (consumablesUsed) {
        consumablesUsed = Object.entries(consumablesUsed).sort((a, b) => b[1] - a[1]);
    } else {
        consumablesUsed = [];
    }

    let expenses = 0;
    for (const [consumable, amount] of consumablesUsed) {
        let price = -1;
        let expensesSetting = document.getElementById('selectPrices_consumables').value;
        if (window.prices) {
            let item = window.prices[consumable];
            if (item) {
                if (expensesSetting == 'bid') {
                    if (item['bid'] !== -1) {
                        price = item['bid'];
                    } else if (item['ask'] !== -1) {
                        price = item['ask'];
                    }
                } else if (expensesSetting == 'ask') {
                    if (item['ask'] !== -1) {
                        price = item['ask'];
                    } else if (item['bid'] !== -1) {
                        price = item['bid'];
                    }
                }
                if (price == -1) {
                    price = item['vendor'];
                }
            }
        }
        expenses += price * amount;
    }

    simResult["noRngRevenue"] = (noRngTotal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    simResult["expenses"] = (expenses).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    simResult["noRngProfit"] = (noRngTotal - expenses).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function updateAllSimsModal(data) {
    const tableBody = document.getElementById('allZonesData').getElementsByTagName('tbody')[0];
    tableBody.innerHTML = '';
    data.forEach(item => {
        const row = document.createElement('tr');

        Object.keys(item).forEach(key => {
            const cell = document.createElement('td');
            cell.textContent = item[key];
            if (key === 'ZoneName') {
                cell.setAttribute("data-i18n", "actionNames." + item[key]);
            }
            row.appendChild(cell);
        });

        tableBody.appendChild(row);
    });

    const table = document.getElementById('allZonesData');
    const rows = table.getElementsByTagName('tr');
    const numCols = rows[0].cells.length;

    // 遍历每一列
    for (let col = 5; col < numCols; col++) {
        let max = -Infinity;
        let maxCell = null;

        // 找到最大值及其单元格
        for (let row = 1; row < rows.length; row++) {
            const cell = rows[row].cells[col];
            const value = parseFloat(cell.textContent.replace(/,/g, ''));
            if (value > max) {
                max = value;
                maxCell = cell;
            }
        }

        // 将最大值单元格的背景色设置为绿色
        if (maxCell && max != 0) {
            maxCell.style.backgroundColor = 'green';
            maxCell.style.color = 'white'; // 设置文字颜色为白色以提高可读性
        }
    }
}

let currentSortColumn = null;
let currentSortDirection = 'desc';

function sortTable(tableId, columnIndex, direction) {
    const table = document.getElementById(tableId);
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));

    const sortedRows = rows.sort((rowA, rowB) => {
        const cellA = rowA.children[columnIndex].textContent.trim().replace(/[\s,]/g, '');
        const cellB = rowB.children[columnIndex].textContent.trim().replace(/[\s,]/g, '');

        const valueA = parseFloat(cellA.replace(/,/g, ''));
        const valueB = parseFloat(cellB.replace(/,/g, ''));

        return direction === 'asc' ? valueA - valueB : valueB - valueA;
    });

    sortedRows.forEach(row => tbody.appendChild(row));
    updateSortIndicators(tableId, columnIndex, direction);
}

function updateSortIndicators(tableId, columnIndex, direction) {
    const headers = document.querySelectorAll(`#${tableId} th`);
    headers.forEach((header, index) => {
        header.classList.remove('sort-asc', 'sort-desc');
        if (index === columnIndex) {
            header.classList.add(direction === 'asc' ? 'sort-asc' : 'sort-desc');
        }
    });
}

document.querySelectorAll('#allZonesData th').forEach((header, index) => {
    if (index === 0) return;
    if (index === 1) return;
    if (index === 2) return;

    header.addEventListener('click', () => {
        if (currentSortColumn === index) {
            currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            currentSortColumn = index;
            currentSortDirection = 'desc';
        }
        sortTable('allZonesData', currentSortColumn, currentSortDirection);
    });
});

document.getElementById('buttonExportResults').addEventListener('click', function () {
    var table = document.getElementById('allZonesData');
    var csv = [];
    var rows = table.querySelectorAll('tr');

    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        var cols = row.querySelectorAll('th, td');
        var csvRow = [];

        cols.forEach(function (col) {
            csvRow.push('"' + col.innerText.replace(/"/g, '""') + '"');
        });

        csv.push(csvRow.join(','));
    }

    var csvFile = new Blob([csv.join('\n')], { type: 'text/csv' });
    var downloadLink = document.createElement('a');
    downloadLink.download = 'simData.csv';
    downloadLink.href = URL.createObjectURL(csvFile);
    downloadLink.style.display = 'none';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
});

function showKills(simResult, playerToDisplay) {
    let resultDiv = document.getElementById("simulationResultKills");
    let dropsResultDiv = document.getElementById("simulationResultDrops");
    let noRngDropsResultDiv = document.getElementById("noRngDrops");
    let newChildren = [];
    let newDropChildren = [];
    let newNoRngDropChildren = [];

    let hoursSimulated = simResult.simulatedTime / ONE_HOUR;
    let encountersPerHour = 0;
    let encountersRow = null;
    if (simResult.isDungeon) {
        let wavesCompletedRow = createRow(["col-md-6", "col-md-6 text-end"], ["Max Wave Reached", simResult.maxWaveReached]);
        wavesCompletedRow.firstElementChild.setAttribute("data-i18n", "common:simulationResults.maxWaveReached");
        newChildren.push(wavesCompletedRow);
        let completedDungeonsRow = createRow(["col-md-6", "col-md-6 text-end"], ["Completed Dungeons", simResult.dungeonsCompleted]);
        completedDungeonsRow.firstElementChild.setAttribute("data-i18n", "common:simulationResults.dungeonsCompleted");
        newChildren.push(completedDungeonsRow);
        if (simResult.dungeonsFailed > 0) {
            let failedDungeonsRow = createRow(["col-md-6", "col-md-6 text-end"], ["Failed Dungeons", simResult.dungeonsFailed]);
            failedDungeonsRow.firstElementChild.setAttribute("data-i18n", "common:simulationResults.dungeonsFailed");
            newChildren.push(failedDungeonsRow);
        }
        encountersPerHour = (simResult.dungeonsCompleted / hoursSimulated).toFixed(1);
        let averageTime = (hoursSimulated * 60 / simResult.dungeonsCompleted).toFixed(1);
        encountersRow = createRow(["col-md-6", "col-md-6 text-end"], ["Average Time", averageTime]);
        encountersRow.firstElementChild.setAttribute("data-i18n", "common:simulationResults.averageTime");
        if (simResult.minDungenonTime > 0) {
            let minimumTime = (simResult.minDungenonTime / ONE_SECOND / 60).toFixed(1);
            let minimumTimeRow = createRow(["col-md-6", "col-md-6 text-end"], ["Minimum Time", minimumTime]);
            minimumTimeRow.firstElementChild.setAttribute("data-i18n", "common:simulationResults.minimumTime");
            newChildren.push(minimumTimeRow);
        }
    } else {
        encountersPerHour = (simResult.encounters / hoursSimulated).toFixed(1);
        encountersRow = createRow(["col-md-6", "col-md-6 text-end"], ["Encounters", encountersPerHour]);
        encountersRow.firstElementChild.setAttribute("data-i18n", "common:simulationResults.encounters");
    }

    if (simResult.maxEnrageStack > 0) {
        let enrageRow = createRow(["col-md-6", "col-md-6 text-end"], ["Max Enrage Stack", simResult.maxEnrageStack]);
        enrageRow.firstElementChild.setAttribute("data-i18n", "common:simulationResults.maxEnrageStack");
        newChildren.push(enrageRow);
    }

    if (simResult.debuffOnLevelGap[playerToDisplay] != 0) {
        let debuffOnLevelGapRow = createRow(["col-md-6", "col-md-6 text-end"], ["Debuff on Level Gap", Math.round(simResult.debuffOnLevelGap[playerToDisplay] * 100) + "%"]);
        debuffOnLevelGapRow.firstElementChild.setAttribute("data-i18n", "common:simulationResults.debuffOnLevelGap");
        newChildren.push(debuffOnLevelGapRow);
    }

    newChildren.push(encountersRow);

    Object.keys(simResult.deaths)
        .filter(enemy => enemy !== "player1" && enemy !== "player2" && enemy !== "player3" && enemy !== "player4" && enemy !== "player5")
        .sort()
        .forEach(monster => {
            let killsPerHour = (simResult.deaths[monster] / hoursSimulated).toFixed(1);
            let monsterRow = createRow(
                ["col-md-6", "col-md-6 text-end"],
                [combatMonsterDetailMap[monster].name, killsPerHour]
            );
            monsterRow.firstElementChild.setAttribute("data-i18n", "monsterNames." + monster);
            newChildren.push(monsterRow);
        });

    let { totalDropMap, noRngTotalDropMap } = !simResult.isDungeon ? calcDropMaps(simResult, playerToDisplay) : {totalDropMap:new Map(), noRngTotalDropMap:new Map()};

    let revenueModalTable = document.querySelector("#revenueTable > tbody");
    let total = 0;
    for (let [name, dropAmount] of totalDropMap.entries()) {
        let dropRow = createRow(
            ["col-md-6", "col-md-6 text-end"],
            [name, dropAmount.toLocaleString()]
        );
        dropRow.firstElementChild.setAttribute("data-i18n", "itemNames." + name);
        newDropChildren.push(dropRow);

        let tableRow = '<tr class="' + name.replace(/\s+/g, '') + '"><td data-i18n="itemNames.';
        tableRow += name;
        tableRow += '"></td><td contenteditable="true">';
        let price = -1;
        let revenueSetting = document.getElementById('selectPrices_drops').value;
        if (window.prices) {
            let item = window.prices[name];
            if (item) {
                if (revenueSetting == 'bid') {
                    if (item['bid'] !== -1) {
                        price = item['bid'];
                    } else if (item['ask'] !== -1) {
                        price = item['ask'];
                    }
                } else if (revenueSetting == 'ask') {
                    if (item['ask'] !== -1) {
                        price = item['ask'];
                    } else if (item['bid'] !== -1) {
                        price = item['bid'];
                    }
                }
                if (price == -1) {
                    price = item['vendor'];
                }
            }
        }
        tableRow += price;
        tableRow += '</td><td>';
        tableRow += dropAmount;
        tableRow += '</td><td>';
        tableRow += price * dropAmount;
        tableRow += '</td></tr>';
        revenueModalTable.innerHTML += tableRow;
        total += price * dropAmount;
    }



    let noRngRevenueModalTable = document.querySelector("#noRngRevenueTable > tbody");
    let noRngTotal = 0;
    for (let [name, dropAmount] of noRngTotalDropMap.entries()) {
        let noRngDropRow = createRow(
            ["col-md-6", "col-md-6 text-end"],
            [name, dropAmount.toLocaleString()]
        );
        noRngDropRow.firstElementChild.setAttribute("data-i18n", "itemNames." + name);
        newNoRngDropChildren.push(noRngDropRow);

        let tableRow = '<tr class="' + name.replace(/\s+/g, '') + '"><td data-i18n="itemNames.';
        tableRow += name;
        tableRow += '"></td><td contenteditable="true">';
        let price = -1;
        let revenueSetting = document.getElementById('selectPrices_drops').value;
        if (window.prices) {
            let item = window.prices[name];
            if (item) {
                if (revenueSetting == 'bid') {
                    if (item['bid'] !== -1) {
                        price = item['bid'];
                    } else if (item['ask'] !== -1) {
                        price = item['ask'];
                    }
                } else if (revenueSetting == 'ask') {
                    if (item['ask'] !== -1) {
                        price = item['ask'];
                    } else if (item['bid'] !== -1) {
                        price = item['bid'];
                    }
                }
                if (price == -1) {
                    price = item['vendor'];
                }
            }
        }
        tableRow += price;
        tableRow += '</td><td>';
        tableRow += dropAmount;
        tableRow += '</td><td>';
        tableRow += price * dropAmount;
        tableRow += '</td></tr>';
        noRngRevenueModalTable.innerHTML += tableRow;
        noRngTotal += price * dropAmount;
    }

    document.getElementById('revenueSpan').innerText = total.toLocaleString();
    window.revenue = total;
    document.getElementById('noRngRevenueSpan').innerText = noRngTotal.toLocaleString();
    window.noRngRevenue = noRngTotal;

    let resultAccordion = document.getElementById("noRngDropsAccordion");
    showElement(resultAccordion);

    resultDiv.replaceChildren(...newChildren);
    dropsResultDiv.replaceChildren(...newDropChildren);
    noRngDropsResultDiv.replaceChildren(...newNoRngDropChildren);
}

function showDeaths(simResult, playerToDisplay) {
    let resultDiv = document.getElementById("simulationResultPlayerDeaths");

    let hoursSimulated = simResult.simulatedTime / ONE_HOUR;
    let playerDeaths = simResult.deaths[playerToDisplay] ?? 0;
    let deathsPerHour = (playerDeaths / hoursSimulated).toFixed(2);

    let deathRow = createRow(["col-md-6", "col-md-6 text-end"], ["Player", deathsPerHour]);
    deathRow.firstElementChild.setAttribute("data-i18n", "common:player");
    resultDiv.replaceChildren(deathRow);
}

function showExperienceGained(simResult, playerToDisplay) {
    let resultDiv = document.getElementById("simulationResultExperienceGain");
    let newChildren = [];

    let hoursSimulated = simResult.simulatedTime / ONE_HOUR;

    let totalExperience = 0;
    if (simResult.experienceGained[playerToDisplay]) {
        totalExperience = Object.values(simResult.experienceGained[playerToDisplay]).reduce((prev, cur) => prev + cur, 0);
    }
    let totalExperiencePerHour = (totalExperience / hoursSimulated).toFixed(0);
    let totalRow = createRow(["col-md-6", "col-md-6 text-end"], ["Total", totalExperiencePerHour]);
    totalRow.firstElementChild.setAttribute("data-i18n", "common:total");
    newChildren.push(totalRow);

    ["Stamina", "Intelligence", "Attack", "Melee", "Defense", "Ranged", "Magic"].forEach((skill) => {
        let experience = simResult.experienceGained[playerToDisplay]?.[skill.toLowerCase()] ?? 0;
        if (experience == 0) {
            return;
        }
        let experiencePerHour = (experience / hoursSimulated).toFixed(0);
        let experienceRow = createRow(["col-md-6", "col-md-6 text-end"], [skill, experiencePerHour]);
        experienceRow.firstElementChild.setAttribute("data-i18n", "leaderboardCategoryNames." + skill.toLowerCase());
        newChildren.push(experienceRow);
    });

    resultDiv.replaceChildren(...newChildren);
}

function showHpSpent(simResult, playerToDisplay) {
    let hpSpentHeadingDiv = document.getElementById("simulationHpSpentHeading");
    hpSpentHeadingDiv.classList.add("d-none");
    let hpSpentDiv = document.getElementById("simulationHpSpent");
    hpSpentDiv.classList.add("d-none");

    if (simResult.hitpointsSpent[playerToDisplay]) {
        let hoursSimulated = simResult.simulatedTime / ONE_HOUR;
        let hpSpentSources = [];
        for (const source of Object.keys(simResult.hitpointsSpent[playerToDisplay])) {
            let hpSpentPerHour = (simResult.hitpointsSpent[playerToDisplay][source] / hoursSimulated).toFixed(2);
            let hpSpentRow = createRow(["col-md-6", "col-md-6 text-end"], [abilityDetailMap[source].name, hpSpentPerHour]);
            hpSpentRow.firstElementChild.setAttribute("data-i18n", "abilityNames." + source);
            hpSpentSources.push(hpSpentRow);
        }
        hpSpentDiv.replaceChildren(...hpSpentSources);
        hpSpentHeadingDiv.classList.remove("d-none");
        hpSpentDiv.classList.remove("d-none");
    }
}

function showConsumablesUsed(simResult, playerToDisplay) {
    let resultDiv = document.getElementById("simulationResultConsumablesUsed");
    let newChildren = [];

    let hoursSimulated = simResult.simulatedTime / ONE_HOUR;

    if (!simResult.consumablesUsed[playerToDisplay]) {
        resultDiv.replaceChildren(...newChildren);
        window.expenses = 0;
        return;
    }

    let consumablesUsed = Object.entries(simResult.consumablesUsed[playerToDisplay]).sort((a, b) => b[1] - a[1]);

    let expensesModalTable = document.querySelector("#expensesTable > tbody");
    let total = 0;
    for (const [consumable, amount] of consumablesUsed) {
        let consumablesPerHour = (amount / hoursSimulated).toFixed(0);
        let consumableRow = createRow(
            ["col-md-6", "col-md-6 text-end"],
            [itemDetailMap[consumable].name, consumablesPerHour]
        );
        consumableRow.firstElementChild.setAttribute("data-i18n", "itemNames." + consumable);
        newChildren.push(consumableRow);

        let tableRow = '<tr class="' + consumable + '"><td data-i18n="itemNames.';
        tableRow += consumable;
        tableRow += '"></td><td contenteditable="true">';
        let price = -1;
        let expensesSetting = document.getElementById('selectPrices_consumables').value;
        if (window.prices) {
            let item = window.prices[consumable];
            if (item) {
                if (expensesSetting == 'bid') {
                    if (item['bid'] !== -1) {
                        price = item['bid'];
                    } else if (item['ask'] !== -1) {
                        price = item['ask'];
                    }
                } else if (expensesSetting == 'ask') {
                    if (item['ask'] !== -1) {
                        price = item['ask'];
                    } else if (item['bid'] !== -1) {
                        price = item['bid'];
                    }
                }
                if (price == -1) {
                    price = item['vendor'];
                }
            }
        }
        tableRow += price;
        tableRow += '</td><td>';
        tableRow += amount;
        tableRow += '</td><td>';
        tableRow += price * amount;
        tableRow += '</td></tr>';
        expensesModalTable.innerHTML += tableRow;
        total += price * amount;
    }

    document.getElementById('expensesSpan').innerText = total.toLocaleString();
    window.expenses = total;

    resultDiv.replaceChildren(...newChildren);
}

function showManaUsed(simResult, playerToDisplay) {
    let resultDiv = document.getElementById("simulationResultManaUsed");
    let newChildren = [];

    let hoursSimulated = simResult.simulatedTime / ONE_HOUR;

    if (!simResult.manaUsed || !simResult.manaUsed[playerToDisplay]) {
        resultDiv.replaceChildren(...newChildren);
        return;
    }

    let playerManaUsed = simResult.manaUsed[playerToDisplay];

    for (let ability in playerManaUsed) {
        let manaUsed = playerManaUsed[ability];
        let manaPerHour = (manaUsed / hoursSimulated).toFixed(0);
        let castsPerHour = (manaPerHour / abilityDetailMap[ability].manaCost).toFixed(2);
        castsPerHour = " (" + castsPerHour + ")";

        let manaRow = createRow(
            ["col-md-6", "col-md-2", "col-md-4 text-end"],
            [ability.split("/")[2].replaceAll("_", " "), castsPerHour, manaPerHour]
        );
        manaRow.firstElementChild.setAttribute("data-i18n", "abilityNames." + ability);
        newChildren.push(manaRow);
    }

    resultDiv.replaceChildren(...newChildren);
}

function showHitpointsGained(simResult, playerToDisplay) {
    let resultDiv = document.getElementById("simulationResultHealthRestored");
    let newChildren = [];

    let secondsSimulated = simResult.simulatedTime / ONE_SECOND;

    if (!simResult.hitpointsGained[playerToDisplay]) {
        resultDiv.replaceChildren(...newChildren);
        return;
    }

    let hitpointsGained = Object.entries(simResult.hitpointsGained[playerToDisplay]).sort((a, b) => b[1] - a[1]);

    let totalHitpointsGained = hitpointsGained.reduce((prev, cur) => prev + cur[1], 0);
    let totalHitpointsPerSecond = (totalHitpointsGained / secondsSimulated).toFixed(2);
    let totalRow = createRow(
        ["col-md-6", "col-md-3 text-end", "col-md-3 text-end"],
        ["Total", totalHitpointsPerSecond, "100%"]
    );
    totalRow.firstElementChild.setAttribute("data-i18n", "common:total");
    newChildren.push(totalRow);

    for (const [source, amount] of hitpointsGained) {
        if (amount == 0) {
            continue;
        }

        let sourceText;
        let sourceFullHrid;
        switch (source) {
            case "regen":
                sourceText = "Regen";
                sourceFullHrid = "combatStats.hpRegenPer10";
                break;
            case "lifesteal":
                sourceText = "Life Steal";
                sourceFullHrid = "combatStats.lifeSteal";
                break;
            case "bloom":
                sourceText = "Bloom";
                sourceFullHrid = "combatStats.bloom";
                break;
            default:
                if (itemDetailMap[source]) {
                    sourceText = itemDetailMap[source].name;
                    sourceFullHrid = "itemNames." + source;
                } else if (abilityDetailMap[source]) {
                    sourceText = abilityDetailMap[source].name;
                    sourceFullHrid = "abilityNames." + source;
                }
                break;
        }
        let hitpointsPerSecond = (amount / secondsSimulated).toFixed(2);
        let percentage = ((100 * amount) / totalHitpointsGained).toFixed(0);

        let row = createRow(
            ["col-md-6", "col-md-3 text-end", "col-md-3 text-end"],
            [sourceText, hitpointsPerSecond, percentage + "%"]
        );
        row.firstElementChild.setAttribute("data-i18n", sourceFullHrid);
        newChildren.push(row);
    }

    resultDiv.replaceChildren(...newChildren);
}

function showManapointsGained(simResult, playerToDisplay) {
    let resultDiv = document.getElementById("simulationResultManaRestored");
    let newChildren = [];

    let secondsSimulated = simResult.simulatedTime / ONE_SECOND;

    if (!simResult.manapointsGained[playerToDisplay]) {
        resultDiv.replaceChildren(...newChildren);
        return;
    }

    let manapointsGained = Object.entries(simResult.manapointsGained[playerToDisplay]).sort((a, b) => b[1] - a[1]);

    let totalManapointsGained = manapointsGained.reduce((prev, cur) => prev + cur[1], 0);
    let totalManapointsPerSecond = (totalManapointsGained / secondsSimulated).toFixed(2);
    let totalRow = createRow(
        ["col-md-6", "col-md-3 text-end", "col-md-3 text-end"],
        ["Total", totalManapointsPerSecond, "100%"]
    );
    totalRow.firstElementChild.setAttribute("data-i18n", "common:total");
    newChildren.push(totalRow);

    for (const [source, amount] of manapointsGained) {
        if (amount == 0) {
            continue;
        }

        let sourceText;
        let sourceFullHrid;
        switch (source) {
            case "regen":
                sourceText = "Regen";
                sourceFullHrid = "combatStats.mpRegenPer10";
                break;
            case "manaLeech":
                sourceText = "Mana Leech";
                sourceFullHrid = "combatStats.manaLeech";
                break;
            case "ripple":
                sourceText = "Ripple";
                sourceFullHrid = "combatStats.ripple";
                break;
            default:
                sourceText = itemDetailMap[source].name;
                sourceFullHrid = "itemNames." + source;
                break;
        }
        let manapointsPerSecond = (amount / secondsSimulated).toFixed(2);
        let percentage = ((100 * amount) / totalManapointsGained).toFixed(0);

        let row = createRow(
            ["col-md-6", "col-md-3 text-end", "col-md-3 text-end"],
            [sourceText, manapointsPerSecond, percentage + "%"]
        );
        row.firstElementChild.setAttribute("data-i18n", sourceFullHrid);
        newChildren.push(row);
    }

    let ranOutOfManaText = simResult.playerRanOutOfMana[playerToDisplay] ? "Yes" : "No";
    let ranOutOfManaRow = createRow(["col-md-6", "col-md-6 text-end"], ["Ran out of mana", ranOutOfManaText]);
    ranOutOfManaRow.firstElementChild.setAttribute("data-i18n", "common:simulationResults.ranOutOfMana");
    ranOutOfManaRow.lastElementChild.setAttribute("data-i18n", "common:simulationResults." + ranOutOfManaText);
    newChildren.push(ranOutOfManaRow);

    if (simResult.playerRanOutOfMana[playerToDisplay]) {
        let ranOutOfManaStat = simResult.playerRanOutOfManaTime[playerToDisplay]; // {isOutOfMana: false, startTimeForOutOfMana:0, totalTimeForOutOfMana:0};
        let totalTimeForOut = ranOutOfManaStat.totalTimeForOutOfMana + (ranOutOfManaStat.isOutOfMana ? (simResult.simulatedTime - ranOutOfManaStat.startTimeForOutOfMana) : 0);

        let ranOutOfManaStatRow = createRow(
            ["col-md-6", "col-md-6 text-end"],
            [
                "Run Out Ratio",
                (totalTimeForOut / simResult.simulatedTime * 100).toFixed(2) + "%"
            ]
        );
        ranOutOfManaStatRow.firstElementChild.setAttribute("data-i18n", "common:simulationResults.ranOutOfManaRatio");
        newChildren.push(ranOutOfManaStatRow);
    }

    resultDiv.replaceChildren(...newChildren);
}

function showDamageDone(simResult, playerToDisplay) {
    let totalDamageDone = {};
    let enemyIndex = 1;

    let totalSecondsSimulated = simResult.simulatedTime / ONE_SECOND;

    for (let i = 1; i < 64; i++) {
        let accordion = document.getElementById("simulationResultDamageDoneAccordionEnemy" + i);
        hideElement(accordion);
    }

    let bossTimeHeadingDiv = document.getElementById("simulationBossTimeHeading");
    bossTimeHeadingDiv.classList.add("d-none");
    let bossTimeDiv = document.getElementById("simulationBossTime");
    bossTimeDiv.classList.add("d-none");

    if (!simResult.attacks[playerToDisplay]) {
        return;
    }

    for (const [target, abilities] of Object.entries(simResult.attacks[playerToDisplay])) {
        let targetDamageDone = {};

        const i = simResult.timeSpentAlive.findIndex(e => e.name === target);
        let aliveSecondsSimulated = simResult.timeSpentAlive[i].timeSpentAlive / ONE_SECOND;

        for (const [ability, abilityCasts] of Object.entries(abilities)) {
            let casts = Object.values(abilityCasts).reduce((prev, cur) => prev + cur, 0);
            let misses = abilityCasts["miss"] ?? 0;
            let damage = Object.entries(abilityCasts)
                .filter((entry) => entry[0] != "miss")
                .reduce((prev, cur) => prev + Number(cur[0]) * cur[1], 0);

            targetDamageDone[ability] = {
                casts,
                misses,
                damage,
            };
            if (totalDamageDone[ability]) {
                totalDamageDone[ability].casts += casts;
                totalDamageDone[ability].misses += misses;
                totalDamageDone[ability].damage += damage;
            } else {
                totalDamageDone[ability] = {
                    casts,
                    misses,
                    damage,
                };
            }
        }

        let resultDiv = document.getElementById("simulationResultDamageDoneEnemy" + enemyIndex);
        createDamageTable(resultDiv, targetDamageDone, aliveSecondsSimulated);

        let resultAccordion = document.getElementById("simulationResultDamageDoneAccordionEnemy" + enemyIndex);
        showElement(resultAccordion);

        let resultAccordionButton = document.getElementById(
            "buttonSimulationResultDamageDoneAccordionEnemy" + enemyIndex
        );
        let targetName = combatMonsterDetailMap[target].name;
        resultAccordionButton.innerHTML = "<b><span data-i18n=\"common:simulationResults.damageDone\">Damage Done</span> (" + "<span data-i18n=\"monsterNames." + target + "\">" + targetName + "</span>" + ")</b>";

        if (simResult.bossSpawns.includes(target)) {
            let hoursSpentOnBoss = (aliveSecondsSimulated / 60 / 60).toFixed(2);
            let percentSpentOnBoss = (aliveSecondsSimulated / totalSecondsSimulated * 100).toFixed(2);

            let bossRow = createRow(["col-md-6", "col-md-6 text-end"], [targetName, hoursSpentOnBoss + "h(" + percentSpentOnBoss + "%)"]);
            bossRow.firstElementChild.setAttribute("data-i18n", "monsterNames." + target);
            bossTimeDiv.replaceChildren(bossRow);

            bossTimeHeadingDiv.classList.remove("d-none");
            bossTimeDiv.classList.remove("d-none");
        }

        enemyIndex++;
    }

    if (simResult.isDungeon) {
        let newChildren = [];
        for (const waveName of simResult.bossSpawns) {
            // waveName is something like "#15,/monsters/jackalope,/monsters/butterjerry"
            let waveNumber = waveName.split(",")[0];
            const idx = simResult.timeSpentAlive.findIndex(e => e.name === waveNumber);
            if (idx == -1 || simResult.timeSpentAlive[idx].count == 0) {
                continue;
            }
            let aliveSecondsSimulated = simResult.timeSpentAlive[idx].timeSpentAlive / ONE_SECOND / simResult.timeSpentAlive[idx].count;
            let bossRow = createRow(["col-md-6", "col-md-2", "col-md-4 text-end"], [waveNumber, simResult.timeSpentAlive[idx].count, aliveSecondsSimulated.toFixed(1) + "s"]);
            newChildren.push(bossRow);
        }
        if (newChildren.length > 0) {
            bossTimeHeadingDiv.classList.remove("d-none");
            bossTimeDiv.classList.remove("d-none");
            bossTimeDiv.replaceChildren(...newChildren);
        }
    }

    let totalResultDiv = document.getElementById("simulationResultTotalDamageDone");
    createDamageTable(totalResultDiv, totalDamageDone, totalSecondsSimulated);
}

function showDamageTaken(simResult, playerToDisplay) {
    let totalDamageTaken = {};
    let enemyIndex = 1;

    let totalSecondsSimulated = simResult.simulatedTime / ONE_SECOND;

    for (let i = 1; i < 64; i++) {
        let accordion = document.getElementById("simulationResultDamageTakenAccordionEnemy" + i);
        hideElement(accordion);
    }

    for (const [source, targets] of Object.entries(simResult.attacks)) {
        const validSources = ["player1", "player2", "player3", "player4", "player5"];
        if (validSources.includes(source)) {
            continue;
        }
        const i = simResult.timeSpentAlive.findIndex(e => e.name === source);
        let aliveSecondsSimulated = simResult.timeSpentAlive[i].timeSpentAlive / ONE_SECOND;
        let sourceDamageTaken = {};
        if (targets[playerToDisplay] && Object.keys(targets[playerToDisplay]).length > 0) {
            for (const [ability, abilityCasts] of Object.entries(targets[playerToDisplay])) {
                let casts = Object.values(abilityCasts).reduce((prev, cur) => prev + cur, 0);
                let misses = abilityCasts["miss"] ?? 0;
                let damage = Object.entries(abilityCasts)
                    .filter((entry) => entry[0] != "miss")
                    .reduce((prev, cur) => prev + Number(cur[0]) * cur[1], 0);

                sourceDamageTaken[ability] = {
                    casts,
                    misses,
                    damage,
                };
                if (totalDamageTaken[ability]) {
                    totalDamageTaken[ability].casts += casts;
                    totalDamageTaken[ability].misses += misses;
                    totalDamageTaken[ability].damage += damage;
                } else {
                    totalDamageTaken[ability] = {
                        casts,
                        misses,
                        damage,
                    };
                }
            }
        }

        let resultDiv = document.getElementById("simulationResultDamageTakenEnemy" + enemyIndex);
        createDamageTable(resultDiv, sourceDamageTaken, aliveSecondsSimulated);

        let resultAccordion = document.getElementById("simulationResultDamageTakenAccordionEnemy" + enemyIndex);
        showElement(resultAccordion);

        let resultAccordionButton = document.getElementById(
            "buttonSimulationResultDamageTakenAccordionEnemy" + enemyIndex
        );
        let sourceName = combatMonsterDetailMap[source].name;
        resultAccordionButton.innerHTML = "<b><span data-i18n=\"common:simulationResults.damageTaken\">Damage Taken</span> (" + "<span data-i18n=\"monsterNames." + source + "\">" + sourceName + "</span>" + ")</b>";

        enemyIndex++;
    }

    let totalResultDiv = document.getElementById("simulationResultTotalDamageTaken");
    createDamageTable(totalResultDiv, totalDamageTaken, totalSecondsSimulated);
}

function createDamageTable(resultDiv, damageDone, secondsSimulated) {
    let newChildren = [];

    let sortedDamageDone = Object.entries(damageDone).sort((a, b) => b[1].damage - a[1].damage);

    let totalCasts = sortedDamageDone.reduce((prev, cur) => prev + cur[1].casts, 0);
    let totalMisses = sortedDamageDone.reduce((prev, cur) => prev + cur[1].misses, 0);
    let totalDamage = sortedDamageDone.reduce((prev, cur) => prev + cur[1].damage, 0);
    let totalHitChance = ((100 * (totalCasts - totalMisses)) / totalCasts).toFixed(1);
    let totalDamagePerSecond = (totalDamage / secondsSimulated).toFixed(2);

    let totalRow = createRow(
        ["col-md-5", "col-md-3 text-end", "col-md-2 text-end", "col-md-2 text-end"],
        ["Total", totalHitChance + "%", totalDamagePerSecond, "100%"]
    );
    totalRow.firstElementChild.setAttribute("data-i18n", "common:total");
    newChildren.push(totalRow);

    for (const [ability, damageInfo] of sortedDamageDone) {
        let abilityText;
        let abilityFullHrid;
        switch (ability) {
            case "autoAttack":
                abilityText = "Auto Attack";
                abilityFullHrid = "combatUnit.autoAttack";
                break;
            case "parry":
                abilityText = "Parry Attack";
                abilityFullHrid = "common:simulationResults.parryAttack";
                break;
            case "damageOverTime":
                abilityText = "Damage Over Time";
                abilityFullHrid = "common:simulationResults.damageOverTime";
                break;
            case "physicalThorns":
                abilityText = "Physical Thorns";
                abilityFullHrid = "combatStats.physicalThorns";
                break;
            case "elementalThorns":
                abilityText = "Elemental Thorns";
                abilityFullHrid = "combatStats.elementalThorns";
                break;
            case "retaliation":
                abilityText = "Retaliation";
                abilityFullHrid = "combatStats.retaliation";
                break;
            case 'blaze':
                abilityText = "Blaze";
                abilityFullHrid = "combatStats.blaze";
                break;
            default:
                abilityText = abilityDetailMap[ability].name;
                abilityFullHrid = "abilityNames." + ability;
                break;
        }

        let hitChance = ((100 * (damageInfo.casts - damageInfo.misses)) / damageInfo.casts).toFixed(1);
        let damagePerSecond = (damageInfo.damage / secondsSimulated).toFixed(2);
        let percentage = ((100 * damageInfo.damage) / totalDamage).toFixed(0);

        let row = createRow(
            ["col-md-5", "col-md-3 text-end", "col-md-2 text-end", "col-md-2 text-end"],
            [abilityText, hitChance + "%", damagePerSecond, percentage + "%"]
        );
        row.firstElementChild.setAttribute("data-i18n", abilityFullHrid);
        newChildren.push(row);
    }

    resultDiv.replaceChildren(...newChildren);
}

function createRow(columnClassNames, columnValues) {
    let row = createElement("div", "row");

    for (let i = 0; i < columnClassNames.length; i++) {
        let column = createElement("div", columnClassNames[i], columnValues[i]);
        row.appendChild(column);
    }

    return row;
}

function createElement(tagName, className, innerHTML = "", id = "") {
    let element = document.createElement(tagName);
    element.className = className;
    element.innerHTML = innerHTML;
    if (id) element.id = id;
    return element;
}

// #endregion

// #region Simulation Controls

document.addEventListener('DOMContentLoaded', function () {
    const simDungeonToggle = document.getElementById('simDungeonToggle');
    const playerContainer = document.getElementById('playerCheckBox');

    function addPlayers() {
        const player4 = document.createElement('div');
        player4.classList.add('form-check');
        player4.innerHTML = `
            <input class="form-check-input player-checkbox" type="checkbox" id="player4">
            <label class="form-check-label" for="player4">
                Player 4
            </label>
        `;

        const player5 = document.createElement('div');
        player5.classList.add('form-check');
        player5.innerHTML = `
            <input class="form-check-input player-checkbox" type="checkbox" id="player5">
            <label class="form-check-label" for="player5">
                Player 5
            </label>
        `;

        playerContainer.appendChild(player4);
        playerContainer.appendChild(player5);
    }

    function removePlayers() {
        const player4 = document.getElementById('player4');
        const player5 = document.getElementById('player5');
        if (player4) player4.parentElement.remove();
        if (player5) player5.parentElement.remove();
    }

    function updatePlayerNames() {
        const tabLinks = document.querySelectorAll('#playerTab .nav-link');
        tabLinks.forEach((tabLink, index) => {
            const label = document.querySelector(`label[for="player${index + 1}"]`);
            if (label) {
                label.textContent = tabLink.textContent.trim();
            }
        });
    }

    function updatePlayersCheckbox(isCheck) {
        const boxes = playerContainer.querySelectorAll('.player-checkbox');
        boxes.forEach((checkBox) => { checkBox.checked = isCheck });
    }

    function updateDifficultySelect(isCheck) {
        const difficultySelect = document.getElementById('selectDifficulty');
        // disable last four option
        if (isCheck && Number(difficultySelect.value) >= 3) {
            difficultySelect.value = 0;
        }
        for (let i = 3; i < difficultySelect.options.length; i++) {
            difficultySelect.options[i].disabled = isCheck;
        }
    }

    simDungeonToggle.addEventListener('change', function () {
        if (simDungeonToggle.checked) {
            addPlayers();
            updatePlayersCheckbox(true);
            updateDifficultySelect(true);
        } else {
            removePlayers();
            updatePlayersCheckbox(false);
            updateDifficultySelect(false);
        }
        updatePlayerNames();
    });

    document.getElementById('buttonSimulationSetup').addEventListener('click', function () {
        updatePlayerNames();
    });
});

function onTabChange(event) {
    const nextPlayerTabId = event.target.getAttribute('href').substring(7);
    savePreviousPlayer(currentPlayerTabId);
    updateNextPlayer(nextPlayerTabId);
    currentPlayerTabId = nextPlayerTabId;
    updateState();
    updateUI();
    if (Object.keys(currentSimResults).length !== 0) {
        showSimulationResult(currentSimResults);
    }

    updateContent();
}

document.querySelectorAll('#playerTab .nav-link').forEach(tab => {
    tab.addEventListener('shown.bs.tab', onTabChange);
});

function initSimulationControls() {
    let simulationTimeInput = document.getElementById("inputSimulationTime");
    simulationTimeInput.value = 24;

    buttonStartSimulation.addEventListener("click", (event) => {
        let invalidElements = document.querySelectorAll(":invalid");
        if (invalidElements.length > 0) {
            invalidElements.forEach((element) => element.reportValidity());
            return;
        }
        savePreviousPlayer(currentPlayerTabId);

        const simDungeonToggle = document.getElementById("simDungeonToggle");
        const checkboxes = document.querySelectorAll('.player-checkbox');
        selectedPlayers = [];
        checkboxes.forEach(checkbox => {
            if (checkbox.checked) {
                const playerNumber = parseInt(checkbox.id.replace('player', ''));
                selectedPlayers.push(playerNumber);
            }
        });

        if (selectedPlayers.length === 0) {
            alert("You need to select at least one player to sim.");
            return;
        }
        // buttonStartSimulation.disabled = true;
        buttonStopSimulation.style.display = 'block';
        startSimulation(selectedPlayers);
    });

    buttonStopSimulation.style.display = 'none';
    buttonStopSimulation.addEventListener("click", (event) => {
        progressbar.style.width = "0%";
        progressbar.innerHTML = "0%";
        if (worker) {
            worker.terminate();
        }
        worker = new Worker(new URL("worker.js", import.meta.url));

        if (multiWorker) {
            multiWorker.terminate();
        }
        multiWorker = new Worker(new URL("multiWorker.js", import.meta.url));

        for (let worker of workerPool) {
            worker.worker.terminate();
        }

        buttonStartSimulation.disabled = false;
        buttonStopSimulation.style.display = 'none';
    });
}

function startSimulation(selectedPlayers) {
    let playersToSim = [];
    for (let j = 1; j < 6; j++) {
        if (selectedPlayers.includes(j)) {
            updateNextPlayer(j);
            updateState();
            updateUI();
            player.hrid = "player" + j.toString();
            for (let i = 0; i < 3; i++) {
                if (food[i] && i < player.combatDetails.combatStats.foodSlots) {
                    let consumable = new Consumable(food[i], triggerMap[food[i]]);
                    player.food[i] = consumable;
                } else {
                    player.food[i] = null;
                }

                if (drinks[i] && i < player.combatDetails.combatStats.drinkSlots) {
                    let consumable = new Consumable(drinks[i], triggerMap[drinks[i]]);
                    player.drinks[i] = consumable;
                } else {
                    player.drinks[i] = null;
                }
            }

            for (let i = 0; i < 5; i++) {
                if (abilities[i] && player.intelligenceLevel >= abilitySlotsLevelRequirementList[i + 1]) {
                    let abilityLevelInput = document.getElementById("inputAbilityLevel_" + i);
                    let ability = new Ability(abilities[i], Number(abilityLevelInput.value), triggerMap[abilities[i]]);
                    player.abilities[i] = ability;
                } else {
                    player.abilities[i] = null;
                }
            }

            playersToSim.push(structuredClone(player));
        }
    }
    updateNextPlayer(currentPlayerTabId);
    updateState();
    updateUI();

    let maxPlayerCombatLevel = 1;
    for (let player of playersToSim) {
        player.combatLevel = calcCombatLevel(player.staminaLevel, player.intelligenceLevel, player.defenseLevel, player.attackLevel, player.meleeLevel, player.rangedLevel, player.magicLevel);
        maxPlayerCombatLevel = Math.max(maxPlayerCombatLevel, player.combatLevel);
    }

    for (let player of playersToSim) {
        if ((maxPlayerCombatLevel / player.combatLevel) > 1.2) {
            const maxDebuffOnLevelGap = 0.9;
            let levelPercent = Math.floor(((maxPlayerCombatLevel / player.combatLevel) - 1.2) * 100) / 100;

            player.debuffOnLevelGap = -1 * Math.min(maxDebuffOnLevelGap, 3 * levelPercent);

            console.log("player " + player.hrid + " debuff on level gap: " + player.debuffOnLevelGap * 100 + "% for " + (maxPlayerCombatLevel / player.combatLevel));
        }
        else {
            player.debuffOnLevelGap = 0;
        }
    }

    let extra = {};
    extra.mooPass = document.getElementById("mooPassToggle").checked;
    extra.comExp = 0;
    if (document.getElementById("comExpToggle").checked) {
        extra.comExp = Number(document.getElementById("comExpInput").value);
    }
    extra.comDrop = 0;
    if (document.getElementById("comDropToggle").checked) {
        extra.comDrop = Number(document.getElementById("comDropInput").value);
    }
    extra.enableHpMpVisualization = document.getElementById("hpMpVisualizationToggle").checked;

    let simAllZonesToggle = document.getElementById("simAllZoneToggle");
    let simAllSoloToggle = document.getElementById("simAllSoloToggle");
    let simDungeonToggle = document.getElementById("simDungeonToggle");
    let zoneSelect = document.getElementById("selectZone");
    let dungeonSelect = document.getElementById("selectDungeon");
    let difficultySelect = document.getElementById("selectDifficulty");
    let simulationTimeInput = document.getElementById("inputSimulationTime");
    let simulationTimeLimit = Number(simulationTimeInput.value) * ONE_HOUR;
    buttonStopSimulation.style.display = 'block';
    if (!simAllZonesToggle.checked && !simAllSoloToggle.checked) {
        let zoneHrid = zoneSelect.value;
        let difficultyTier = Number(difficultySelect.value);
        if (simDungeonToggle.checked) {
            zoneHrid = dungeonSelect.value;
        }
        let workerMessage = {
            type: "start_simulation",
            workerId: Math.floor(Math.random() * 1e9).toString(),
            players: playersToSim,
            zone: { zoneHrid: zoneHrid, difficultyTier: difficultyTier },
            simulationTimeLimit: simulationTimeLimit,
            extra : extra
        };
        simStartTime = Date.now();
        if (!worker) {
            worker = new Worker(new URL("multiWorker.js", import.meta.url));
        }
        worker.onmessage = onWorkerMessage;
        worker.postMessage(workerMessage);
    } else {
        let targetHrids = {};

        if (simAllZonesToggle.checked) {
            Object.values(actionDetailMap)
                .filter(a =>
                    a.type === "/action_types/combat" &&
                    a.category !== "/action_categories/combat/dungeons" &&
                    a.combatZoneInfo.fightInfo.randomSpawnInfo.maxSpawnCount > 1 &&
                    document.getElementById(a.hrid)?.checked
                )
                .forEach(a => { targetHrids[a.hrid] = a; });
        }

        if (simAllSoloToggle.checked) {
            Object.values(actionDetailMap)
                .filter(a =>
                    a.type === "/action_types/combat" &&
                    a.category !== "/action_categories/combat/dungeons" &&
                    a.combatZoneInfo.fightInfo.randomSpawnInfo.maxSpawnCount === 1 &&
                    document.getElementById(a.hrid)?.checked
                )
                .forEach(a => { targetHrids[a.hrid] = a; });
        }

        let simHrids = Object.values(targetHrids)
            .sort((a, b) => a.sortIndex - b.sortIndex)
            .map(action => {
                let result = [];
                for (let difficultyTier = 0; difficultyTier <= action.maxDifficulty; difficultyTier++) {
                    result.push({ zoneHrid: action.hrid, difficultyTier: difficultyTier });
                }
                return result;
            })
            .flat();

        let workerMessage = {
            type: "start_simulation_all_zones",
            workerId: Math.floor(Math.random() * 1e9).toString(),
            players: playersToSim,
            zones: simHrids,
            simulationTimeLimit: simulationTimeLimit,
            extra: extra
        };
        simStartTime = Date.now();
        if (!multiWorker) {
            multiWorker = new Worker(new URL("multiWorker.js", import.meta.url));
        }
        multiWorker.onmessage = onMultiWorkerMessage;
        multiWorker.postMessage(workerMessage);
    }
}

function parsePlayerJson(playerJson, hrid) {
    let playerData = {
        hrid: hrid,
        food: [],
        drinks: [],
        abilities: [],
        ...playerJson.player,
        houseRooms: playerJson.houseRooms,
    };
    playerData.equipment = {};
    const triggerMap = playerJson.triggerMap;
    ["head", "body", "legs", "feet", "hands", "off_hand", "pouch", "neck", "earrings", "ring", "back", "main_hand", "two_hand", "charm"].forEach((type) => {
        let currentEquipment = playerJson.player.equipment.find(item => item.itemLocationHrid === "/item_locations/" + type);
        if (currentEquipment){
            playerData.equipment[`/equipment_types/${type}`] = new Equipment(currentEquipment.itemHrid, currentEquipment.enhancementLevel);
        }
    });

    for (const foodHrid of playerJson.food["/action_types/combat"]) {
        if (foodHrid.itemHrid === "") continue;
        const food = new Consumable(foodHrid.itemHrid, triggerMap[foodHrid.itemHrid]);
        playerData.food.push(food);
    }
    for (const drinkHrid of playerJson.drinks["/action_types/combat"]) {
        if (drinkHrid.itemHrid === "") continue;
        const drink = new Consumable(drinkHrid.itemHrid, triggerMap[drinkHrid.itemHrid]);
        playerData.drinks.push(drink);
    }
    for (const ability of playerJson.abilities) {
        if (ability.abilityHrid === "") continue;
        const abilityLevel = Number(ability.level);
        const abilityHrid = ability.abilityHrid;
        if (abilityLevel > 0) {
            const abilityObj = new Ability(abilityHrid, abilityLevel, triggerMap[abilityHrid]);
            playerData.abilities.push(abilityObj);
        }
    }
    const player = Player.createFromDTO(playerData)
    player.updateCombatDetails();
    player.houseRooms = playerJson.houseRooms;
    player.achievements = playerJson.achievements ?? {};
    return player;
}
// read JSON file to simulate
document.getElementById("buttonUploadJSONSimulate").addEventListener("click", (event) => {
    let extra = {};
    extra.mooPass = document.getElementById("mooPassToggle").checked;
    extra.comExp = 0;
    if (document.getElementById("comExpToggle").checked) {
        extra.comExp = Number(document.getElementById("comExpInput").value);
    }
    extra.comDrop = 0;
    if (document.getElementById("comDropToggle").checked) {
        extra.comDrop = Number(document.getElementById("comDropInput").value);
    }

    let fileInput = document.getElementById("inputUploadJSONSimulation");
    let file = fileInput.files[0];
    if (!file) {
        alert("Please select a file to upload.");
        return;
    }

    let reader = new FileReader();
    reader.onload = function (event) {
        let fileContent = event.target.result;
        const jsonDataList = JSON.parse(fileContent);
        try {
            const simDataList = [];
            for (const key in jsonDataList) {
                if (jsonDataList[key].cases) {
                    const cases = getProductCases(jsonDataList[key], jsonDataList[key].cases);
                    simDataList.push(...cases);
                } else {
                    simDataList.push(jsonDataList[key]);
                }
            }
            for (const key in simDataList) {
                const jsonData = simDataList[key];
                if (!jsonData || !jsonData.zone || !jsonData.players) {
                    alert("Invalid JSON file format. Please ensure it contains a 'simulationResult' property.");
                    return;
                }
                const playersToSim = Object.values(jsonData.players).map(
                    (player, index) => parsePlayerJson(player, `player${index + 1}`)
                );

                let maxPlayerCombatLevel = 1;
                for (let player of playersToSim) {
                    player.combatLevel = calcCombatLevel(player.staminaLevel, player.intelligenceLevel, player.defenseLevel, player.attackLevel, player.meleeLevel, player.rangedLevel, player.magicLevel);
                    maxPlayerCombatLevel = Math.max(maxPlayerCombatLevel, player.combatLevel);
                }

                for (let player of playersToSim) {
                    if ((maxPlayerCombatLevel / player.combatLevel) > 1.2) {
                        const maxDebuffOnLevelGap = 0.9;
                        let levelPercent = Math.floor(((maxPlayerCombatLevel / player.combatLevel) - 1.2) * 100) / 100;
                        player.debuffOnLevelGap = -1 * Math.min(maxDebuffOnLevelGap, 3 * levelPercent);
                        console.log("player " + player.hrid + " debuff on level gap: " + player.debuffOnLevelGap * 100 + "% for " + (maxPlayerCombatLevel / player.combatLevel));
                    }
                    else {
                        player.debuffOnLevelGap = 0;
                    }
                }

                const simulationTimeLimit = (jsonData.simulationTimeLimit || 24) * ONE_HOUR;
                const simName = jsonData.name || `Json ${key}`;
                const zoneHrid = jsonData.zone;
                if (zoneHrid === "all") {
                    let targetHrids = {};

                    if (simAllZonesToggle.checked) {
                        Object.values(actionDetailMap)
                            .filter(a =>
                                a.type === "/action_types/combat" &&
                                a.category !== "/action_categories/combat/dungeons" &&
                                a.combatZoneInfo.fightInfo.randomSpawnInfo.maxSpawnCount > 1
                            )
                            .forEach(a => { targetHrids[a.hrid] = a; });
                    }

                    let simHrids = Object.values(targetHrids)
                        .sort((a, b) => a.sortIndex - b.sortIndex)
                        .map(action => {
                            let result = [];
                            for (let difficultyTier = 0; difficultyTier <= action.maxDifficulty; difficultyTier++) {
                                result.push({ zoneHrid: action.hrid, difficultyTier: difficultyTier });
                            }
                            return result;
                        })
                        .flat();

                    let workerMessage = {
                        simulationName: simName,
                        type: "start_simulation_all_zones",
                        workerId: Math.floor(Math.random() * 1e9).toString(),
                        players: playersToSim,
                        zones: simHrids,
                        simulationTimeLimit: simulationTimeLimit,
                        extra : extra
                    };
                    const worker = new Worker(new URL("worker.js", import.meta.url)); 
                    worker.onmessage = mainWorkerOnMessage;
                    worker.postMessage(workerMessage);
                    customAlert("Simulation task Created", "info")
                    workerPool.push({
                        workerId: workerMessage.workerId,
                        worker: worker,
                    });
                } else {
                    let difficultyTier = jsonData.difficultyTier || 0;
                    let workerMessage = {
                        simulationName: simName,
                        type: "start_simulation",
                        workerId: Math.floor(Math.random() * 1e9).toString(),
                        players: playersToSim,
                        zone: { zoneHrid: zoneHrid, difficultyTier: difficultyTier },
                        simulationTimeLimit: simulationTimeLimit,
                        extra : extra
                    };
                    const worker = new Worker(new URL("worker.js", import.meta.url)); 
                    worker.onmessage = mainWorkerOnMessage;
                    worker.postMessage(workerMessage);
                    customAlert("Simulation task Created", "info")
                    workerPool.push({
                        workerId: workerMessage.workerId,
                        worker: worker,
                    });
                }
            }
        } catch (error) {
            // alert("Error parsing JSON file: " + error.message);
            customAlert("Error parsing JSON file: " + error.message, "danger");
        }
    }
    reader.readAsText(file);
});


// #endregion

// #region WipeEvents

function renderWipeEvents(simResult) {
    const selector = document.getElementById('wipeEventSelector');
    const logsContainer = document.getElementById('wipeLogsContainer');
    const waveBadge = document.getElementById('wipeWaveBadge');
    const timeInfo = document.getElementById('wipeTimeInfo');

    selector.innerHTML = '';
    logsContainer.innerHTML = '';

    if (!simResult.wipeEvents || simResult.wipeEvents.length === 0) {
        selector.innerHTML = `<option value="-1" data-i18n="common:noWipeEvents">No Wipe Events</option>`;
        logsContainer.innerHTML = `<div class="text-center py-4" data-i18n="common:noWipeEventsDetected">No Wipe Events Detected</div>`;
        waveBadge.textContent = '';
        timeInfo.textContent = '';
        return;
    }

    simResult.wipeEvents.forEach((event, index) => {
        const wave = event.wave || '?';
        // const time = (event.simulationTime / 1e9).toFixed(2);
        // const timestamp = new Date(event.timestamp).toLocaleTimeString();

        const option = document.createElement('option');
        option.value = index;
        option.textContent = `#${index + 1} - 波次: ${wave}`;
        selector.appendChild(option);
    });

    selector.value = 0;
    renderSelectedWipeEvent(0, simResult);

    selector.addEventListener('change', () => {
        renderSelectedWipeEvent(selector.value, simResult);
    });
}

// 渲染选中的团灭事件
function renderSelectedWipeEvent(index, simResult) {
    const logsContainer = document.getElementById('wipeLogsContainer');
    const waveBadge = document.getElementById('wipeWaveBadge');
    const timeInfo = document.getElementById('wipeTimeInfo');

    logsContainer.innerHTML = '';

    if (index < 0 || index >= simResult.wipeEvents.length) {
        logsContainer.innerHTML = `<div class="text-center py-4" data-i18n="common:noWipeEvents">No Wipe Events</div>`;
        waveBadge.textContent = '';
        timeInfo.textContent = '';
        return;
    }

    const wipeEvent = simResult.wipeEvents[index];
    const wave = wipeEvent.wave || '?';
    const time = (wipeEvent.simulationTime / 1e9).toFixed(2);
    const timestamp = new Date(wipeEvent.timestamp).toLocaleString();

    waveBadge.textContent = `波次: ${wave}`;
    timeInfo.textContent = `模拟时间: ${time}s | 记录时间: ${timestamp}`;

    const logsByTime = groupLogsByTime(wipeEvent.logs);

    const baseTime = logsByTime.length > 0 ? logsByTime[0].time : 0;

    logsByTime.forEach(group => {
        const timeGroupElement = document.createElement('div');
        timeGroupElement.className = 'log-time-group';

        const relativeTime = (group.time - baseTime) / 1e9;

        // 时间标题
        const timeHeader = document.createElement('div');
        timeHeader.className = 'log-time-header';
        timeHeader.textContent = `[${relativeTime.toFixed(2)}s] [Wave#${group.wave}]`;
        timeGroupElement.appendChild(timeHeader);

        // 事件列表
        const eventsList = document.createElement('div');
        eventsList.className = 'log-events';

        const damagedPlayers = new Set();

        group.logs.forEach(log => {
            const eventElement = document.createElement('div');
            eventElement.className = 'log-event';

            damagedPlayers.add(log.target);

            const sourceSpan = document.createElement('span');
            sourceSpan.className = 'log-source';
            if (log.ability === "damageOverTime") {
                sourceSpan.textContent = log.target;
            } else if(log.source == 'UNKNOWN_SOURCE') {
                sourceSpan.textContent = 'UNKNOWN';
            } else {
                sourceSpan.setAttribute('data-i18n', `monsterNames.${log.source}`);
                sourceSpan.textContent = log.source;
            }

            const castSpan = document.createElement('span');
            castSpan.className = 'log-cast';
            castSpan.setAttribute('data-i18n', `common:cast`);
            castSpan.textContent = ' cast ';

            const abilitySpan = document.createElement('span');
            abilitySpan.className = 'log-ability';
            if (log.ability === "autoAttack") {
                abilitySpan.setAttribute('data-i18n', 'combatUnit.autoAttack');
                abilitySpan.textContent = 'Auto Attack';
            } else if (log.ability === "physicalThorns") {
                abilitySpan.setAttribute('data-i18n', `combatStats.physicalThorns`);
                abilitySpan.textContent = 'Physical Thorns';
            } else if (log.ability === "elementalThorns") {
                abilitySpan.setAttribute('data-i18n', `combatStats.elementalThorns`);
                abilitySpan.textContent = 'Elemental Thorns';
            } else if (log.ability === "retaliation") {
                abilitySpan.setAttribute('data-i18n', `combatStats.retaliation`);
                abilitySpan.textContent = 'Retaliation';
            } else if (log.ability === "damageOverTime") {
                abilitySpan.setAttribute('data-i18n', `common:simulationResults.damageOverTime`);
                abilitySpan.textContent = 'Damage Over Time';
            } else {
                abilitySpan.setAttribute('data-i18n', `abilityNames.${log.ability}`);
                abilitySpan.textContent = log.ability;
            }

            const toSpan = document.createElement('span');
            toSpan.className = 'log-to';
            toSpan.setAttribute('data-i18n', `common:to`);
            toSpan.textContent = ' to ';

            const targetSpan = document.createElement('span');
            targetSpan.className = 'log-target';
            targetSpan.textContent = log.target;

            const dealDamageSpan = document.createElement('span');
            dealDamageSpan.className = 'log-deal-damage';
            dealDamageSpan.setAttribute('data-i18n', `common:dealDamage`);
            dealDamageSpan.textContent = ' deal damage ';

            const damageDoneSpan = document.createElement('span');
            damageDoneSpan.className = 'log-damage-done';
            damageDoneSpan.textContent = log.damage;
            if (log.isCrit) {
                damageDoneSpan.style.fontWeight = 'bold';
                damageDoneSpan.textContent += '!!!';
            }

            eventElement.appendChild(sourceSpan);
            eventElement.appendChild(castSpan);
            eventElement.appendChild(abilitySpan);
            eventElement.appendChild(toSpan);
            eventElement.appendChild(targetSpan);
            eventElement.appendChild(dealDamageSpan);
            eventElement.appendChild(damageDoneSpan);
            eventElement.appendChild(document.createTextNode(` , HP ${log.beforeHp} → ${log.afterHp}`));

            eventsList.appendChild(eventElement);
        });

        timeGroupElement.appendChild(eventsList);

        const lastLog = group.logs[group.logs.length - 1];
        const playersHpElement = document.createElement('div');

        const playerHpTitle = document.createElement('span');
        playerHpTitle.className = 'log-players-hp';
        playerHpTitle.setAttribute('data-i18n', `common:playersHp`);
        playerHpTitle.textContent = 'Players HP: ';
        playersHpElement.appendChild(playerHpTitle);

        lastLog.playersHp.forEach((player, idx) => {
            const playerElement = document.createElement('span');
            playerElement.className = 'log-player-hp';
            playerElement.textContent = `${player.hrid}: ${player.current}/${player.max}`;

            if (player.current <= 0) {
                playerElement.style.color = darkModeToggle.checked ? '#FF6347' : '#CC0000';
            } else if (damagedPlayers.has(player.hrid)) {
                playerElement.style.color = darkModeToggle.checked ? '#00BFFF' : '#007BFF';
            }

            if (idx > 0) {
                playersHpElement.appendChild(document.createTextNode(' | '));
            }
            playersHpElement.appendChild(playerElement);
        });
        const spacer = document.createElement('div');
        spacer.style.height = '15px';
        logsContainer.appendChild(spacer);
        timeGroupElement.appendChild(playersHpElement);
        logsContainer.appendChild(timeGroupElement);
    });

    // 更新汉化
    updateContent()
}

// 按时间分组日志
function groupLogsByTime(logs) {
    const groups = [];
    let currentGroup = null;

    logs.forEach(log => {
        if (!currentGroup || currentGroup.time !== log.time) {
            currentGroup = {
                time: log.time,
                wave: log.wave,
                logs: [log]
            };
            groups.push(currentGroup);
        } else {
            currentGroup.logs.push(log);
        }
    });

    groups.forEach(group => {
        let hpMap = {};
        if (group.logs.length > 0) {
            group.logs[0].playersHp.forEach(p => {
                hpMap[p.hrid] = { current: p.current, max: p.max };
            });
        }
        group.logs.forEach(log => {
            if (hpMap[log.target]) {
                hpMap[log.target].current = log.afterHp;
            }
        });
        group.logs.forEach(log => {
            log.playersHp = Object.entries(hpMap).map(([hrid, val]) => ({
                hrid,
                current: val.current,
                max: val.max
            }));
        });
    });

    return groups;
}

// #endregion


// #region Equipment Sets

function initEquipmentSetsModal() {
    let equipmentSetsModal = document.getElementById("equipmentSetsModal");
    equipmentSetsModal.addEventListener("show.bs.modal", equipmentSetsModalShownHandler);

    let equipmentSetNameInput = document.getElementById("inputEquipmentSetName");
    equipmentSetNameInput.addEventListener("input", (event) => equipmentSetNameChangedHandler(event));

    let createEquipmentSetButton = document.getElementById("buttonCreateNewEquipmentSet");
    createEquipmentSetButton.addEventListener("click", createNewEquipmentSetHandler);
}

function equipmentSetsModalShownHandler() {
    resetNewEquipmentSetControls();
    updateEquipmentSetList();
}

function resetNewEquipmentSetControls() {
    let equipmentSetNameInput = document.getElementById("inputEquipmentSetName");
    equipmentSetNameInput.value = "";

    let createEquipmentSetButton = document.getElementById("buttonCreateNewEquipmentSet");
    createEquipmentSetButton.disabled = true;
}

function updateEquipmentSetList() {
    let newChildren = [];
    let equipmentSets = loadEquipmentSets();

    for (const equipmentSetName of Object.keys(equipmentSets)) {
        let row = createElement("div", "row mb-2");

        let nameCol = createElement("div", "col align-self-center", equipmentSetName);
        row.appendChild(nameCol);

        let loadButtonCol = createElement("div", "col-md-auto");
        let loadButton = createElement("button", "btn btn-primary", "Load");
        loadButton.setAttribute("data-i18n", "common:controls.load");
        loadButton.setAttribute("type", "button");
        loadButton.addEventListener("click", (_) => loadEquipmentSetHandler(equipmentSetName));
        loadButtonCol.appendChild(loadButton);
        row.appendChild(loadButtonCol);

        let saveButtonCol = createElement("div", "col-md-auto");
        let saveButton = createElement("button", "btn btn-primary", "Save");
        saveButton.setAttribute("data-i18n", "common:controls.save");
        saveButton.setAttribute("type", "button");
        saveButton.addEventListener("click", (_) => updateEquipmentSetHandler(equipmentSetName));
        saveButtonCol.appendChild(saveButton);
        row.appendChild(saveButtonCol);

        let deleteButtonCol = createElement("div", "col-md-auto");
        let deleteButton = createElement("button", "btn btn-danger", "Delete");
        deleteButton.setAttribute("data-i18n", "common:controls.delete");
        deleteButton.setAttribute("type", "button");
        deleteButton.addEventListener("click", (_) => deleteEquipmentSetHandler(equipmentSetName));
        deleteButtonCol.appendChild(deleteButton);
        row.appendChild(deleteButtonCol);

        newChildren.push(row);
    }

    let equipmentSetList = document.getElementById("equipmentSetList");
    equipmentSetList.replaceChildren(...newChildren);

    updateContent();
}

function equipmentSetNameChangedHandler(event) {
    let invalid = false;

    if (event.target.value.length == 0) {
        invalid = true;
    }

    let equipmentSets = loadEquipmentSets();
    if (equipmentSets[event.target.value]) {
        invalid = true;
    }

    let createEquipmentSetButton = document.getElementById("buttonCreateNewEquipmentSet");
    createEquipmentSetButton.disabled = invalid;
}

function createNewEquipmentSetHandler() {
    let equipmentSetNameInput = document.getElementById("inputEquipmentSetName");
    let equipmentSetName = equipmentSetNameInput.value;

    let equipmentSet = getEquipmentSetFromUI();
    let equipmentSets = loadEquipmentSets();
    equipmentSets[equipmentSetName] = equipmentSet;
    saveEquipmentSets(equipmentSets);

    resetNewEquipmentSetControls();
    updateEquipmentSetList();
}

function loadEquipmentSetHandler(name) {
    let equipmentSets = loadEquipmentSets();
    loadEquipmentSetIntoUI(equipmentSets[name]);
}

function updateEquipmentSetHandler(name) {
    let equipmentSet = getEquipmentSetFromUI();
    let equipmentSets = loadEquipmentSets();
    equipmentSets[name] = equipmentSet;
    saveEquipmentSets(equipmentSets);
}

function deleteEquipmentSetHandler(name) {
    let equipmentSets = loadEquipmentSets();
    delete equipmentSets[name];
    saveEquipmentSets(equipmentSets);

    updateEquipmentSetList();
}

function loadEquipmentSets() {
    return JSON.parse(localStorage.getItem("equipmentSets")) ?? {};
}

function saveEquipmentSets(equipmentSets) {
    localStorage.setItem("equipmentSets", JSON.stringify(equipmentSets));
}

function getEquipmentSetFromUI() {
    let equipmentSet = {
        levels: {},
        equipment: {},
        food: {},
        drinks: {},
        abilities: {},
        triggerMap: {},
        houseRooms: {},
        achievements: {},
    };

    ["stamina", "intelligence", "attack", "melee", "defense", "ranged", "magic"].forEach((skill) => {
        let levelInput = document.getElementById("inputLevel_" + skill);
        equipmentSet.levels[skill] = Number(levelInput.value);
    });

    ["head", "body", "legs", "feet", "hands", "weapon", "off_hand", "pouch", "neck", "earrings", "ring", "back", "charm"].forEach((type) => {
        let equipmentSelect = document.getElementById("selectEquipment_" + type);
        let enhancementLevelInput = document.getElementById("inputEquipmentEnhancementLevel_" + type);

        equipmentSet.equipment[type] = {
            equipment: equipmentSelect.value,
            enhancementLevel: Number(enhancementLevelInput.value),
        };
    });

    for (let i = 0; i < 3; i++) {
        let foodSelect = document.getElementById("selectFood_" + i);
        equipmentSet.food[i] = foodSelect.value;
    }

    for (let i = 0; i < 3; i++) {
        let drinkSelect = document.getElementById("selectDrink_" + i);
        equipmentSet.drinks[i] = drinkSelect.value;
    }

    for (let i = 0; i < 5; i++) {
        let abilitySelect = document.getElementById("selectAbility_" + i);
        let abilityLevelInput = document.getElementById("inputAbilityLevel_" + i);
        equipmentSet.abilities[i] = {
            ability: abilitySelect.value,
            level: Number(abilityLevelInput.value),
        };
    }

    equipmentSet.triggerMap = triggerMap;

    equipmentSet.houseRooms = player.houseRooms;
    equipmentSet.achievements = player.achievements;

    return equipmentSet;
}

function fixTriggerMap(triggerMap) {
    let delKeys = []
    for (const key of Object.keys(triggerMap)) {
        let err = false;
        if (null == triggerMap[key]) {
            triggerMap[key] = [];
        }
        for (const trigger of triggerMap[key]) {
            if (!combatTriggerConditionDetailMap[trigger.conditionHrid]) {
                err = true;
                break;
            }
        }
        if (err) {
            delKeys.push(key);
        }
    }
    for (const key of delKeys) {
        delete triggerMap[key];
    }
}

function loadEquipmentSetIntoUI(equipmentSet) {
    ["stamina", "intelligence", "attack", "melee", "defense", "ranged", "magic"].forEach((skill) => {
        let levelInput = document.getElementById("inputLevel_" + skill);
        if (skill == "melee" && !equipmentSet.levels["meleeLevel"] && equipmentSet.levels["powerLevel"]) {
            equipmentSet.levels["meleeLevel"] = equipmentSet.levels["powerLevel"];
        }
        levelInput.value = equipmentSet.levels[skill] ?? 1;
    });

    ["head", "body", "legs", "feet", "hands", "weapon", "off_hand", "pouch", "neck", "earrings", "ring", "back", "charm"].forEach((type) => {
        let equipmentSelect = document.getElementById("selectEquipment_" + type);
        let enhancementLevelInput = document.getElementById("inputEquipmentEnhancementLevel_" + type);

        let currentEquipment = equipmentSet.equipment[type];
        if (currentEquipment !== undefined) {
            equipmentSelect.value = currentEquipment.equipment;
            enhancementLevelInput.value = currentEquipment.enhancementLevel;
        } else {
            equipmentSelect.value = "";
            enhancementLevelInput.value = 0;
        }
    });

    for (let i = 0; i < 3; i++) {
        let foodSelect = document.getElementById("selectFood_" + i);
        foodSelect.value = equipmentSet.food[i];
    }

    for (let i = 0; i < 3; i++) {
        let drinkSelect = document.getElementById("selectDrink_" + i);
        drinkSelect.value = equipmentSet.drinks[i].replace("power", "melee");
    }

    let hasSpecial = false;
    if (equipmentSet.abilities && Object.keys(equipmentSet.abilities).length == 5) {
        hasSpecial = true;
    }

    for (let i = 0; i < (hasSpecial ? 5 : 4); i++) {
        let abilitySlot = hasSpecial ? i : (i + 1);
        let abilitySelect = document.getElementById("selectAbility_" + abilitySlot);
        let abilityLevelInput = document.getElementById("inputAbilityLevel_" + abilitySlot);

        if (hasSpecial && i == 0 && (
            equipmentSet.abilities[i].ability == "/abilities/aqua_aura" ||
            equipmentSet.abilities[i].ability == "/abilities/flame_aura" ||
            equipmentSet.abilities[i].ability == "/abilities/sylvan_aura"
        )
        ) {
            equipmentSet.abilities[i].ability = "/abilities/mystic_aura";
        }

        if (equipmentSet.abilities[i].ability == "/abilities/arcane_reflection") {
            equipmentSet.abilities[i].ability = "/abilities/retribution";
        }

        abilitySelect.value = equipmentSet.abilities[i].ability;
        abilityLevelInput.value = equipmentSet.abilities[i].level;
    }

    triggerMap = equipmentSet.triggerMap;
    fixTriggerMap(triggerMap);

    if (equipmentSet.houseRooms) {
        for (const room in equipmentSet.houseRooms) {
            const field = document.querySelector('[data-house-hrid="' + room + '"]');
            if (equipmentSet.houseRooms[room]) {
                field.value = equipmentSet.houseRooms[room];
            } else {
                field.value = '';
            }
        }
        player.houseRooms = equipmentSet.houseRooms;
    } else {
        let houseRooms = Object.values(houseRoomDetailMap);
        for (const room of Object.values(houseRooms)) {
            const field = document.querySelector('[data-house-hrid="' + room.hrid + '"]');
            field.value = '';
            player.houseRooms[room.hrid] = 0;
        }
    }

    if (equipmentSet.achievements) {
        for (const achievement in equipmentSet.achievements) {
            const field = document.querySelector('[data-achievement-hrid="' + achievement + '"]');
            if (equipmentSet.achievements[achievement]) {
                field.checked = true;
            } else {
                field.checked = false;
            }
            player.achievements[achievement] = field.checked;
        }
    } else {
        let achievements = Object.values(achievementDetailMap);
        for (const detail of Object.values(achievements)) {
            const field = document.querySelector('[data-achievement-hrid="' + detail.hrid + '"]');
            field.checked = false;
            player.achievements[detail.hrid] = false;
        }
    }
    refreshAchievementStatics();

    updateState();
    updateUI();

    updateContent();
}

// #endregion

// #region Error Handling

function initErrorHandling() {
    window.addEventListener("error", (event) => {
        showErrorModal(event.message);
    });

    let copyErrorButton = document.getElementById("buttonCopyError");
    copyErrorButton.addEventListener("click", (event) => {
        let errorInput = document.getElementById("inputError");
        navigator.clipboard.writeText(errorInput.value);
    });
}

function initImportExportModal() {
    let exportSetButton = document.getElementById("buttonExportSet");
    exportSetButton.addEventListener("click", (event) => {
        savePreviousPlayer(currentPlayerTabId);
        const activeTab = document.querySelector('#importTab .nav-link.active');
        if (activeTab.id === 'group-combat-tab') {
            doGroupExport();
        } else if (activeTab.id === 'solo-tab') {
            doSoloExport();
        }
    });

    let importSetButton = document.getElementById("buttonImportSet");
    importSetButton.addEventListener("click", (event) => {
        const activeTab = document.querySelector('#importTab .nav-link.active');
        if (activeTab.id === 'group-combat-tab') {
            doGroupImport();
        } else if (activeTab.id === 'solo-tab') {
            doSoloImport();
        }
        updateState();
        updateUI();
        resetImportInputs();
    });
}

function resetImportInputs() {
    document.getElementById('inputSetGroupCombatAll').value = '';
    document.getElementById('inputSetGroupCombatplayer1').value = '';
    document.getElementById('inputSetGroupCombatplayer2').value = '';
    document.getElementById('inputSetGroupCombatplayer3').value = '';
    document.getElementById('inputSetGroupCombatplayer4').value = '';
    document.getElementById('inputSetGroupCombatplayer5').value = '';
    document.getElementById('inputSetSolo').value = '';
}

function doGroupExport() {
    try {
        navigator.clipboard.writeText(JSON.stringify(playerDataMap)).then(() => alert("Current Group has been copied to clipboard."));
    } catch (err) {
        alert('Error copying to clipboard: ' + err);
    }
}

function doSoloExport() {
    let zoneSelect = document.getElementById("selectZone");
    let simulationTimeInput = document.getElementById("inputSimulationTime");
    let equipmentArray = [];
    for (const item in player.equipment) {
        if (player.equipment[item] != null) {
            equipmentArray.push({
                "itemLocationHrid": player.equipment[item].gameItem.equipmentDetail.type.replaceAll("equipment_types", "item_locations"),
                "itemHrid": player.equipment[item].hrid,
                "enhancementLevel": player.equipment[item].enhancementLevel
            });
        }
    }
    let playerArray = {
        "attackLevel": player.attackLevel,
        "magicLevel": player.magicLevel,
        "meleeLevel": player.meleeLevel,
        "rangedLevel": player.rangedLevel,
        "defenseLevel": player.defenseLevel,
        "staminaLevel": player.staminaLevel,
        "intelligenceLevel": player.intelligenceLevel,
        "equipment": equipmentArray
    };
    let abilitiesArray = [];
    for (let i = 0; i < 5; i++) {
        let abilityLevelInput = document.getElementById("inputAbilityLevel_" + i);
        let abilityName = document.getElementById("selectAbility_" + i);
        abilitiesArray[i] = { "abilityHrid": abilityName.value, "level": abilityLevelInput.value };
    }
    let drinksArray = [];
    for (let i = 0; i < drinks?.length; i++) {
        drinksArray.push({ "itemHrid": drinks[i] });
    }
    let foodArray = [];
    for (let i = 0; i < food?.length; i++) {
        foodArray.push({ "itemHrid": food[i] });
    }
    let state = {
        player: playerArray,
        food: { "/action_types/combat": foodArray },
        drinks: { "/action_types/combat": drinksArray },
        abilities: abilitiesArray,
        triggerMap: triggerMap,
        zone: zoneSelect.value,
        simulationTime: simulationTimeInput.value,
        houseRooms: player.houseRooms,
        achievements: player.achievements
    };
    try {
        navigator.clipboard.writeText(JSON.stringify(state)).then(() => alert("Current set has been copied to clipboard."));
    } catch (err) {
        alert('Error copying to clipboard: ' + err);
    }
}

function setPlayerData(playerId, inputElementId) {
    const inputElement = document.getElementById(inputElementId);
    const value = inputElement ? inputElement.value.trim() : "";

    // Only set the value in the map if it's not null, undefined, or empty
    if (value) {
        playerDataMap[playerId] = value;
        return true;
    }
    return false;
}

function doGroupImport() {
    let needUpdateCurrentTab = false;
    const value = document.getElementById("inputSetGroupCombatAll")?.value || "";
    if (!value.trim()) {
        for (let i of ['1', '2', '3', '4', '5']) {
            if (setPlayerData(i, "inputSetGroupCombatplayer" + i) && currentPlayerTabId == i) {
                needUpdateCurrentTab = true;
            }
        }
    } else {
        playerDataMap = JSON.parse(value);
        needUpdateCurrentTab = true;
    }

    if (needUpdateCurrentTab) {
        updateNextPlayer(currentPlayerTabId);
    }
}

function doSoloImport() {
    let importSet = document.getElementById("inputSetSolo").value;
    importSet = JSON.parse(importSet);
    ["stamina", "intelligence", "attack", "melee", "defense", "ranged", "magic"].forEach((skill) => {
        let levelInput = document.getElementById("inputLevel_" + skill);
        if (skill == "melee" && !importSet.player["meleeLevel"] && importSet.player["powerLevel"]) {
            importSet.player["meleeLevel"] = importSet.player["powerLevel"];
        }
        levelInput.value = importSet.player[skill + "Level"];
    });

    ["head", "body", "legs", "feet", "hands", "off_hand", "pouch", "neck", "earrings", "ring", "back", "charm"].forEach((type) => {
        let equipmentSelect = document.getElementById("selectEquipment_" + type);
        let enhancementLevelInput = document.getElementById("inputEquipmentEnhancementLevel_" + type);
        let currentEquipment = importSet.player.equipment.find(item => item.itemLocationHrid === "/item_locations/" + type);
        if (currentEquipment !== undefined) {
            equipmentSelect.value = currentEquipment.itemHrid;
            enhancementLevelInput.value = currentEquipment.enhancementLevel;
        } else {
            equipmentSelect.value = "";
            enhancementLevelInput.value = 0;
        }
    });

    let weaponSelect = document.getElementById("selectEquipment_weapon");
    let weaponEnhancementLevelInput = document.getElementById("inputEquipmentEnhancementLevel_weapon");
    let mainhandWeapon = importSet.player.equipment.find(item => item.itemLocationHrid === "/item_locations/main_hand");
    let twohandWeapon = importSet.player.equipment.find(item => item.itemLocationHrid === "/item_locations/two_hand");
    if (mainhandWeapon !== undefined) {
        weaponSelect.value = mainhandWeapon.itemHrid;
        weaponEnhancementLevelInput.value = mainhandWeapon.enhancementLevel;
    } else if (twohandWeapon !== undefined) {
        weaponSelect.value = twohandWeapon.itemHrid;
        weaponEnhancementLevelInput.value = twohandWeapon.enhancementLevel;
    } else {
        weaponSelect.value = "";
        weaponEnhancementLevelInput.value = 0;
    }
    importSet.drinks = importSet.drinks["/action_types/combat"];
    importSet.food = importSet.food["/action_types/combat"];
    for (let i = 0; i < 3; i++) {
        let drinkSelect = document.getElementById("selectDrink_" + i);
        let foodSelect = document.getElementById("selectFood_" + i);
        if (importSet.drinks[i] != null) {
            drinkSelect.value = importSet.drinks[i].itemHrid.replace('power', 'melee');
        } else {
            drinkSelect.value = "";
        }
        if (importSet.food[i] != null) {
            foodSelect.value = importSet.food[i].itemHrid;
        } else {
            foodSelect.value = "";
        }
    }

    let hasSpecial = false;
    if (importSet.abilities && Object.keys(importSet.abilities).length == 5) {
        hasSpecial = true;
    }

    for (let i = 0; i < (hasSpecial ? 5 : 4); i++) {
        let abilitySlot = hasSpecial ? i : (i + 1);
        let abilitySelect = document.getElementById("selectAbility_" + abilitySlot);
        let abilityLevelInput = document.getElementById("inputAbilityLevel_" + abilitySlot);

        if (hasSpecial && i == 0 && (
            importSet.abilities[i].abilityHrid == "/abilities/aqua_aura" ||
            importSet.abilities[i].abilityHrid == "/abilities/flame_aura" ||
            importSet.abilities[i].abilityHrid == "/abilities/sylvan_aura"
        )
        ) {
            importSet.abilities[i].abilityHrid = "/abilities/mystic_aura";
        }

        if (importSet.abilities[i].abilityHrid == "/abilities/arcane_reflection") {
            importSet.abilities[i].abilityHrid = "/abilities/retribution";
        }

        if (importSet.abilities[i] != null) {
            abilitySelect.value = importSet.abilities[i].abilityHrid;
            abilityLevelInput.value = String(importSet.abilities[i].level);
        } else {
            abilitySelect.value = "";
            abilityLevelInput.value = "1";
        }
    }

    if (importSet.triggerMap) {
        triggerMap = importSet.triggerMap;
        fixTriggerMap(triggerMap);
    }

    if (importSet.houseRooms) {
        for (const room in importSet.houseRooms) {
            const field = document.querySelector('[data-house-hrid="' + room + '"]');
            if (importSet.houseRooms[room]) {
                field.value = importSet.houseRooms[room];
            } else {
                field.value = '';
            }
        }
        player.houseRooms = importSet.houseRooms;
    } else {
        let houseRooms = Object.values(houseRoomDetailMap);
        for (const room of Object.values(houseRooms)) {
            const field = document.querySelector('[data-house-hrid="' + room.hrid + '"]');
            field.value = '';
            player.houseRooms[room.hrid] = 0;
        }
    }

    if (importSet.achievements) {
        for (const achievement in importSet.achievements) {
            const field = document.querySelector('[data-achievement-hrid="' + achievement + '"]');
            if (importSet.achievements[achievement]) {
                field.checked = true;
            } else {
                field.checked = false;
            }
            player.achievements[achievement] = field.checked;
        }
    } else {
        let achievements = Object.values(achievementDetailMap);
        for (const detail of Object.values(achievements)) {
            const field = document.querySelector('[data-achievement-hrid="' + detail.hrid + '"]');
            field.checked = false;
            player.achievements[detail.hrid] = false;
        }
    }
    refreshAchievementStatics();

    if ("zone" in importSet) {
        let zoneSelect = document.getElementById("selectZone");
        zoneSelect.value = importSet["zone"];
    }

    if ("simulationTime" in importSet) {
        let simulationDuration = document.getElementById("inputSimulationTime");
        simulationDuration.value = importSet["simulationTime"];
    }
}

function savePreviousPlayer(playerId) {
    let zoneSelect = document.getElementById("selectZone");
    let simulationTimeInput = document.getElementById("inputSimulationTime");
    let equipmentArray = [];
    for (const item in player.equipment) {
        if (player.equipment[item] != null) {
            equipmentArray.push({
                "itemLocationHrid": player.equipment[item].gameItem.equipmentDetail.type.replaceAll("equipment_types", "item_locations"),
                "itemHrid": player.equipment[item].hrid,
                "enhancementLevel": player.equipment[item].enhancementLevel
            });
        }
    }
    let playerArray = {
        "attackLevel": player.attackLevel,
        "magicLevel": player.magicLevel,
        "meleeLevel": player.meleeLevel,
        "rangedLevel": player.rangedLevel,
        "defenseLevel": player.defenseLevel,
        "staminaLevel": player.staminaLevel,
        "intelligenceLevel": player.intelligenceLevel,
        "equipment": equipmentArray
    };
    let abilitiesArray = [];
    for (let i = 0; i < 5; i++) {
        let abilityLevelInput = document.getElementById("inputAbilityLevel_" + i);
        let abilityName = document.getElementById("selectAbility_" + i);
        abilitiesArray[i] = { "abilityHrid": abilityName.value, "level": abilityLevelInput.value };
    }
    let drinksArray = [];
    for (let i = 0; i < drinks?.length; i++) {
        drinksArray.push({ "itemHrid": drinks[i] });
    }
    let foodArray = [];
    for (let i = 0; i < food?.length; i++) {
        foodArray.push({ "itemHrid": food[i] });
    }
    let state = {
        player: playerArray,
        food: { "/action_types/combat": foodArray },
        drinks: { "/action_types/combat": drinksArray },
        abilities: abilitiesArray,
        triggerMap: triggerMap,
        zone: zoneSelect.value,
        simulationTime: simulationTimeInput.value,
        houseRooms: player.houseRooms,
        achievements: player.achievements
    };
    try {
        playerDataMap[playerId] = JSON.stringify(state);
    } catch (err) {
        alert('Error copying to clipboard: ' + err);
    }
}

function updateNextPlayer(currentPlayerNumber) {
    let playerImportData = playerDataMap[currentPlayerNumber];
    let importSet = JSON.parse(playerImportData);
    ["stamina", "intelligence", "attack", "melee", "defense", "ranged", "magic"].forEach((skill) => {
        let levelInput = document.getElementById("inputLevel_" + skill);
        if (skill == "melee" && !importSet.player["meleeLevel"] && importSet.player["powerLevel"]) {
            importSet.player["meleeLevel"] = importSet.player["powerLevel"];
        }
        levelInput.value = importSet.player[skill + "Level"];
    });

    ["head", "body", "legs", "feet", "hands", "off_hand", "pouch", "neck", "earrings", "ring", "back", "charm"].forEach((type) => {

        let equipmentSelect = document.getElementById("selectEquipment_" + type);
        let enhancementLevelInput = document.getElementById("inputEquipmentEnhancementLevel_" + type);
        let currentEquipment = importSet.player.equipment.find(item => item.itemLocationHrid === "/item_locations/" + type);
        if (currentEquipment !== undefined) {
            equipmentSelect.value = currentEquipment.itemHrid;
            enhancementLevelInput.value = currentEquipment.enhancementLevel;
        } else {
            equipmentSelect.value = "";
            enhancementLevelInput.value = 0;
        }
    });

    let weaponSelect = document.getElementById("selectEquipment_weapon");
    let weaponEnhancementLevelInput = document.getElementById("inputEquipmentEnhancementLevel_weapon");
    let mainhandWeapon = importSet.player.equipment.find(item => item.itemLocationHrid === "/item_locations/main_hand");
    let twohandWeapon = importSet.player.equipment.find(item => item.itemLocationHrid === "/item_locations/two_hand");
    if (mainhandWeapon !== undefined) {
        weaponSelect.value = mainhandWeapon.itemHrid;
        weaponEnhancementLevelInput.value = mainhandWeapon.enhancementLevel;
    } else if (twohandWeapon !== undefined) {
        weaponSelect.value = twohandWeapon.itemHrid;
        weaponEnhancementLevelInput.value = twohandWeapon.enhancementLevel;
    } else {
        weaponSelect.value = "";
        weaponEnhancementLevelInput.value = 0;
    }
    importSet.drinks = importSet.drinks["/action_types/combat"];
    importSet.food = importSet.food["/action_types/combat"];
    for (let i = 0; i < 3; i++) {
        let drinkSelect = document.getElementById("selectDrink_" + i);
        let foodSelect = document.getElementById("selectFood_" + i);
        if (importSet.drinks[i] != null) {
            drinkSelect.value = importSet.drinks[i].itemHrid.replace('power', 'melee');
        } else {
            drinkSelect.value = "";
        }
        if (importSet.food[i] != null) {
            foodSelect.value = importSet.food[i].itemHrid;
        } else {
            foodSelect.value = "";
        }
    }

    let hasSpecial = false;
    if (importSet.abilities && Object.keys(importSet.abilities).length == 5) {
        hasSpecial = true;
    }

    for (let i = 0; i < (hasSpecial ? 5 : 4); i++) {
        let abilitySlot = hasSpecial ? i : (i + 1);
        let abilitySelect = document.getElementById("selectAbility_" + abilitySlot);
        let abilityLevelInput = document.getElementById("inputAbilityLevel_" + abilitySlot);

        if (hasSpecial && i == 0 && (
            importSet.abilities[i].abilityHrid == "/abilities/aqua_aura" ||
            importSet.abilities[i].abilityHrid == "/abilities/flame_aura" ||
            importSet.abilities[i].abilityHrid == "/abilities/sylvan_aura"
        )
        ) {
            importSet.abilities[i].abilityHrid = "/abilities/mystic_aura";
        }

        if (importSet.abilities[i].abilityHrid == "/abilities/arcane_reflection") {
            importSet.abilities[i].abilityHrid = "/abilities/retribution";
        }

        if (importSet.abilities[i] != null) {
            abilitySelect.value = importSet.abilities[i].abilityHrid;
            abilityLevelInput.value = String(importSet.abilities[i].level);
        } else {
            abilitySelect.value = "";
            abilityLevelInput.value = "1";
        }
    }

    if (importSet.triggerMap) {
        triggerMap = importSet.triggerMap;
        fixTriggerMap(triggerMap);
    }

    { // reset all houseRooms
        let houseRooms = Object.values(houseRoomDetailMap);
        for (const room of Object.values(houseRooms)) {
            const field = document.querySelector('[data-house-hrid="' + room.hrid + '"]');
            field.value = '';
            player.houseRooms[room.hrid] = 0;
        }
    }
    if (importSet.houseRooms) {
        for (const room in importSet.houseRooms) {
            const field = document.querySelector('[data-house-hrid="' + room + '"]');
            if (importSet.houseRooms[room]) {
                field.value = importSet.houseRooms[room];
            } else {
                field.value = '';
            }
        }
        player.houseRooms = importSet.houseRooms;
    }

    { // reset all achievements
        let achievements = Object.values(achievementDetailMap);
        for (const detail of Object.values(achievements)) {
            const field = document.querySelector('[data-achievement-hrid="' + detail.hrid + '"]');
            field.checked = false;
            player.achievements[detail.hrid] = false;
        }
    }
    if (importSet.achievements) {
        for (const achievement in importSet.achievements) {
            const field = document.querySelector('[data-achievement-hrid="' + achievement + '"]');
            if (importSet.achievements[achievement]) {
                field.checked = true;
                player.achievements[achievement] = true;
            } else {
                field.checked = false;
                player.achievements[achievement] = false;
            }
        }
    }
    refreshAchievementStatics();
}

function showErrorModal(error) {
    let zoneSelect = document.getElementById("selectZone");
    let simulationTimeInput = document.getElementById("inputSimulationTime");

    let state = {
        error: error,
        player: player,
        food: food,
        drinks: drinks,
        abilities: abilities,
        triggerMap: triggerMap,
        modalTriggers: modalTriggers,
        zone: zoneSelect.value,
        simulationTime: simulationTimeInput.value,
    };

    for (let i = 0; i < 5; i++) {
        let abilityLevelInput = document.getElementById("inputAbilityLevel_" + i);
        state["abilityLevel" + i] = abilityLevelInput.value;
    }

    let errorInput = document.getElementById("inputError");
    errorInput.value = JSON.stringify(state);

    let errorModal = new bootstrap.Modal(document.getElementById("errorModal"));
    errorModal.show();
}

window.prices;

async function fetchPrices() {
    let response = null;
    try {
        response = await fetch('https://www.milkywayidle.com/game_data/marketplace.json'
            , {
                mode: 'cors'
            }
        );
        if (!response.ok) {
            console.log('Error fetching prices');
        }
    } catch (error) {
        console.error(error);
    }

    if (response == null) {
        try {
            response = await fetch('https://www.milkywayidlecn.com/game_data/marketplace.json'
                , {
                    mode: 'cors'
                }
            );
            if (!response.ok) {
                console.log('Error fetching prices');
            }
        } catch (error) {
            console.error(error);
        }
    }

    if (!response || !response.ok) {
        return;
    }

    try {

        let btn = document.querySelector('#buttonGetPrices');
        btn.style.backgroundColor = 'green';

        const pricesJson = await response.json();

        const priceTmp = pricesJson['marketData'];
        window.prices = {};
        for (const item in itemDetailMap) {
            const hrid = itemDetailMap[item].hrid;
            if (hrid in priceTmp) {
                window.prices[hrid] = { "ask": -1, "bid": -1, "vendor": itemDetailMap[item].sellPrice };
                if (priceTmp[hrid]['0']) {
                    window.prices[hrid].ask = priceTmp[hrid]['0'].a;
                    window.prices[hrid].bid = priceTmp[hrid]['0'].b;
                }
            }
        } 

        window.prices["/items/coin"] = { "ask": 1, "bid": 1, "vendor": 1 };

        window.prices["/items/small_treasure_chest"] = {
            "ask": openableLootDropMap["/items/small_treasure_chest"].map((item) => {
                return item.itemHrid in window.prices ? window.prices[item.itemHrid].ask * item.dropRate * (item.maxCount + item.minCount) / 2 : 0;
            }).reduce((a, b) => a + b, 0),
            "bid": openableLootDropMap["/items/small_treasure_chest"].map((item) => {
                return item.itemHrid in window.prices ? window.prices[item.itemHrid].bid * item.dropRate * (item.maxCount + item.minCount) / 2 : 0;
            }).reduce((a, b) => a + b, 0),
            "vendor": openableLootDropMap["/items/small_treasure_chest"].map((item) => {
                return item.itemHrid in window.prices ? window.prices[item.itemHrid].vendor : 0;
            }).reduce((a, b) => a + b, 0),
        };

        window.prices["/items/medium_treasure_chest"] = {
            "ask": openableLootDropMap["/items/medium_treasure_chest"].map((item) => {
                return item.itemHrid in window.prices ? window.prices[item.itemHrid].ask * item.dropRate * (item.maxCount + item.minCount) / 2 : 0;
            }).reduce((a, b) => a + b, 0),
            "bid": openableLootDropMap["/items/medium_treasure_chest"].map((item) => {
                return item.itemHrid in window.prices ? window.prices[item.itemHrid].bid * item.dropRate * (item.maxCount + item.minCount) / 2 : 0;
            }).reduce((a, b) => a + b, 0),
            "vendor": openableLootDropMap["/items/medium_treasure_chest"].map((item) => {
                return item.itemHrid in window.prices ? window.prices[item.itemHrid].vendor : 0;
            }).reduce((a, b) => a + b, 0),
        };

        window.prices["/items/large_treasure_chest"] = {
            "ask": openableLootDropMap["/items/large_treasure_chest"].map((item) => {
                return item.itemHrid in window.prices ? window.prices[item.itemHrid].ask * item.dropRate * (item.maxCount + item.minCount) / 2 : 0;
            }).reduce((a, b) => a + b, 0),
            "bid": openableLootDropMap["/items/large_treasure_chest"].map((item) => {
                return item.itemHrid in window.prices ? window.prices[item.itemHrid].bid * item.dropRate * (item.maxCount + item.minCount) / 2 : 0;
            }).reduce((a, b) => a + b, 0),
            "vendor": openableLootDropMap["/items/large_treasure_chest"].map((item) => {
                return item.itemHrid in window.prices ? window.prices[item.itemHrid].vendor : 0;
            }).reduce((a, b) => a + b, 0),
        };

    } catch (error) {
        console.error(error);
    }
}

document.getElementById("buttonGetPrices").onclick = async () => {
    await fetchPrices();
};

document.addEventListener("input", (e) => {
    let element = e.target;
    if (element.tagName == "TD" && element.parentNode.parentNode.parentNode.classList.value.includes('profit-table')) {
        let tableId = element.parentNode.parentNode.parentNode.id;
        let row = element.parentNode.querySelectorAll('td');
        let item = row[0].getAttribute('data-i18n').split('.')[1];
        let newPrice = element.innerText;

        let revenueSetting = document.getElementById('selectPrices_drops').value;
        let expensesSetting = document.getElementById('selectPrices_consumables').value;

        let expensesDifference = 0;
        let revenueDifference = 0;
        let noRngRevenueDifference = 0;

        if (tableId == 'expensesTable') {
            expensesDifference = updateTable('expensesTable', item, newPrice);
            if (revenueSetting == expensesSetting) {
                revenueDifference = updateTable('revenueTable', item, newPrice);
                noRngRevenueDifference = updateTable('noRngRevenueTable', item, newPrice);
            }
            if (window.prices) {
                if (!window.prices[item]) window.prices[item] = { "ask": -1, "bid": -1, "vendor": itemDetailMap[item].sellPrice };
                if (expensesSetting == 'bid') {
                    window.prices[item]['bid'] = newPrice;
                } else {
                    window.prices[item]['ask'] = newPrice;
                }
            }
        } else {
            revenueDifference = updateTable('revenueTable', item, newPrice);
            noRngRevenueDifference = updateTable('noRngRevenueTable', item, newPrice);
            if (revenueSetting == expensesSetting) {
                expensesDifference = updateTable('expensesTable', item, newPrice);
            }
            if (window.prices) {
                if (!window.prices[item]) window.prices[item] = { "ask": -1, "bid": -1, "vendor": itemDetailMap[item].sellPrice };
                if (revenueSetting == 'bid') {
                    window.prices[item]['bid'] = newPrice;
                } else {
                    window.prices[item]['ask'] = newPrice;
                }
            }
        }

        window.expenses += expensesDifference;
        document.getElementById('expensesSpan').innerText = window.expenses.toLocaleString();
        window.revenue += revenueDifference;
        document.getElementById('revenueSpan').innerText = window.revenue.toLocaleString();
        window.noRngRevenue += noRngRevenueDifference;
        document.getElementById('noRngRevenueSpan').innerText = window.noRngRevenue.toLocaleString();

        window.profit = window.revenue - window.expenses;
        document.getElementById('profitPreview').innerText = window.profit.toLocaleString();
        document.getElementById('profitSpan').innerText = window.profit.toLocaleString();
        window.noRngProfit = window.noRngRevenue - window.expenses;
        document.getElementById('noRngProfitSpan').innerText = window.noRngProfit.toLocaleString();
        document.getElementById('noRngProfitPreview').innerText = window.noRngProfit.toLocaleString();
    }
});

function updateTable(tableId, item, price) {
    let row = document.querySelector('#' + tableId + ' .' + CSS.escape(item));
    if (row == null) {
        return 0;
    }

    row = row.querySelectorAll('td');
    let priceTd = row[1];
    let amountTd = row[2];
    let totalTd = row[3];
    let oldTotal = totalTd.innerText;
    let newTotal = price * amountTd.innerText;

    if (priceTd.innerText != price) {
        priceTd.innerText = price;
    }
    totalTd.innerText = newTotal;

    return newTotal - oldTotal;
}

// #endregion

function initPatchNotes() {
    const patchNotesRows = document.getElementById("patchNotes");
    for (const pn in patchNote) {
        const patchNoteContainer = document.createElement("div");
        patchNotesRows.setAttribute('class', 'col-12 mb-4');

        const patchNoteElement = document.createElement("h6");
        patchNoteElement.innerHTML = pn;
        const patchNoteList = document.createElement("ul");
        for (const note of patchNote[pn]) {
            const noteElement = document.createElement("li");
            noteElement.innerHTML = note;
            patchNoteList.appendChild(noteElement);
        }
        patchNoteContainer.appendChild(patchNoteElement);
        patchNoteContainer.appendChild(patchNoteList);

        patchNotesRows.appendChild(patchNoteContainer);
    }
}

function initExtraBuffSection() {
    // mooPass
    let mooPassToggle = document.getElementById("mooPassToggle");
    let mooPass = localStorage.getItem('mooPass');
    if (mooPass) {
        mooPassToggle.checked = Boolean(mooPass);
    }
    mooPassToggle.onchange = () => {
        localStorage.setItem('mooPass', mooPassToggle.checked);
        // 如果开启入战属性模式，实时更新
        if (isCombatReadyMode) {
            updateCombatStatsUI();
        }
    }
    
    // comExp
    let comExpToggle = document.getElementById("comExpToggle");
    let comExpInput = document.getElementById("comExpInput");
    let comExp = localStorage.getItem('comExp');
    if (comExp) {
        let comExpNumber = Number(comExp);
        if (comExpNumber > 0) {
            comExpToggle.checked = true;
            comExpInput.value = comExpNumber;
        } else {
            comExpToggle.checked = false;
            comExpInput.disabled = true;
        }
    }
    const updateComExp = () => {
        if (comExpToggle.checked) {
            let comExp = Number(comExpInput.value);
            localStorage.setItem('comExp', comExp); 
            comExpInput.disabled = false;
        } else {
            localStorage.setItem('comExp', 0);
            comExpInput.disabled = true;
        }
        // 如果开启入战属性模式，实时更新
        if (isCombatReadyMode) {
            updateCombatStatsUI();
        }
    }
    comExpToggle.onchange = updateComExp;
    comExpInput.onchange = updateComExp;

    // comDrop
    let comDropToggle = document.getElementById("comDropToggle");
    let comDropInput = document.getElementById("comDropInput");
    let comDrop = localStorage.getItem('comDrop');
    if (comDrop) {
        let comDropNumber = Number(comDrop);
        if (comDropNumber > 0) {
            comDropToggle.checked = true;
            comDropInput.value = comDropNumber;
        } else {
            comDropToggle.checked = false;
            comDropInput.disabled = true;
        }
    }
    const updateComDrop = () => {
        if (comDropToggle.checked) {
            let comDrop = Number(comDropInput.value);
            localStorage.setItem('comDrop', comDrop); 
            comDropInput.disabled = false;
        } else {
            localStorage.setItem('comDrop', 0);
            comDropInput.disabled = true;
        }
        // 如果开启入战属性模式，实时更新
        if (isCombatReadyMode) {
            updateCombatStatsUI();
        }
    }
    comDropToggle.onchange = updateComDrop;
    comDropInput.onchange = updateComDrop;
}


function updateState() {
    updateEquipmentState();
    updateLevels();
    updateFoodState();
    updateDrinksState();
    updateAbilityState();
}

function updateUI() {
    updateCombatStatsUI();
    updateFoodUI();
    updateDrinksUI();
    updateAbilityUI();

    updateContent();
}

const darkModeToggle = document.getElementById('darkModeToggle');
const body = document.body;

if (localStorage.getItem('darkModeEnabled') === 'true') {
    body.classList.add('dark-mode');
    const tables = document.getElementsByClassName('profit-table');
    for (const table of tables) {
        table.classList.toggle('table-striped');
    }
    darkModeToggle.checked = true;
}

darkModeToggle.addEventListener('change', () => {
    body.classList.toggle('dark-mode');
    const tables = document.getElementsByClassName('profit-table');
    for (const table of tables) {
        table.classList.toggle('table-striped');
    }
    localStorage.setItem('darkModeEnabled', darkModeToggle.checked);
});

function updateContent() {
    document.querySelectorAll('[data-i18n]').forEach(function (element) {
        const key = element.getAttribute('data-i18n');
        if (key) {
            element.textContent = i18next.t(key);
        }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (element) {
        const key = element.getAttribute('data-i18n-placeholder');
        if (key) {
            element.placeholder = i18next.t(key);
        }
    });

    document.querySelectorAll('option[data-i18n]').forEach(function (element) {
        const key = element.getAttribute('data-i18n');
        if (key) {
            element.textContent = i18next.t(key);
        }
    });
}

initEquipmentSection();
initHouseRoomsModal();
initAchievementsModal();
initLevelSection();
initFoodSection();
initDrinksSection();
initAbilitiesSection();
initZones();
initDungeons();
initTriggerModal();
initSimulationControls();
initEquipmentSetsModal();
initErrorHandling();
initImportExportModal();
initDamageDoneTaken();
initPatchNotes();
initExtraBuffSection();
initHpMpVisualization();
initCombatReadyStatsToggle();

updateState();
updateUI();
