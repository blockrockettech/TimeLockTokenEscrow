<template>
    <div class="container mt-4">
        <h1>Time Lock Token Escrow (XTP)</h1>
        <div>
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
        <div class="mt-5">
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
</template>

<script>
    import {ethers} from 'ethers';
    import utils from '../utils';
    import TimeLockTokenEscrow from '../truffleconf/TimeLockTokenEscrow';
    import GenericERC20Token from '../truffleconf/GenericERC20Token';

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

            const tokenAddress = utils.getContractAddressFromTruffleConf(GenericERC20Token, this.web3.chain.chainId);
            this.web3.genericERC20TokenContract = new ethers.Contract(
                tokenAddress,
                GenericERC20Token.abi,
                this.web3.signer
            );
        },
        data() {
            return {
                form: {
                    beneficiary: '',
                    beneficiaryWithdrawal: '',
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

                const withdrawlTx = await this.web3.escrowContract.withdrawal(beneficiaryWithdrawal);
                await withdrawlTx.wait(1);

                this.withdrawing = false;
            }
        }
    }
</script>

<style scoped>
    .fixed-width-label {
        width: 100px;
    }

    .fixed-width-input {
        width: 250px;
    }
</style>
