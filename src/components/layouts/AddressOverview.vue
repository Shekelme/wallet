<template>
    <div class="address-overview"
        :class="{ 'no-accounts flex-column': activeCurrency === CryptoCurrency.NIM && !activeAddressInfo }">
        <HeroIcon class="svg-id-fix" />
        <template
            v-if="activeAddressInfo || activeCurrency === CryptoCurrency.BTC || activeCurrency === CryptoCurrency.USDC"
        >
            <div class="actions-mobile flex-row">
                <button class="reset icon-button" @click="$router.back()"><ArrowLeftIcon/></button>
                <div class="flex-row justify-between w-full">
                    <SearchBar v-model="searchString"/>

                    <CashlinkButton
                        v-if="activeCurrency === 'nim' && unclaimedCashlinkCount"
                        :showUnclaimedCashlinkList="showUnclaimedCashlinkList"
                        :unclaimedCashlinkCount="unclaimedCashlinkCount"
                        @toggle-unclaimed-cashlink-list="toggleUnclaimedCashlinkList"
                    />

                    <PrestakingButton />
                </div>
                <button
                    class="reset icon-button"
                    @click="$event.currentTarget.focus() /* Required for MacOS Safari & Firefox */"
                >
                    <MenuDotsIcon/>
                    <div class="popup-menu nq-blue-bg">
                        <button v-if="activeCurrency === 'nim'"
                            class="reset flex-row"
                            @mousedown="rename(activeAccountId, activeAddressInfo.address)"
                        >
                            <RenameIcon/>{{ $t('Rename') }}
                        </button>
                        <button v-if="activeCurrency === 'btc'"
                            class="reset flex-row"
                            @mousedown="rescan"
                        >
                            <RefreshIcon/>{{ $t('Rescan') }}
                        </button>
                        <button
                            class="reset flex-row"
                            @mousedown="$router.push('/export-history/address')"
                        >
                            <BoxedArrowUpIcon />{{ $t('Export History') }}
                        </button>
                    </div>
                </button>
            </div>
            <div class="active-address flex-row">
                <div class="identicon-wrapper">
                    <Identicon v-if="activeCurrency === 'nim'" :address="activeAddressInfo.address" />
                    <BitcoinIcon v-if="activeCurrency === 'btc'"/>
                    <UsdcIcon v-if="activeCurrency === 'usdc'"/>
                    <button class="reset identicon-menu flex-row"
                        @click="$event.currentTarget.focus() /* Required for MacOS Safari & Firefox */"
                    >
                        <GearIcon/>
                        <div class="popup-menu nq-blue-bg">
                            <button v-if="activeCurrency === 'nim'"
                                class="reset flex-row"
                                @mousedown="rename(activeAccountId, activeAddressInfo.address)"
                            >
                                <RenameIcon/>{{ $t('Rename') }}
                            </button>
                            <button v-if="activeCurrency === 'btc'"
                                class="reset flex-row"
                                @mousedown="rescan"
                            >
                                <RefreshIcon/>{{ $t('Rescan') }}
                            </button>
                            <button
                                class="reset flex-row"
                                @mousedown="$router.push('/export-history/address')"
                            >
                                <BoxedArrowUpIcon />{{ $t('Export History') }}
                            </button>
                        </div>
                    </button>
                </div>
                <div class="meta">
                    <div class="flex-row">
                        <div v-if="activeCurrency === 'nim'" class="label">{{activeAddressInfo.label}}</div>
                        <div v-if="activeCurrency === 'btc'" class="label bitcoin">{{ $t('Bitcoin') }}</div>
                        <div v-if="activeCurrency === 'usdc'" class="label usdc">{{ $t('USD Coin') }}</div>
                        <Amount v-if="activeCurrency === 'nim'" :amount="activeAddressInfo.balance" value-mask/>
                        <Amount v-if="activeCurrency === 'btc'" :amount="btcAccountBalance" currency="btc" value-mask/>
                        <Amount v-if="activeCurrency === 'usdc'"
                            :amount="usdcAccountBalance + nativeUsdcAccountBalance" currency="usdc" value-mask/>
                    </div>
                    <div class="flex-row">
                        <!-- We need to key the Copyable component, so that the tooltip disappears when
                             switching addresses while the tooltip is showing -->
                        <Copyable v-if="activeCurrency === 'nim'"
                            :text="activeAddressInfo.address" :key="activeAddressInfo.address"
                        >
                            <div class="address" ref="address$" :class="{ 'masked': addressMasked  }">
                                {{activeAddressInfo.address}}
                            </div>
                        </Copyable>
                        <!--
                        Don't show Polygon address. User can see the polygon address in the send/receive flows, so
                        we can show also the warnings.
                        <Copyable v-if="activeCurrency === 'usdc'"
                            :text="usdcAddressInfo.address" :key="usdcAddressInfo.address"
                        >
                            <div class="address" ref="address$" :class="{ 'masked': addressMasked  }">
                                {{usdcAddressInfo.address}}
                            </div>
                        </Copyable>
                        -->

                        <FiatConvertedAmount v-if="activeCurrency === 'nim' && activeAddressInfo.balance !== null"
                            :amount="activeAddressInfo.balance" currency="nim" value-mask/>
                        <span v-else-if="activeCurrency === 'nim'" class="fiat-amount"></span>

                        <FiatConvertedAmount v-if="activeCurrency === 'btc'"
                            :amount="btcAccountBalance" currency="btc" value-mask/>

                        <FiatConvertedAmount v-if="activeCurrency === 'usdc'"
                            :amount="usdcAccountBalance + nativeUsdcAccountBalance  " currency="usdc" value-mask/>
                    </div>
                </div>
            </div>
            <div class="actions flex-row">
                <SearchBar v-model="searchString"/>

                <div class="flex-row ml-auto">
                    <CashlinkButton
                        v-if="activeCurrency === 'nim' && unclaimedCashlinkCount"
                        :showUnclaimedCashlinkList="showUnclaimedCashlinkList"
                        :unclaimedCashlinkCount="unclaimedCashlinkCount"
                        @toggle-unclaimed-cashlink-list="toggleUnclaimedCashlinkList"
                    />

                    <template v-if="activeCurrency === 'nim'"> <!-- TODO: show preview if prestaking-->
                        <!-- <PrestakingPreview v-if="prestake" /> -->
                        <!-- <PrestakingButton v-else /> -->
                        <PrestakingButton />
                    </template>

                    <button class="send nq-button-pill light-blue flex-row"
                        @click="$router.push(`/send/${activeCurrency}`)" @mousedown.prevent
                        :disabled="(activeCurrency === 'nim' && (!activeAddressInfo || !activeAddressInfo.balance))
                            || (activeCurrency === 'btc' && !btcAccountBalance)
                            || (activeCurrency === 'usdc' && !nativeUsdcAccountBalance /* can only send native usdc */)"
                    >
                        <ArrowRightSmallIcon />{{ $t('Send') }}
                    </button>
                    <button class="receive nq-button-s flex-row"
                        @click="$router.push(`/receive/${activeCurrency}`)" @mousedown.prevent
                    >
                        <ArrowRightSmallIcon />{{ $t('Receive') }}
                    </button>
                </div>
            </div>
            <!-- <PrestakingPreview v-if="prestake" class="prestaking-preview-mobile" /> -->
            <div
                v-if="activeCurrency === 'usdc' && usdcAccountBalance >= 0.1e6"
                class="bridged-usdc-notice"
            >
                <div class="flex-row">
                    <UsdcIcon />
                    {{ $t('Legacy USDC (USDC.e)') }}
                    <div class="flex-grow"></div>
                    <Amount :amount="usdcAccountBalance" currency="usdc.e" value-mask/>
                </div>
                <div class="flex-row">
                    <span class="description">
                        <InfoCircleSmallIcon />
                        {{ $t('Convert your USDC.e to the new standard.') }}
                        <!-- eslint-disable-next-line max-len -->
                        <a href="https://www.circle.com/blog/what-you-need-to-know-native-usdc-on-polygon-pos"
                            target="_blank" rel="noopener" class="nq-link">{{ $t('Learn more') }}</a>
                    </span>
                    <button
                        @click="convertBridgedUsdcToNative"
                        class="nq-button-pill light-blue"
                    >{{ $t('Convert to USDC') }}</button>
                </div>
            </div>
            <div class="scroll-mask top"></div>
            <TransactionList
                v-if="activeCurrency === CryptoCurrency.NIM"
                :searchString="searchString"
                :showUnclaimedCashlinkList="showUnclaimedCashlinkList"
                @unclaimed-cashlink-count="setUnclaimedCashlinkCount"
                @close-unclaimed-cashlink-list="hideUnclaimedCashlinkList"
                @scroll="onTransactionListScroll"
            />
            <BtcTransactionList
                v-if="activeCurrency === CryptoCurrency.BTC"
                :searchString="searchString"
            />
            <UsdcTransactionList
                v-if="activeCurrency === CryptoCurrency.USDC"
                :searchString="searchString"
            />
        </template>
        <template v-else>
            <span class="opacity-75">{{ $t('Let\'s get started! Create your Nimiq account:') }}</span>
            <button class="nq-button" @click="onboard(false)" @mousedown.prevent>{{ $t('Signup') }}</button>
        </template>

        <transition name="fadeY">
            <div class="promo-box flex-column" v-if="promoBoxVisible && !showUnclaimedCashlinkList && !searchString">
                <div class="flex-row">
                    <h2 class="nq-h2">
                        <!-- <CrossCloseButton @click="setPromoBoxVisible(false)"/> -->
                        {{ $t('Your swap was successful!') }}
                    </h2>
                    <HighFiveIcon />
                </div>
                <p>{{ $t('All swaps are part of your transaction history and feature a small swap icon.') }}</p>
                <a class="nq-button-s inverse light-blue flex-row" @click="setPromoBoxVisible(false)">
                    {{ $t('Close') }}
                </a>
            </div>
        </transition>

        <MobileActionBar/>

        <Portal>
            <transition name="modal">
                <router-view name="modal"/>
            </transition>
        </Portal>

        <Portal>
            <transition name="modal">
                <keep-alive>
                    <router-view name="persistent-modal"/>
                </keep-alive>
            </transition>
        </Portal>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from '@vue/composition-api';
