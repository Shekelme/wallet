import { useTransactionsStore } from '@/stores/Transactions';
import { WalletHTMLElements } from '..';
import { OnboardingGetStepFnArgs, OnboardingTourStep, TourStep } from '../types';
import { getOnboardingTexts } from './OnboardingTourTexts';

export function getTransactionListStep(
    { isSmallScreen, isANewUser }: OnboardingGetStepFnArgs): TourStep {
    const txsLen = () => Object.values(useTransactionsStore().state.transactions).length;

    const highlightButton = (highlight: boolean) => {
        const receiveNim = document
            .querySelector(WalletHTMLElements.BUTTON_ADDRESS_OVERVIEW_RECEIVE_FREE_NIM) as HTMLButtonElement;
        if (!receiveNim) return;
        receiveNim.classList[highlight ? 'add' : 'remove']('highlighted');
    };

    const ui: TourStep['ui'] = {
        fadedElements: [
            WalletHTMLElements.SIDEBAR_TESTNET,
            WalletHTMLElements.SIDEBAR_LOGO,
            WalletHTMLElements.SIDEBAR_PRICE_CHARTS,
            WalletHTMLElements.SIDEBAR_TRADE_ACTIONS,
            WalletHTMLElements.SIDEBAR_ACCOUNT_MENU,
            WalletHTMLElements.SIDEBAR_NETWORK,
            WalletHTMLElements.SIDEBAR_SETTINGS,
            WalletHTMLElements.ACCOUNT_OVERVIEW_MOBILE_ACTION_BAR,
            WalletHTMLElements.ACCOUNT_OVERVIEW_BACKUP_ALERT,
            WalletHTMLElements.ACCOUNT_OVERVIEW_TABLET_MENU_BAR,
            WalletHTMLElements.ACCOUNT_OVERVIEW_BALANCE,
            WalletHTMLElements.ACCOUNT_OVERVIEW_ADDRESS_LIST,
            WalletHTMLElements.ACCOUNT_OVERVIEW_BITCOIN,
            WalletHTMLElements.ADDRESS_OVERVIEW_MOBILE_ACTION_BAR,
        ],
        disabledElements: [
            WalletHTMLElements.ADDRESS_OVERVIEW_ACTIONS_MOBILE,
            WalletHTMLElements.ADDRESS_OVERVIEW_TRANSACTIONS,
            WalletHTMLElements.ADDRESS_OVERVIEW_ACTIVE_ADDRESS,
            WalletHTMLElements.ADDRESS_OVERVIEW_ACTIONS,
        ],
        disabledButtons: [
            WalletHTMLElements.BUTTON_SIDEBAR_BUY,
            WalletHTMLElements.BUTTON_SIDEBAR_SELL,
            WalletHTMLElements.BUTTON_ADDRESS_OVERVIEW_BUY,
        ],
    };

    return {
        get path() {
            return isSmallScreen.value ? '/transactions' : '/';
        },
        tooltip: {
            get target() {
                if (txsLen() > 0) {
                    return isSmallScreen.value
                        ? `${WalletHTMLElements.ADDRESS_OVERVIEW_TRANSACTIONS} .vue-recycle-scroller__item-wrapper`
                        : WalletHTMLElements.ADDRESS_OVERVIEW;
                }
                return isSmallScreen.value
                    ? `${WalletHTMLElements.ADDRESS_OVERVIEW_TRANSACTIONS} > .empty-state h2`
                    : WalletHTMLElements.ADDRESS_OVERVIEW;
            },
            get content() {
                return txsLen() > 0
                    ? getOnboardingTexts(OnboardingTourStep.TRANSACTION_LIST, isANewUser).alternative || []
                    : getOnboardingTexts(OnboardingTourStep.TRANSACTION_LIST, isANewUser).default || [];
            },
            params: {
                get placement() {
                    if (txsLen() > 0) {
                        return isSmallScreen.value ? 'bottom' : 'left';
                    }
                    return isSmallScreen.value ? 'top' : 'left';
                },
            },
        },
        lifecycle: {
            mounted: () => {
                if (txsLen() > 0) return undefined;
                highlightButton(true);
                return () => highlightButton(false);
            },
        },
        get ui() {
            return {
                ...ui,
                isNextStepDisabled: txsLen() === 0,
            };
        },
    };
}
