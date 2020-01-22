const { getAccountAddress } = require('@blockrocket/utils');
const GenericERC20Token = artifacts.require("GenericERC20Token");
const TimeLockTokenEscrow = artifacts.require("TimeLockTokenEscrow");

const MNEMONIC = process.env.ESCROW_MNEMONIC || '';
const INFURA_KEY = process.env.ESCROW_INFURA_KEY || '';

// TODO: Remove temp token deploy in the future
module.exports = async function (deployer, network, accounts) {
    console.log("Deploying escrow contract with dummy token to network: " + network);

    const creator = getAccountAddress(accounts, 0, network, MNEMONIC, INFURA_KEY);

    await deployer.deploy(GenericERC20Token, creator, '100000000000000000000000000', {from: creator});
    const token = await GenericERC20Token.deployed();
    console.log('token.address', token.address);

    await deployer.deploy(TimeLockTokenEscrow, token.address, {from: creator});
    const escrow = await TimeLockTokenEscrow.deployed();
    console.log('escrow.address', escrow.address);
};