import {
    Identicon,
    GearIcon,
    Copyable,
    ArrowRightSmallIcon,
    ArrowLeftIcon,
    MenuDotsIcon,
    InfoCircleSmallIcon,
} from '@nimiq/vue-components';
// @ts-expect-error missing types for this package
import { Portal } from '@linusborg/vue-simple-portal';
import { BigNumber } from 'ethers';
import { SignPolygonTransactionRequest } from '@nimiq/hub-api';
import { RelayRequest } from '@opengsn/common/dist/EIP712/RelayRequest';
import { ForwardRequest } from '@opengsn/common/dist/EIP712/ForwardRequest';

import BitcoinIcon from '../icons/BitcoinIcon.vue';
import UsdcIcon from '../icons/UsdcIcon.vue';
import Amount from '../Amount.vue';
import FiatConvertedAmount from '../FiatConvertedAmount.vue';
import SearchBar from '../SearchBar.vue';
import TransactionList from '../TransactionList.vue';
import BtcTransactionList from '../BtcTransactionList.vue';
import UsdcTransactionList from '../UsdcTransactionList.vue';
import MobileActionBar from '../MobileActionBar.vue';
import RenameIcon from '../icons/AccountMenu/RenameIcon.vue';
import RefreshIcon from '../icons/RefreshIcon.vue';
import CashlinkButton from '../CashlinkButton.vue';
import PrestakingButton from '../prestaking/PrestakingButton.vue';

