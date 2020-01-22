const { getAccountAddress } = require('@blockrocket/utils');
const TestToken = artifacts.require("TestToken");
const TimeLockTokenEscrow = artifacts.require("TimeLockTokenEscrow");

const MNEMONIC = process.env.ESCROW_MNEMONIC || '';
const INFURA_KEY = process.env.ESCROW_INFURA_KEY || '';

module.exports = async function (deployer, network, accounts) {
    console.log("Deploying escrow contract to network: " + network);

    const creator = getAccountAddress(accounts, 0, network, MNEMONIC, INFURA_KEY);

    const token = await TestToken.deployed();
    console.log('token.address', token.address);

    await deployer.deploy(TimeLockTokenEscrow, token.address, {from: creator});
    const escrow = await TimeLockTokenEscrow.deployed();
    console.log('escrow.address', escrow.address);
};
