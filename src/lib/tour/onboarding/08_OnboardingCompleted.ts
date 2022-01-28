import { useAccountStore } from '@/stores/Account';
import { GetStepFnArgs, OnboardingTourStep, TourStep, WalletHTMLElements } from '../types';
import { getOnboardingTexts } from './OnboardingTourTexts';

export function getOnboardingCompletedStep(
    { root, isLargeScreen, isANewUser }: GetStepFnArgs<OnboardingTourStep>): TourStep {
    const ui: TourStep['ui'] = {
        fadedElements: [
            WalletHTMLElements.SIDEBAR_TESTNET,
            WalletHTMLElements.SIDEBAR_LOGO,
            WalletHTMLElements.SIDEBAR_PRICE_CHARTS,
            WalletHTMLElements.SIDEBAR_TRADE_ACTIONS,
            WalletHTMLElements.SIDEBAR_ACCOUNT_MENU,
            WalletHTMLElements.SIDEBAR_SETTINGS,
            WalletHTMLElements.ACCOUNT_OVERVIEW_MOBILE_ACTION_BAR,
            WalletHTMLElements.ADDRESS_OVERVIEW_MOBILE_ACTION_BAR,
        ],
        disabledElements: [
            WalletHTMLElements.SIDEBAR_NETWORK,
            WalletHTMLElements.SIDEBAR_MOBILE_TAP_AREA,
            WalletHTMLElements.ACCOUNT_OVERVIEW_BACKUP_ALERT,
            WalletHTMLElements.ACCOUNT_OVERVIEW_TABLET_MENU_BAR,
            WalletHTMLElements.ACCOUNT_OVERVIEW_BALANCE,
            WalletHTMLElements.ACCOUNT_OVERVIEW_ADDRESS_LIST,
            WalletHTMLElements.ACCOUNT_OVERVIEW_BITCOIN,
            WalletHTMLElements.ADDRESS_OVERVIEW,
        ],
        disabledButtons: [
            WalletHTMLElements.BUTTON_SIDEBAR_BUY,
            WalletHTMLElements.BUTTON_SIDEBAR_SELL,
            WalletHTMLElements.BUTTON_ADDRESS_OVERVIEW_BUY,
        ],
    };
    return {
        path: isLargeScreen.value ? '/' : '/?sidebar=true',
        tooltip: {
            target: `${WalletHTMLElements.SIDEBAR_NETWORK} ${isLargeScreen.value ? 'span' : '.consensus-icon'}`,
            content: getOnboardingTexts(OnboardingTourStep.ONBOARDING_COMPLETED, isANewUser).default,
            params: {
                placement: isLargeScreen.value ? 'right' : 'top-start',
            },
            button: {
                text: 'Go to Network',
                fn: async (endTour) => {
                    if (endTour) {
                        await endTour();
                    }
                    const { setTour } = useAccountStore();
                    setTour({ name: 'network', isANewUser: false });
                    root.$router.push('/network');
                },
            },
        },
        ui,
    } as TourStep;
}