import { useAccountStore } from '../../stores/Account';
import { useAddressStore } from '../../stores/Address';
import { useBtcAddressStore } from '../../stores/BtcAddress';
import { useUsdcAddressStore } from '../../stores/UsdcAddress';
import { onboard, rename, swapBridgedUsdcToNative } from '../../hub';
import { useElementResize } from '../../composables/useElementResize';
import { useWindowSize } from '../../composables/useWindowSize';
import { BTC_ADDRESS_GAP, CryptoCurrency, ENV_MAIN } from '../../lib/Constants';
import { checkHistory } from '../../electrum';
import HighFiveIcon from '../icons/HighFiveIcon.vue';
import { useSwapsStore } from '../../stores/Swaps';
import BoxedArrowUpIcon from '../icons/BoxedArrowUpIcon.vue';
import { useConfig } from '../../composables/useConfig';
import {
    calculateFee,
    getPolygonBlockNumber,
    getPolygonClient,
    getSwapContract,
    sendTransaction as sendPolygonTransaction,
} from '../../ethers';
import { POLYGON_BLOCKS_PER_MINUTE } from '../../lib/usdc/OpenGSN';
import { i18n } from '../../i18n/i18n-setup';
import { useUsdcTransactionsStore } from '../../stores/UsdcTransactions';
import HeroIcon from '../icons/Prestaking/HeroIcon.vue';

