const chai = require('chai');
const expect = chai.expect
const { ethers } = require('hardhat');
const BigNumber = require('bignumber.js')

describe('MasterChef test', function() {

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

    async function leaveStaking(account, amount, kikiToken, syrupBar, masterChef) {
        let oldStakingInMasterChef = await kikiToken.balanceOf(masterChef.address);
        let oldStakingInSyrupBar = await syrupBar.balanceOf(account.address);
        let oldBalanceInKiKi = await kikiToken.balanceOf(account.address);
        let oldTotalSupplyInKiKi = await kikiToken.totalSupply();
        let oldTotalSupplyInSyrupBar = await syrupBar.totalSupply();
        let oldSyrupBalanceInKiKi = await kikiToken.balanceOf(syrupBar.address);
        let pool = await masterChef.poolInfo(0);
        let user = await masterChef.userInfo(0, account.address);
        let lpSupply = oldStakingInMasterChef;
        let kikiPerBlock = await masterChef.kikiPerBlock();
        let totalAllocPoint = await masterChef.totalAllocPoint();
        let BONUS_MULTIPLIER = await masterChef.BONUS_MULTIPLIER();
        let tx = await masterChef.connect(account).leaveStaking(amount);
        let result = await tx.wait();
        let blockBumber = ethers.utils.parseUnits(result.blockNumber.toString(), 0);
        let pendingResult = await pendingKiKi(pool, user, lpSupply, blockBumber, kikiPerBlock, totalAllocPoint, BONUS_MULTIPLIER);
        let pending = pendingResult[0];
        let totalPending = pendingResult[1];
        // syrupBar地址的奖励kiki变化
        expect(await kikiToken.balanceOf(syrupBar.address)).to.equal(oldSyrupBalanceInKiKi.add(totalPending).sub(pending));
        // 用户地址的kiki变化
        expect(await kikiToken.balanceOf(account.address)).to.equal(oldBalanceInKiKi.add(pending).add(amount));
        // kiki总代币量变化
        expect(await kikiToken.totalSupply()).to.equal(oldTotalSupplyInKiKi.add(totalPending));
        // masterChef质押kiki量变化
        expect(await kikiToken.balanceOf(masterChef.address)).to.equal(oldStakingInMasterChef.sub(amount));
        // syrupBar用户质押账本余额变化
        expect(await syrupBar.balanceOf(account.address)).to.equal(oldStakingInSyrupBar.sub(amount));
        // syrupBar总质押数额变化
        expect(await syrupBar.totalSupply()).to.equal(oldTotalSupplyInSyrupBar.sub(amount));
    }

    it("Deploy", async function () {
        const mockKiKiToken = await ethers.getContractFactory('mockKiKiToken');
        this.kikiToken = await mockKiKiToken.deploy("KiKiToken", "KIKI");
        await this.kikiToken.deployed();
        let SyrupBar = await ethers.getContractFactory('SyrupBar');
        this.syrupBar = await SyrupBar.deploy(this.kikiToken.address);
        await this.syrupBar.deployed();
        let MasterChef = await ethers.getContractFactory('MasterChef');
        this.perBlock = ethers.utils.parseUnits("10", 18);
        let startBlock = 0;
        this.masterChef = await MasterChef.deploy(this.kikiToken.address, this.syrupBar.address, this.perBlock, startBlock);
        await this.masterChef.deployed();
    })

    it("mint test token", async function () {
        const [, signer1, signer2] = await ethers.getSigners();
        let amount = ethers.utils.parseUnits("10000000", 18);
        let tx = await this.kikiToken.mint(signer1.address, amount);
        await tx.wait();
        tx = await this.kikiToken.mint(signer2.address, amount);
        await tx.wait();
        expect(await this.kikiToken.balanceOf(signer1.address)).to.equal(amount);
        expect(await this.kikiToken.balanceOf(signer2.address)).to.equal(amount);
        expect(await this.kikiToken.totalSupply()).to.equal(amount.mul(2));
    })

    it("transfer owner", async function () {
        let tx = await this.kikiToken.transferOwnership(this.masterChef.address);
        await tx.wait();
        expect(await this.kikiToken.owner()).to.equal(this.masterChef.address);
        tx = await this.syrupBar.transferOwnership(this.masterChef.address);
        await tx.wait();
        expect(await this.syrupBar.owner()).to.equal(this.masterChef.address);
    })

    it("aprove", async function () {
        const [, signer1, signer2] = await ethers.getSigners();
        let amount = await this.kikiToken.balanceOf(signer1.address);
        let tx = await this.kikiToken.connect(signer1).approve(this.masterChef.address, amount);
        await tx.wait();
        expect(await this.kikiToken.allowance(signer1.address, this.masterChef.address)).to.equal(amount);
        tx = await this.kikiToken.connect(signer2).approve(this.masterChef.address, amount);
        await tx.wait();
        expect(await this.kikiToken.allowance(signer2.address, this.masterChef.address)).to.equal(amount);
    })

    it("account1 enter staking", async function () {
        const [, signer1] = await ethers.getSigners();
        let amount = 0;
        let tx = await this.masterChef.connect(signer1).enterStaking(amount);
        await tx.wait();
        amount = 1;
        tx = await this.masterChef.connect(signer1).enterStaking(amount);
        await tx.wait();
        expect(await this.kikiToken.balanceOf(this.masterChef.address)).to.equal(amount);
        expect(await this.syrupBar.balanceOf(signer1.address)).to.equal(amount);
        let amount2 = ethers.utils.parseUnits("1000000", 18);
        tx = await this.masterChef.connect(signer1).enterStaking(amount2);
        await tx.wait();
        expect(await this.kikiToken.balanceOf(this.masterChef.address)).to.equal(amount2.add(amount));
        expect(await this.syrupBar.balanceOf(signer1.address)).to.equal(amount2.add(amount));
    })

    it("account1 harvest", async function () {
        const [, signer1] = await ethers.getSigners();
        let amount = ethers.utils.parseUnits('0', 18);
        await leaveStaking(signer1, amount, this.kikiToken, this.syrupBar, this.masterChef);
    })

    it("account1 leave staking: 1 wei amount", async function () {
        const [, signer1] = await ethers.getSigners();
        let amount = ethers.utils.parseUnits("1", 0);
        await leaveStaking(signer1, amount, this.kikiToken, this.syrupBar, this.masterChef);
    })

    it("account1 leave staking twice: 10 ether amount once", async function () {
        const [, signer1] = await ethers.getSigners();
        let amount = ethers.utils.parseUnits("10", 18);
        let count = 2;
        while(count > 0) {
            await leaveStaking(signer1, amount, this.kikiToken, this.syrupBar, this.masterChef);
            --count;
        }
    })

    it("account2 enter staking", async function () {
        const [, , signer2] = await ethers.getSigners();
        let amount = ethers.utils.parseUnits("1000000", 18);
        let oldStakingInMasterChef = await this.kikiToken.balanceOf(this.masterChef.address)
        let tx = await this.masterChef.connect(signer2).enterStaking(amount);
        await tx.wait();
        expect(await this.kikiToken.balanceOf(this.masterChef.address)).to.equal(oldStakingInMasterChef.add(amount));
        expect(await this.syrupBar.balanceOf(signer2.address)).to.equal(amount);
    })

    it("account2 harvest", async function () {
        const [, , signer2] = await ethers.getSigners();
        let amount = ethers.utils.parseUnits('0', 18);
        await leaveStaking(signer2, amount, this.kikiToken, this.syrupBar, this.masterChef);
    })

    it("account2 leave staking", async function () {
        const [, , signer2] = await ethers.getSigners();
        let amount = ethers.utils.parseUnits("10", 18);
        await leaveStaking(signer2, amount, this.kikiToken, this.syrupBar, this.masterChef);
    })
})