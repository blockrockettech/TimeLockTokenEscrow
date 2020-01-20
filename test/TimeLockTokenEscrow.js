const {BN, expectRevert, expectEvent, constants} = require('@openzeppelin/test-helpers');
const {ZERO_ADDRESS} = constants;
require('chai').should();

const TimeLockTokenEscrow = artifacts.require('TimeLockTokenEscrow');
const GenericERC20Token = artifacts.require('GenericERC20Token');

function now() { return Math.floor(Date.now() / 1000); }

contract('TimeLockTokenEscrow tests', function ([creator, beneficiary1, ...accounts]) {
   beforeEach(async function() {
      this.initialSupply = new BN('1000000').mul(new BN('10').pow(new BN('18')));
      this.token = await GenericERC20Token.new(creator, this.initialSupply, {from: creator});
      this.timeLockTokenEscrow = await TimeLockTokenEscrow.new(this.token.address, {from: creator});
   });

   describe('lock() - Locking up tokens', function() {
      const amountToLockUp = new BN('5000');

      describe('happy path', function() {
         it('Locks up a specified amount of tokens', async function() {
            // Approve the contract first and check its allowance after
            await this.token.approve(this.timeLockTokenEscrow.address, amountToLockUp, {from: creator});

            (await this.timeLockTokenEscrow.approvalAmount(creator)).should.be.bignumber.equal(amountToLockUp);

            // Lock up the tokens
            const oneHourFromNow = new BN((now() + (60*60)).toString());
            const {logs} = await this.timeLockTokenEscrow.lock(beneficiary1, amountToLockUp, oneHourFromNow, {from: creator});
            await expectEvent.inLogs(logs, 'Lockup', {
               _beneficiary: beneficiary1,
               _amount: amountToLockUp,
               _lockedUntil: oneHourFromNow
            });
         });
      });

      describe('requires', function() {
         it('Fails to lockup tokens for address zero', async function() {
            await expectRevert(
                this.timeLockTokenEscrow.lock(ZERO_ADDRESS, amountToLockUp, '0', {from: creator}),
                "You cannot lock up tokens for the zero address"
            );
         });

         it('Fails when amount is zero', async function() {
            await expectRevert(
                this.timeLockTokenEscrow.lock(beneficiary1, '0', '0', {from: creator}),
                "Lock up amount of zero tokens is invalid"
            );
         });

         it('Fails when tokens have already been locked up for a beneficiary', async function() {
            await this.token.approve(this.timeLockTokenEscrow.address, amountToLockUp, {from: creator});

            (await this.timeLockTokenEscrow.approvalAmount(creator)).should.be.bignumber.equal(amountToLockUp);

            // Lock up the tokens
            const oneHourFromNow = new BN((now() + (60*60)).toString());
            await this.timeLockTokenEscrow.lock(beneficiary1, amountToLockUp, oneHourFromNow, {from: creator});

            // Try to lock up again
            await expectRevert(
              this.timeLockTokenEscrow.lock(beneficiary1, amountToLockUp, '0', {from: creator}),
                "Tokens have already been locked up for the given address"
            );
         });

         it('Fails when the contract is not approved to escrow tokens', async function() {
            await expectRevert(
                this.timeLockTokenEscrow.lock(beneficiary1, amountToLockUp, '0', {from: creator}),
                "The contract does not have enough of an allowance to escrow"
            );
         });
      });
   });
});