export default defineComponent({
    name: 'address-overview',
    setup() {
        const { activeAccountId, activeCurrency } = useAccountStore();
        const { activeAddressInfo, activeAddress } = useAddressStore();
        const { accountBalance: btcAccountBalance } = useBtcAddressStore();
        const {
            accountBalance: usdcAccountBalance,
            nativeAccountBalance: nativeUsdcAccountBalance,
            addressInfo: usdcAddressInfo,
        } = useUsdcAddressStore();
        const { promoBoxVisible, setPromoBoxVisible } = useSwapsStore();

        const searchString = ref('');

        const unclaimedCashlinkCount = ref(0);
        const showUnclaimedCashlinkList = ref(false);

        const address$ = ref<HTMLDivElement>(null);
        const addressMasked = ref<boolean>(false);

        const { isMobile, isFullDesktop } = useWindowSize();

        useElementResize(address$, () => {
            let addressWidth: number;
            if (isMobile.value) {
                addressWidth = 322;
            } else if (isFullDesktop.value) {
                addressWidth = 396;
            } else {
                addressWidth = 372; // Tablet
            }
            addressMasked.value = address$.value!.clientWidth < addressWidth;
        });

        function hideUnclaimedCashlinkList() {
            showUnclaimedCashlinkList.value = false;
        }

        function setUnclaimedCashlinkCount(count: number) {
            unclaimedCashlinkCount.value = count;
            if (!count) hideUnclaimedCashlinkList();
        }

        function clearSearchString() {
            searchString.value = '';
        }

        watch(activeAddress, (address, oldAddress) => {
            hideUnclaimedCashlinkList();
            clearSearchString();

            if (address !== oldAddress && promoBoxVisible) {
                setPromoBoxVisible(false);
            }
        });

        watch(activeCurrency, (currency, oldCurrency) => {
            if (currency !== oldCurrency && promoBoxVisible) {
                setPromoBoxVisible(false);
            }
        });

        function rescan() {
            const { addressSet } = useBtcAddressStore();
            checkHistory(
                addressSet.value.external,
                [],
                0,
                BTC_ADDRESS_GAP,
                console.error, // eslint-disable-line no-console
                true,
            );
            checkHistory(
                addressSet.value.internal,
                [],
                0,
                5,
                console.error, // eslint-disable-line no-console
                true,
            );
        }

        function onTransactionListScroll() {
            if (!promoBoxVisible.value) return;
            setPromoBoxVisible(false);
        }

        function toggleUnclaimedCashlinkList() {
            showUnclaimedCashlinkList.value = !showUnclaimedCashlinkList.value;
        }

        const { config } = useConfig();

        async function convertBridgedUsdcToNative() {
            let relayUrl: string;

            // eslint-disable-next-line no-async-promise-executor
            const request = new Promise<Omit<SignPolygonTransactionRequest, 'appName'>>(async (resolve, reject) => {
                try {
                    const [client, swapContract] = await Promise.all([
                        getPolygonClient(),
                        getSwapContract(),
                    ]);
                    const fromAddress = usdcAddressInfo.value!.address;

                    const [
                        usdcNonce,
                        forwarderNonce,
                        blockHeight,
                    ] = await Promise.all([
                        client.usdc.nonces(fromAddress) as Promise<BigNumber>,
                        swapContract.getNonce(fromAddress) as Promise<BigNumber>,
                        getPolygonBlockNumber(),
                    ]);

                    // eslint-disable-next-line @typescript-eslint/prefer-as-const
                    const method:/* 'swap' | */'swapWithApproval' = 'swapWithApproval';

                    const {
                        fee,
                        gasLimit,
                        gasPrice,
                        relay,
                    } = await calculateFee(config.usdc.usdcContract, method, undefined, swapContract);
                    relayUrl = relay.url;

                    if (fee.toNumber() >= usdcAddressInfo.value!.balance!) {
                        reject(new Error(i18n.t(
                            'You do not have enough USDC.e to pay conversion fees ({fee})',
                            { fee: `${fee.toNumber() / 1e6} USDC.e` },
                        ) as string));
                        return;
                    }

                    // Limit swap amount to 100k USDC.e, to not unbalance the pool too much
                    const amount = Math.min(100_000e6, usdcAddressInfo.value!.balance! - fee.toNumber());

                    // Only allow 0.5% slippage on mainnet, but up to 5% on testnet
                    const minTargetAmountPercentage = config.environment === ENV_MAIN ? 0.995 : 0.95;

                    const data = swapContract.interface.encodeFunctionData(method, [
                        /* address token */ config.usdc.usdcContract,
                        /* uint256 amount */ amount,
                        /* address pool */ config.usdc.swapPoolContract,
                        /* uint256 targetAmount */ Math.floor(amount * minTargetAmountPercentage),
                        /* uint256 fee */ fee,
                        ...(method === 'swapWithApproval' ? [
                            // // Approve the maximum possible amount so afterwards we can use the `swap` method for
                            // // lower fees
                            // /* uint256 approval */ client.ethers
                            //    .BigNumber.from('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'),
                            /* uint256 approval */ amount + fee.toNumber(),

                            /* bytes32 sigR */ '0x0000000000000000000000000000000000000000000000000000000000000000',
                            /* bytes32 sigS */ '0x0000000000000000000000000000000000000000000000000000000000000000',
                            /* uint8 sigV */ 0,
                        ] : []),
                    ]);

                    const relayRequest: RelayRequest = {
                        request: {
                            from: fromAddress,
                            to: config.usdc.swapContract,
                            data,
                            value: '0',
                            nonce: forwarderNonce.toString(),
                            gas: gasLimit.toString(),
                            validUntil: (blockHeight + 3000 + 3 * 60 * POLYGON_BLOCKS_PER_MINUTE)
                                .toString(10), // 3 hours + 3000 blocks (minimum relay expectancy)
                        },
                        relayData: {
                            gasPrice: gasPrice.toString(),
                            pctRelayFee: relay.pctRelayFee.toString(),
                            baseRelayFee: relay.baseRelayFee.toString(),
                            relayWorker: relay.relayWorkerAddress,
                            paymaster: config.usdc.swapContract,
                            paymasterData: '0x',
                            clientId: Math.floor(Math.random() * 1e6).toString(10),
                            forwarder: config.usdc.swapContract,
                        },
                    };

                    resolve({
                        ...relayRequest,
                        ...(method === 'swapWithApproval' ? {
                            approval: {
                                tokenNonce: usdcNonce.toNumber(),
                            },
                        } : null),
                    });
                } catch (e) {
                    reject(e);
                }
            }).catch((error) => {
                // Trigger alert only after popup closed, as otherwise the popup is visually blocking the alert
                // and the UI seems frozen
                window.setTimeout(() => {
                    alert(error.message); // eslint-disable-line no-alert
                }, 200);
                throw error;
            });

            const signedTransaction = await swapBridgedUsdcToNative(request).catch((error) => {
                // Trigger alert only after popup closed, as otherwise the popup is visually blocking the alert
                // and the UI seems frozen
                window.setTimeout(() => {
                    alert(error.message); // eslint-disable-line no-alert
                }, 200);
                throw error;
            });
            if (!signedTransaction) return false;

            const { relayData, ...relayRequest } = signedTransaction.message;
            const tx = await sendPolygonTransaction(
                { request: relayRequest as ForwardRequest, relayData },
                signedTransaction.signature,
                relayUrl!,
            ).catch((error) => {
                alert(error.message); // eslint-disable-line no-alert
            });

            if (tx) {
                useUsdcTransactionsStore().addTransactions([tx]);
            }

            return tx;
        }

        return {
            activeCurrency,
            searchString,
            activeAccountId,
            activeAddressInfo,
            onboard,
            rename,
            rescan,
            unclaimedCashlinkCount,
            setUnclaimedCashlinkCount,
            showUnclaimedCashlinkList,
            hideUnclaimedCashlinkList,
            btcAccountBalance,
            usdcAccountBalance,
            nativeUsdcAccountBalance,
            usdcAddressInfo,
            CryptoCurrency,
            promoBoxVisible,
            setPromoBoxVisible,
            onTransactionListScroll,
            address$,
            addressMasked,
            toggleUnclaimedCashlinkList,
            config,
            convertBridgedUsdcToNative,
        };
    },
    components: {
        ArrowRightSmallIcon,
        InfoCircleSmallIcon,
        Identicon,
        BitcoinIcon,
        GearIcon,
        RenameIcon,
        RefreshIcon,
        Copyable,
        Amount,
        FiatConvertedAmount,
        SearchBar,
        TransactionList,
        BtcTransactionList,
        UsdcTransactionList,
        ArrowLeftIcon,
        MenuDotsIcon,
        MobileActionBar,
        Portal,
        HighFiveIcon,
        BoxedArrowUpIcon,
        UsdcIcon,
        CashlinkButton,
        PrestakingButton,
        HeroIcon,
    },
});
</script>

