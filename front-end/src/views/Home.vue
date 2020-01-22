<template>
    <div class="container mt-4">
        <div class="row mt-2">
            <div class="col">
                <h3>Lockup</h3>
                <div>
                    <label class="fixed-width-label text-right" for="inputBeneficiary">Beneficiary:</label>
                    <input type="text"
                           id="inputBeneficiary"
                           class="ml-2 form-control fixed-width-input d-inline-block"
                           placeholder="0x123..."
                           v-model="form.beneficiary"/>
                </div>
                <div class="mt-1">
                    <label class="fixed-width-label text-right" for="inputAmount">Amount: </label>
                    <input type="text"
                           id="inputAmount"
                           class="ml-2 form-control fixed-width-input d-inline-block"
                           placeholder="500"
                           v-model="form.amount"/>
                </div>
                <div class="mt-1">
                    <label class="fixed-width-label text-right" for="inputLockedUntil">Locked Until: </label>
                    <input type="text"
                           id="inputLockedUntil"
                           class="ml-2 form-control fixed-width-input d-inline-block"
                           placeholder="10/05/2020"
                           v-model="form.lockedUntil"/>
                </div>
                <b-button variant="primary" class="mt-2" @click="lockupTokens">
                    <span v-if="!lockingUp">Lockup</span>
                    <SmallSpinner v-else />
                </b-button>
            </div>
            <div class="col">
                <h3>Withdrawal</h3>
                <div>
                    <label class="fixed-width-label text-right" for="inputBeneficiaryWithdrawal">Beneficiary:</label>
                    <input type="text"
                           id="inputBeneficiaryWithdrawal"
                           class="ml-2 form-control fixed-width-input d-inline-block"
                           placeholder="0x123..."
                           v-model="form.beneficiaryWithdrawal"/>
                </div>
                <b-button variant="primary" class="mt-2" @click="withdrawal">
                    <span v-if="!withdrawing">Withdraw</span>
                    <SmallSpinner v-else />
                </b-button>
            </div>
        </div>
        <div class="row mt-5">
            <div class="col">
                <h2>Lock up Information</h2>
                <div>
                    <label class="fixed-width-label text-right" for="inputBeneficiaryLockup">Beneficiary:</label>
                    <input type="text"
                           id="inputBeneficiaryLockup"
                           class="ml-2 form-control fixed-width-input d-inline-block"
                           placeholder="0x123..."
                           v-model="form.beneficiaryLockup"/>
                </div>
                <b-button variant="primary" class="mt-2" @click="search">
                    Search
                </b-button>
            </div>
            <div class="col">
                <div v-if="lockUp.amount">
                    <div>
                        <strong>Beneficiary</strong>: {{this.lockUp.beneficiary}}
                    </div>
                    <div>
                        <strong>Amount</strong>: {{this.lockUp.amount}} XTP
                    </div>
                    <div>
                        <strong>Locked Until</strong>: {{this.lockUp.lockedUntil}}
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import {ethers} from 'ethers';
    import utils from '../utils';
    import TimeLockTokenEscrow from '../truffleconf/TimeLockTokenEscrow';
    import TestToken from '../truffleconf/TestToken';

    import SmallSpinner from "../components/SmallSpinner";

    export default {
        name: 'home',
        components: {SmallSpinner},
        async created() {
            await window.ethereum.enable();
            this.web3.provider = new ethers.providers.Web3Provider(web3.currentProvider);
            this.web3.signer = this.web3.provider.getSigner();
            this.web3.chain = await this.web3.provider.getNetwork();

            const escrowContractAddress = utils.getContractAddressFromTruffleConf(TimeLockTokenEscrow, this.web3.chain.chainId);
            this.web3.escrowContract = new ethers.Contract(
                escrowContractAddress,
                TimeLockTokenEscrow.abi,
                this.web3.signer,
            );

            const tokenAddress = utils.getContractAddressFromTruffleConf(TestToken, this.web3.chain.chainId);
            this.web3.genericERC20TokenContract = new ethers.Contract(
                tokenAddress,
                TestToken.abi,
                this.web3.signer
            );
        },
        data() {
            return {
                form: {
                    beneficiary: '',
                    beneficiaryWithdrawal: '',
                    beneficiaryLockup: '',
                    amount: '',
                    lockedUntil: '',
                },
                lockUp: {
                    beneficiary: '',
                    amount: '',
                    lockedUntil: '',
                },
                web3: {
                    provider: null,
                    signer: null,
                    chain: null,
                    escrowContract: null,
                    genericERC20TokenContract: null
                },
                lockingUp: false,
                withdrawing: false
            }
        },
        methods: {
            async lockupTokens() {
                this.lockingUp = true;

                const escrowContractAddress = utils.getContractAddressFromTruffleConf(TimeLockTokenEscrow, this.web3.chain.chainId);

                // Approve
                const approveTx = await this.web3.genericERC20TokenContract.approve(escrowContractAddress, this.form.amount);

                // Lockup
                const lockupTx = await this.web3.escrowContract.lock(
                    this.form.beneficiary,
                    ethers.utils.parseUnits(this.form.amount, '18'),
                    this.form.lockedUntil,
                    {
                        gasLimit: 250000
                    }
                );

                // Wait for 1 confirmation for both transactions
                await approveTx.wait(1);
                await lockupTx.wait(1);

                this.lockingUp = false;
            },
            async withdrawal() {
                this.withdrawing = true;

                const withdrawalTx = await this.web3.escrowContract.withdrawal(this.form.beneficiaryWithdrawal);
                await withdrawalTx.wait(1);

                this.withdrawing = false;
            },
            async search() {
                const {amount, lockedUntil} = await this.web3.escrowContract.beneficiaryToTimeLock(this.form.beneficiaryLockup);
                this.lockUp.amount = ethers.utils.formatUnits(amount, '18');
                this.lockUp.lockedUntil = this.$moment.unix(lockedUntil.toString());
                this.lockUp.beneficiary = this.form.beneficiaryLockup;
            }
        }
    }
</script>

<style scoped>
    .fixed-width-label {
        width: 100px;
    }

    .fixed-width-input {
        width: 375px;
    }
</style>
