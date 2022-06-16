
const { ethers } = require('hardhat');
const BigNumber = require('bignumber.js')

let SatusToCheck = function () {
   return {
    "stakingInMasterChef" : 0,
    "stakingInSyrupBar" : 0,
    "accountBalanceInKiKi" : 0,
    "totalSupplyInKiKi" : 0,
    "totalSupplyInSyrupBar" : 0,
    "syrupBalanceInKiKi" : 0,
    "lpSupplyInMasterChef" : 0
    }
}

let MasterChefStatus = function () {
   return {
    "kikiPerBlock" : 0,
    "totalAllocPoint" : 0,
    "BONUS_MULTIPLIER" : 0
    }
}

async function getMultiplier(_from, _to, BONUS_MULTIPLIER) {
    return _to.sub(_from).mul(BONUS_MULTIPLIER);
}

async function pendingKiKi(pool, user, lpSupply, blockNumber, kikiPerBlock, totalAllocPoint, BONUS_MULTIPLIER) {
    let accKiKiPerShare = pool.accKiKiPerShare;
    let kikiReward;
    if (blockNumber > pool.lastRewardBlock && lpSupply != 0) {
        let multiplier = await getMultiplier(pool.lastRewardBlock, blockNumber, BONUS_MULTIPLIER);
        kikiReward = kikiPerBlock.mul(multiplier).mul(pool.allocPoint).div(totalAllocPoint);
        accKiKiPerShare = accKiKiPerShare.add(kikiReward.mul(1e12).div(lpSupply));
    }
    return [user.amount.mul(accKiKiPerShare).div(1e12).sub(user.rewardDebt), kikiReward];
}

async function recordMasterChefParams(masterChef) {
    let masterChefStatus = new MasterChefStatus;
    masterChefStatus.kikiPerBlock = await masterChef.kikiPerBlock();
    masterChefStatus.totalAllocPoint = await masterChef.totalAllocPoint();
    masterChefStatus.BONUS_MULTIPLIER = await masterChef.BONUS_MULTIPLIER();
    return masterChefStatus;
}

async function recordOldStatusInContracts(account, kikiToken, syrupBar, masterChef) {
    let statusToCheck = new SatusToCheck;
    statusToCheck.stakingInMasterChef = await kikiToken.balanceOf(masterChef.address);
    statusToCheck.stakingInSyrupBar = await syrupBar.balanceOf(account);
    statusToCheck.accountBalanceInKiKi = await kikiToken.balanceOf(account);
    statusToCheck.totalSupplyInKiKi = await kikiToken.totalSupply();
    statusToCheck.totalSupplyInSyrupBar = await syrupBar.totalSupply();
    statusToCheck.syrupBalanceInKiKi = await kikiToken.balanceOf(syrupBar.address);
    statusToCheck.lpSupplyInMasterChef = statusToCheck.stakingInMasterChef;
    return statusToCheck;
}

async function updateNewStatus(account, amount, pool, user, blockNumber, masterChefStatus, statusToCheck) {
    let pendingResult = await pendingKiKi(pool, user, statusToCheck.lpSupplyInMasterChef, blockNumber,
        masterChefStatus.kikiPerBlock, masterChefStatus.totalAllocPoint, masterChefStatus.BONUS_MULTIPLIER);
    let pending = pendingResult[0];
    let totalPending = pendingResult[1];
    statusToCheck.syrupBalanceInKiKi = statusToCheck.syrupBalanceInKiKi.add(totalPending).sub(pending);
    statusToCheck.accountBalanceInKiKi = statusToCheck.accountBalanceInKiKi.add(pending).add(amount);
    statusToCheck.totalSupplyInKiKi = statusToCheck.totalSupplyInKiKi.add(totalPending);
    statusToCheck.stakingInMasterChef = statusToCheck.stakingInMasterChef.sub(amount);
    statusToCheck.stakingInSyrupBar = statusToCheck.stakingInSyrupBar.sub(amount);
    statusToCheck.totalSupplyInSyrupBar = statusToCheck.totalSupplyInSyrupBar.sub(amount);
    return statusToCheck;
}

module.exports = {
    updateNewStatus,
    recordOldStatusInContracts,
    recordMasterChefParams,
    SatusToCheck,
    MasterChefStatus
}