<style lang="scss" scoped>
@import '../../scss/mixins.scss';

.address-overview > svg:first-child {
    width: 0px;
    height: 0px;
    position: absolute;
    top: -9999px;
}

// TODO: Extract into SCSS mixin or global style
.scroll-mask {
    // position: sticky;
    height: 3rem;
    flex-shrink: 0;
    z-index: 2;
    pointer-events: none;
    margin-right: 2rem;

    &.top {
        // top: 0;
        background: linear-gradient(var(--bg-primary), rgba(255, 255, 255, 0));
        margin-bottom: -3rem;
    }
}

.address-overview {
    @include flex-full-height;
    background: var(--bg-primary);
    flex-direction: column;
    box-shadow: -0.75rem 0 12rem rgba(0, 0, 0, 0.05);
    position: relative;

    /* Default: 1440px */
    --padding: 4rem;
    --padding-bottom: 6rem;

    @media (max-width: 1319px) {
        --padding: 3rem;
        --padding-bottom: 5rem;
    }

    @media (max-width: 700px) { // Full mobile breakpoint
        --padding: 1rem;
        --padding-bottom: 2rem;
    }

    @media (min-width: 1800px) {
        --padding: 7rem;
        --padding-bottom: 6rem;
    }

    @media (min-width: 2000px) {
        --padding: 9rem;
        --padding-bottom: 6rem;
    }

    &.no-accounts {
        padding: 6rem 0;
        justify-content: center;
        text-align: center;

        img {
            width: 50%;
            margin: 0 auto 4rem;
        }
    }
}

