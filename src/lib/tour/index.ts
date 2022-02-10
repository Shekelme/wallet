import { ScreenTypes } from '@/composables/useWindowSize';
import { SetupContext } from '@vue/composition-api';
import { getNetworkTourSteps } from './network';
import { getOnboardingTourSteps } from './onboarding';
import { ITooltipModifier, ITourStep, ITourSteps, NetworkTourStep, OnboardingTourStep, TourName } from './types';

// see more about tooltip modifiers at popper official documentation
export const defaultTooltipModifiers: ITooltipModifier[] = [
    {
        name: 'arrow',
        options: {
            element: '.v-step__arrow',
            padding: 16,
        },
    },
    {
        name: 'preventOverflow',
        options: {
            rootBoundary: 'window',
        },
    },
    {
        name: 'offset',
        options: {
            offset: [0, 10],
        },
    },
];

export function getTour(tour: TourName | undefined, context: SetupContext, screenTypes: ScreenTypes)
    : ITourStep[] {
    let steps: ITourSteps<OnboardingTourStep | NetworkTourStep> = {};
    switch (tour) {
        case 'onboarding':
            steps = getOnboardingTourSteps(context, screenTypes);
            break;
        case 'network':
            steps = getNetworkTourSteps(context, screenTypes);
            break;
        default:
    }

    return Object.values(steps).filter((step) => Boolean(step)) as ITourStep[];
}

// Finds the component instance given its name in the Vue tree
// Components in the wallet should not change its logic to fit tour requirements. For example, adding
// listeners for the tour in AddressList or TransactionList components should be done in the tour
// and no in each component. In order to access the component instance, we need to find it in the
// Vue tree.
export function searchComponentByName(c: Vue, name: string): Vue | undefined {
    if (c.$options.name === name) {
        return c;
    }
    for (const cc of c.$children) {
        const found = searchComponentByName(cc, name);
        if (found) return found;
    }

    return undefined;
}

export * from './types';
