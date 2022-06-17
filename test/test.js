const chai = require('chai');
const expect = chai.expect
const { ethers } = require('hardhat');
const BigNumber = require('bignumber.js')
const {
    updateNewStatus,
    recordOldStatusInContracts,
    recordMasterChefParams,
    SatusToCheck,
    MasterChefStatus
} = require('./utils.js');

describe('MasterChef test', function() {

    it("Deploy mockKiKiToken", async function () {
        const mockKiKiToken = await ethers.getContractFactory('mockKiKiToken');

        this.kikiToken = await mockKiKiToken.deploy("KiKiToken", "KIKI");
        await this.kikiToken.deployed();
    })

    it("Deploy KiKiSeedToken", async function () {
        let KiKiSeedToken = await ethers.getContractFactory('KiKiSeedToken');

        this.kikiSeedToken = await KiKiSeedToken.deploy(this.kikiToken.address);
        await this.kikiSeedToken.deployed();
    })

    it("Deploy MasterChef", async function () {
        this.perBlock = ethers.utils.parseUnits("10", 18);
        let startBlock = 0;
        let MasterChef = await ethers.getContractFactory('MasterChef');

        this.masterChef = await MasterChef.deploy(this.kikiToken.address, this.kikiSeedToken.address, this.perBlock, startBlock);
        await this.masterChef.deployed();
    })

    it("mint 20000000 KiKi to account and account2", async function () {
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

    it("transfer kiki owner to masterChef", async function () {
        let tx = await this.kikiToken.transferOwnership(this.masterChef.address);
        await tx.wait();

        expect(await this.kikiToken.owner()).to.equal(this.masterChef.address);
    })

    it("transfer kikiSeedToken owner to masterChef", async function () {
        let tx = await this.kikiSeedToken.transferOwnership(this.masterChef.address);
        await tx.wait();

        expect(await this.kikiSeedToken.owner()).to.equal(this.masterChef.address);
    })

    it("account1/account2 aprove 10000000.0/10000000.0 KiKi to masterChef", async function () {
        const [, signer1, signer2] = await ethers.getSigners();
        let amount = await this.kikiToken.balanceOf(signer1.address);

        let tx = await this.kikiToken.connect(signer1).approve(this.masterChef.address, amount);
        await tx.wait();

        expect(await this.kikiToken.allowance(signer1.address, this.masterChef.address)).to.equal(amount);

        tx = await this.kikiToken.connect(signer2).approve(this.masterChef.address, amount);
        await tx.wait();

        expect(await this.kikiToken.allowance(signer2.address, this.masterChef.address)).to.equal(amount);
    })

    it("account1 call enterStaking, amount = 0 wei/1 wei/1000000.0 KiKi", async function () {
        const [, signer1] = await ethers.getSigners();
        let amount0 = 0;
        let amount1 = 1;
        let amount2 = ethers.utils.parseUnits("1000000", 18);

        let tx = await this.masterChef.connect(signer1).enterStaking(amount0);
        await tx.wait();

        tx = await this.masterChef.connect(signer1).enterStaking(amount1);
        await tx.wait();

        expect(await this.kikiToken.balanceOf(this.masterChef.address)).to.equal(amount1);
        expect(await this.kikiSeedToken.balanceOf(signer1.address)).to.equal(amount1);

        tx = await this.masterChef.connect(signer1).enterStaking(amount2);
        await tx.wait();

        expect(await this.kikiToken.balanceOf(this.masterChef.address)).to.equal(amount2.add(amount1));
        expect(await this.kikiSeedToken.balanceOf(signer1.address)).to.equal(amount2.add(amount1));
    })

    it("account1 harvest, check kikiSeedToken/masterChef/account1 balance in KiKiToken; \
check account1 balance in kikiSeedToken; \
check KiKiToken and kikiSeedToken total supply", async function () {
        const [, signer1] = await ethers.getSigners();
        let amount = ethers.utils.parseUnits('0', 18);
        let pool = await this.masterChef.poolInfo(0);
        let user = await this.masterChef.userInfo(0, signer1.address);
        let masterChefStatus = await recordMasterChefParams(this.masterChef);
        let statusToCheck = await recordOldStatusInContracts(signer1.address, this.kikiToken, this.kikiSeedToken, this.masterChef);

        let tx = await this.masterChef.connect(signer1).leaveStaking(amount);
        let result = await tx.wait();

        let blockNumber = ethers.utils.parseUnits(result.blockNumber.toString(), 0);
        statusToCheck = await updateNewStatus(signer1.address, amount, pool, user,
            blockNumber, masterChefStatus, statusToCheck);
        
        // kikiSeedToken地址的奖励kiki变化
        expect(await this.kikiToken.balanceOf(this.kikiSeedToken.address)).to.equal(statusToCheck.kikiSeedTokenBalanceInKiKi);
        // 用户地址的kiki变化
        expect(await this.kikiToken.balanceOf(signer1.address)).to.equal(statusToCheck.accountBalanceInKiKi);
        // kiki总代币量变化
        expect(await this.kikiToken.totalSupply()).to.equal(statusToCheck.totalSupplyInKiKi);
        // masterChef质押kiki量变化
        expect(await this.kikiToken.balanceOf(this.masterChef.address)).to.equal(statusToCheck.stakingInMasterChef);
        // kikiSeedToken用户质押账本余额变化
        expect(await this.kikiSeedToken.balanceOf(signer1.address)).to.equal(statusToCheck.stakingInKiKiSeedToken);
        // kikiSeedToken总质押数额变化
        expect(await this.kikiSeedToken.totalSupply()).to.equal(statusToCheck.totalSupplyInKiKiSeedToken);
    })

    it("account1 call leaveStaking, amount = 1 wei, check kikiSeedToken/masterChef/account1 balance in KiKiToken; \
check account1 balance in kikiSeedToken; \
check KiKiToken and kikiSeedToken total supply", async function () {
        const [, signer1] = await ethers.getSigners();
        let amount = ethers.utils.parseUnits("1", 0);
        let pool = await this.masterChef.poolInfo(0);
        let user = await this.masterChef.userInfo(0, signer1.address);
        let masterChefStatus = await recordMasterChefParams(this.masterChef);
        let statusToCheck = await recordOldStatusInContracts(signer1.address, this.kikiToken, this.kikiSeedToken, this.masterChef);

        let tx = await this.masterChef.connect(signer1).leaveStaking(amount);
        let result = await tx.wait();

        let blockNumber = ethers.utils.parseUnits(result.blockNumber.toString(), 0);
        statusToCheck = await updateNewStatus(signer1.address, amount, pool, user,
            blockNumber, masterChefStatus, statusToCheck);
        
        // kikiSeedToken地址的奖励kiki变化
        expect(await this.kikiToken.balanceOf(this.kikiSeedToken.address)).to.equal(statusToCheck.kikiSeedTokenBalanceInKiKi);
        // 用户地址的kiki变化
        expect(await this.kikiToken.balanceOf(signer1.address)).to.equal(statusToCheck.accountBalanceInKiKi);
        // kiki总代币量变化
        expect(await this.kikiToken.totalSupply()).to.equal(statusToCheck.totalSupplyInKiKi);
        // masterChef质押kiki量变化
        expect(await this.kikiToken.balanceOf(this.masterChef.address)).to.equal(statusToCheck.stakingInMasterChef);
        // kikiSeedToken用户质押账本余额变化
        expect(await this.kikiSeedToken.balanceOf(signer1.address)).to.equal(statusToCheck.stakingInKiKiSeedToken);
        // kikiSeedToken总质押数额变化
        expect(await this.kikiSeedToken.totalSupply()).to.equal(statusToCheck.totalSupplyInKiKiSeedToken);
    })

    it("account1 call leaveStaking twice, each amount = 10 KiKi, \
check kikiSeedToken/masterChef/account1 balance in KiKiToken; \
check account1 balance in kikiSeedToken; \
check KiKiToken and kikiSeedToken total supply", async function () {
        const [, signer1] = await ethers.getSigners();
        let amount = ethers.utils.parseUnits("10", 18);
        let count = 2;
        while(count > 0) {
            let pool = await this.masterChef.poolInfo(0);
            let user = await this.masterChef.userInfo(0, signer1.address);
            let masterChefStatus = await recordMasterChefParams(this.masterChef);
            let statusToCheck = await recordOldStatusInContracts(signer1.address, this.kikiToken, this.kikiSeedToken, this.masterChef);

            let tx = await this.masterChef.connect(signer1).leaveStaking(amount);
            let result = await tx.wait();
            
            let blockNumber = ethers.utils.parseUnits(result.blockNumber.toString(), 0);
            statusToCheck = await updateNewStatus(signer1.address, amount, pool, user,
                blockNumber, masterChefStatus, statusToCheck);
            
            // kikiSeedToken地址的奖励kiki变化
            expect(await this.kikiToken.balanceOf(this.kikiSeedToken.address)).to.equal(statusToCheck.kikiSeedTokenBalanceInKiKi);
            // 用户地址的kiki变化
            expect(await this.kikiToken.balanceOf(signer1.address)).to.equal(statusToCheck.accountBalanceInKiKi);
            // kiki总代币量变化
            expect(await this.kikiToken.totalSupply()).to.equal(statusToCheck.totalSupplyInKiKi);
            // masterChef质押kiki量变化
            expect(await this.kikiToken.balanceOf(this.masterChef.address)).to.equal(statusToCheck.stakingInMasterChef);
            // kikiSeedToken用户质押账本余额变化
            expect(await this.kikiSeedToken.balanceOf(signer1.address)).to.equal(statusToCheck.stakingInKiKiSeedToken);
            // kikiSeedToken总质押数额变化
            expect(await this.kikiSeedToken.totalSupply()).to.equal(statusToCheck.totalSupplyInKiKiSeedToken);
            --count;
        }
    })

    it("account2 call enterStaking, amount = 1000000.0 KiKi", async function () {
        const [, , signer2] = await ethers.getSigners();
        let amount = ethers.utils.parseUnits("1000000", 18);
        let oldStakingInMasterChef = await this.kikiToken.balanceOf(this.masterChef.address)

        let tx = await this.masterChef.connect(signer2).enterStaking(amount);
        await tx.wait();

        expect(await this.kikiToken.balanceOf(this.masterChef.address)).to.equal(oldStakingInMasterChef.add(amount));
        expect(await this.kikiSeedToken.balanceOf(signer2.address)).to.equal(amount);
    })

    it("account2 harvest, check kikiSeedToken/masterChef/account1 balance in KiKiToken; \
check account2 balance in kikiSeedToken; \
check KiKiToken and kikiSeedToken total supply", async function () {
        const [, , signer2] = await ethers.getSigners();
        let amount = ethers.utils.parseUnits('0', 18);
        let pool = await this.masterChef.poolInfo(0);
        let user = await this.masterChef.userInfo(0, signer2.address);
        let masterChefStatus = await recordMasterChefParams(this.masterChef);
        let statusToCheck = await recordOldStatusInContracts(signer2.address, this.kikiToken, this.kikiSeedToken, this.masterChef);

        let tx = await this.masterChef.connect(signer2).leaveStaking(amount);
        let result = await tx.wait();

        let blockNumber = ethers.utils.parseUnits(result.blockNumber.toString(), 0);
        statusToCheck = await updateNewStatus(signer2.address, amount, pool, user,
            blockNumber, masterChefStatus, statusToCheck);
        
        // kikiSeedToken地址的奖励kiki变化
        expect(await this.kikiToken.balanceOf(this.kikiSeedToken.address)).to.equal(statusToCheck.kikiSeedTokenBalanceInKiKi);
        // 用户地址的kiki变化
        expect(await this.kikiToken.balanceOf(signer2.address)).to.equal(statusToCheck.accountBalanceInKiKi);
        // kiki总代币量变化
        expect(await this.kikiToken.totalSupply()).to.equal(statusToCheck.totalSupplyInKiKi);
        // masterChef质押kiki量变化
        expect(await this.kikiToken.balanceOf(this.masterChef.address)).to.equal(statusToCheck.stakingInMasterChef);
        // kikiSeedToken用户质押账本余额变化
        expect(await this.kikiSeedToken.balanceOf(signer2.address)).to.equal(statusToCheck.stakingInKiKiSeedToken);
        // kikiSeedToken总质押数额变化
        expect(await this.kikiSeedToken.totalSupply()).to.equal(statusToCheck.totalSupplyInKiKiSeedToken);
    })

    it("account2 call leaveStaking, amount = 10.0 KiKi, check kikiSeedToken/masterChef/account2 balance in KiKiToken; \
check account1 balance in kikiSeedToken; \
check KiKiToken and kikiSeedToken total supply", async function () {
        const [, , signer2] = await ethers.getSigners();
        let amount = ethers.utils.parseUnits("10", 18);
        let pool = await this.masterChef.poolInfo(0);
        let user = await this.masterChef.userInfo(0, signer2.address);
        let masterChefStatus = await recordMasterChefParams(this.masterChef);
        let statusToCheck = await recordOldStatusInContracts(signer2.address, this.kikiToken, this.kikiSeedToken, this.masterChef);
        
        let tx = await this.masterChef.connect(signer2).leaveStaking(amount);
        let result = await tx.wait();
        
        let blockNumber = ethers.utils.parseUnits(result.blockNumber.toString(), 0);
        statusToCheck = await updateNewStatus(signer2.address, amount, pool, user,
            blockNumber, masterChefStatus, statusToCheck);
        
        // kikiSeedToken地址的奖励kiki变化
        expect(await this.kikiToken.balanceOf(this.kikiSeedToken.address)).to.equal(statusToCheck.kikiSeedTokenBalanceInKiKi);
        // 用户地址的kiki变化
        expect(await this.kikiToken.balanceOf(signer2.address)).to.equal(statusToCheck.accountBalanceInKiKi);
        // kiki总代币量变化
        expect(await this.kikiToken.totalSupply()).to.equal(statusToCheck.totalSupplyInKiKi);
        // masterChef质押kiki量变化
        expect(await this.kikiToken.balanceOf(this.masterChef.address)).to.equal(statusToCheck.stakingInMasterChef);
        // kikiSeedToken用户质押账本余额变化
        expect(await this.kikiSeedToken.balanceOf(signer2.address)).to.equal(statusToCheck.stakingInKiKiSeedToken);
        // kikiSeedToken总质押数额变化
        expect(await this.kikiSeedToken.totalSupply()).to.equal(statusToCheck.totalSupplyInKiKiSeedToken);
    })
})