.active-address {
    flex-shrink: 0;
    align-items: center;
    padding: calc(var(--padding) + 2rem);
    padding-right: calc(var(--padding) + 4rem);
    padding-bottom: var(--padding-bottom);

    .identicon-wrapper {
        position: relative;
        margin-right: 4rem;

        .identicon-menu {
            position: absolute;
            right: 0.25rem;
            bottom: -1.25rem;
            width: 4rem;
            height: 4rem;
            justify-content: center;
            align-items: center;
            border-radius: 50%;
            background: var(--bg-primary);
            box-shadow:
                0px 0.337011px 2px rgba(31, 35, 72, 0.08),
                0px 1.5px 3px rgba(31, 35, 72, 0.08),
                0px 4px 16px rgba(31, 35, 72, 0.11);

            opacity: 0;
            transition: opacity 0.3s var(--nimiq-ease);

            .nq-icon {
                opacity: 0.5;
                transition: opacity 0.3s var(--nimiq-ease);
            }
        }

        > svg {
            width: 10.5rem;
            height: 10.5rem;
            margin: -0.25rem 0.375rem;
            display: block;

            &.bitcoin {
                color: var(--bitcoin-orange);
            }

            &.usdc {
                color: var(--usdc-blue);
            }
        }
    }

    .identicon {
        height: 11.25rem;
        width: 11.25rem;
        margin: -0.625rem 0; // Negative margin above and below to size identicon to be 90x80 px
        flex-shrink: 0;
    }

    .meta {
        flex-grow: 1;
        min-width: 0;

        .flex-row {
            align-items: center;
        }
    }

    .address,
    .label {
        flex-grow: 1;
        overflow: hidden;
        white-space: nowrap;
    }

    .label,
    .amount {
        --size: var(--h1-size);
        font-size: var(--size);
        margin-top: 0.25rem;
    }

    .address,
    .fiat-amount {
        --size: var(--body-size);
        font-size: var(--size);
        opacity: 0.5;
    }

    .label {
        font-weight: 600;
        margin-bottom: 0.75rem;
        margin-right: 3rem;
        mask: linear-gradient(90deg , white, white calc(100% - 3rem), rgba(255,255,255, 0));

        &.bitcoin, &.usdc {
            position: relative;
            top: 1.25rem;
        }
    }

    .address {
        word-spacing: -0.2em;
        font-family: "Fira Mono", monospace; // TODO: Improve monospace font stack
        transition: opacity .3s var(--nimiq-ease);

        &.masked {
            mask: linear-gradient(90deg , white, white calc(100% - 3rem), rgba(255,255,255, 0));
        }

        &::after {
            /* Preload the 500 weight by using it, hidden */
            content: "preload";
            font-weight: 500;
            position: absolute;
            left: -9999px;
            top: -9999px;
            opacity: 0;
            pointer-events: none;
        }
    }

    .copyable {
        padding: 0.5rem 1rem;
        margin-left: -1rem;
        min-width: 0;
        margin-right: 3rem;

        &:hover .address,
        &:focus .address,
        &.copied .address {
            opacity: 1;
            font-weight: 500;
        }
    }

    .fiat-amount {
        margin-left: auto;
    }

    .amount,
    .fiat-amount {
        flex-shrink: 0;
    }

    .amount {
        font-weight: bold;
        margin-bottom: 0.5rem;
    }

    .fiat-amount {
        font-weight: 600;
        line-height: 1;
    }

    &:hover {
        .identicon-wrapper .identicon-menu {
            opacity: 1;
        }
    }
}

.actions,
.actions-mobile {
    position: relative;
    justify-content: space-between;
    margin-bottom: 0.75rem;
    align-items: center;
    margin: 0 var(--padding) 2rem;
    padding: 0 3rem 0 2rem;

    button {
        flex-shrink: 0;
    }
}

.actions-mobile .icon-button,
.active-address .identicon-wrapper .identicon-menu {
    .popup-menu {
        position: absolute;
        font-size: var(--body-size);
        padding: 0.5rem;
        font-weight: 600;
        word-break: keep-all;
        border-radius: 0.5rem;
        z-index: 1;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.3s var(--nimiq-ease);

        button {
            align-items: center;
            padding: 1rem 1.5rem 1rem 1rem;
            margin: 0; // Safari adds margin by default to all buttons
            border-radius: 0.25rem;
            transition: background-color .3s var(--nimiq-ease);
            white-space: nowrap;
            width: 100%;

            svg {
                width: 2.75rem;
                height: 3rem;
                margin: -0.125rem 1rem -0.125rem 0;
                opacity: 0.8;
            }

            &:hover,
            &:focus {
                background: rgba(255, 255, 255, 0.12);
            }
        }
    }

    &:hover,
    &:focus,
    &:focus-within {
        opacity: 1;

        .nq-icon {
            opacity: 0.8;
        }
    }

    &:focus,
    &:focus-within {
        .popup-menu {
            pointer-events: all;
            opacity: 1;
        }
    }
}

.actions-mobile .icon-button .popup-menu {
    top: 1.375rem;
    right: var(--padding);
}

.active-address .identicon-wrapper .identicon-menu .popup-menu {
    top: -0.25rem;
    left: -0.25rem;
}

.bridged-usdc-notice {
    background: var(--nimiq-highlight-bg);
    border-radius: 1.25rem;
    padding: 2rem;
    margin: 2rem calc(var(--padding) + 3rem) 0 calc(var(--padding) + 2rem);
    font-size: var(--body-size);
    font-weight: 600;

    .flex-row {
        gap: 1rem;
        align-items: center;

        + .flex-row {
            margin-top: 1.5rem;
            justify-content: space-between;
        }
    }

    svg.usdc {
        // color: var(--usdc-blue);
        width: 3rem;
        height: 3rem;
    }

    .amount {
        font-weight: bold;
    }

    .description {
        font-size: var(--small-size);
        opacity: 0.6;

        svg {
            display: inline;
            width: 2rem;
            height: 2rem;
            vertical-align: text-top;
            margin-top: 0.125rem;
            margin-right: 0.5rem;
        }

        .nq-link {
            color: inherit;
            text-decoration: underline;
        }
    }

    .nq-button-pill {
        white-space: nowrap;
    }
}

.send, .receive {
    margin: 0 0.5rem;
    align-items: center;

    padding: 1.125rem 2rem;
    height: unset;
    line-height: 1;
    border-radius: 500px;
    font-size: var(--large-button-size);

    .nq-icon {
        width: 1.5rem;
        height: 1.5rem;
        margin-right: 1rem;
    }

    &:disabled {
        pointer-events: none;
        background: rgba(131, 131, 131, 0.07);
        color: #B5B6C1;
    }
}

.send {
    margin-left: 1rem;

    .nq-icon {
        transform: rotateZ(-90deg);
    }
}

.receive {
    margin-right: 0;

    .nq-icon {
        transform: rotateZ(90deg);
    }
}

.unclaimed-cashlinks {
    flex-shrink: 0;
    margin-right: 1rem;

    padding: 1.125rem 2rem;
    height: unset;
    line-height: 1;
    border-radius: 500px;
    font-size: var(--large-button-size);

    background: none !important;
    box-shadow: inset 0 0 0 1.5px rgba(252, 135, 2, 0.35); // Based on Nimiq Orange

    transition:
        color .3s var(--nimiq-ease),
        background-color .3s var(--nimiq-ease),
        box-shadow .3s var(--nimiq-ease);

    &:hover,
    &:focus {
        box-shadow: inset 0 0 0 1.5px rgba(252, 117, 0, 0.45); // Based on Nimiq Orange Darkened
    }

    &.active {
        box-shadow: none;
        background:rgba(252, 135, 2, 0.13) !important;
    }
}

.actions-mobile {
    display: none;
}

.transaction-list {
    flex-grow: 1;
}

.promo-box {
    @include blue-tooltip(bottom);
    @include blue-tooltip_open(bottom);
    --blueTooltipPadding: 2rem;

    align-items: flex-start;
    position: absolute;
    width: 25.625rem;
    border-radius: 0.75rem;
    padding-top: 1.5rem;

    --promoBoxTop: 37rem;
    --promoBoxLeft: 14.5rem;

    top: calc(var(--promoBoxTop) + var(--padding) + var(--padding-bottom));
    left: calc(var(--promoBoxLeft) + var(--padding));

    div.flex-row {
        align-items: center;
        justify-content: flex-start;

        .nq-h2 {
            font-size: 16px;
            margin: 0;
            line-height: 130%;
        }

        svg {
            width: auto;
            height: 35px;
            flex-shrink: 0;
        }
    }

    // ul {
        // padding-left: 2.25rem;
        // margin: 0;

        // li {
        //     padding-top: 1.5rem;

        //     svg.nq-icon {
        //         margin-right: 1rem;
        //     }

        //     &.flex-row {
        //         margin-left: -2.25rem;
        //         list-style-type: none;
        //         position: relative;
        //         align-items: flex-start;

        //         .nq-icon {
        //             opacity: .7;
        //             width: 12px;
        //             height: auto;
        //             padding-top: 6px;
        //         }

        //         .nq-button-s {
        //             font-size: 14px;
        //             line-height: 18px;
        //             margin-left: 2rem;

        //             &:hover,
        //             &:focus,
        //             &:active {
        //                 color: white;
        //             }

        //             svg {
        //                 width: 15px;
        //                 height: auto;
        //             }
        //         }
        //     }

        //     &::marker {
        //         color: rgba(white, .7);
        //         transform: translateX(2px);
        //         font-size: 12px;
        //     }
        // }
    // }

    p, li {
        font-size: 14px;
        color: rgba(white, 0.8);
        font-weight: 600;
    }

    // .cross-close-button {
        // position: absolute;
        // top: 1rem;
        // right: 1rem;
        // opacity: .7;
    // }

    a.nq-button-s {
        flex-grow: 0;
        align-items: center;
        svg {
            margin-right: 1rem;
        }
    }

    &.fadeY-enter-active, &.fadeY-leave-active {
        will-change: opacity, transform;
        transition: {
            property: opacity, transform;
            duration: 200ms;
            timing-function: cubic-bezier(0.5, 0, 0.15, 1);
        }
    }

    &.fadeY-leave,
    &.fadeY-enter-to {
        transform: translateY(0) translateX(-50%);
    }

    &.fadeY-enter,
    &.fadeY-leave-to {
        opacity: 0;
        transform: translateY(1rem) translateX(-50%);
    }
}

@media (max-width: 700px) { // Full mobile breakpoint
    .address-overview {
        position: relative;
    }

    .actions {
        display: none;
    }

    .actions-mobile {
        display: flex;
        padding: 0;
        margin: 2rem var(--padding) 1rem;

        .search-bar,
        .unclaimed-cashlinks {
            margin: 0 1rem;
        }

        .icon-button {
            padding: 1rem;
            opacity: 0.3;
            font-size: 2.5rem;

            ::v-deep svg {
                display: block;
            }
        }
    }

    .active-address {
        padding: 2rem;
        margin: 0 var(--padding);

        .identicon-wrapper {
            margin-right: 1.5rem;

            > svg {
                width: 5.25rem;
                height: 5.25rem;
                color: var(--bitcoin-orange);
                margin: 0 0.25rem;
                display: block;
            }
        }

        .identicon-menu {
            display: none;
        }

        .identicon {
            height: 5.75rem;
            width: 5.75rem;
            margin: -0.25rem 0; // Negative margin above and below to size identicon to be 46x40 px
        }

        .label,
        .copyable {
            margin-right: 1.25rem;
        }

        .label,
        .amount {
            font-size: var(--h2-size);
            margin-bottom: 0;
        }

        .label.bitcoin {
            top: 0.625rem;
        }

        .address,
        .fiat-amount {
            font-size: var(--small-size);
        }
    }

    .native-usdc-notice {
        margin: 0 calc(var(--padding) + 1rem);
    }

    .mobile-action-bar {
        margin: 0;
        box-shadow:
            0px 0px 4.12454px rgba(31, 35, 72, 0.031357),
            0px 0px 12.5187px rgba(31, 35, 72, 0.045),
            0px 0px 32.0004px rgba(31, 35, 72, 0.058643),
            0px 0px 80px rgba(31, 35, 72, 0.07);
    }

    .promo-box {
        top: 35rem;
        left: 15rem;

        &::after {
            left: 40%;
        }
    }
}
.justify-between {
    justify-content: space-between;
}
.w-full {
    width: 100%;
}
.ml-auto {
    margin-left: auto;
}
</style>
