import React, { useMemo, useCallback } from 'react';

// Updated interface to include blockchain property
interface WalletBalance {
  currency: string;
  amount: number;
  blockchain: string; // Added missing blockchain property
}

interface FormattedWalletBalance {
  currency: string;
  amount: number;
  formatted: string;
}

// Assuming BoxProps - replace with actual import if available
interface BoxProps {
  className?: string;
}

interface Props extends BoxProps {
  children?: React.ReactNode;
}

// Mock hooks - replace with actual implementations
const useWalletBalances = (): WalletBalance[] => {
  // This would be your actual hook implementation
  return [];
};

const usePrices = (): Record<string, number> => {
  // This would be your actual hook implementation
  return {};
};

// Mock classes object - replace with actual styling
const classes = {
  row: 'wallet-row'
};

// Configuration-based priority system (more extensible)
const BLOCKCHAIN_PRIORITIES: Record<string, number> = {
  'Osmosis': 100,
  'Ethereum': 50,
  'Arbitrum': 30,
  'Zilliqa': 20,
  'Neo': 20,
} as const;

// Separate business logic functions
const getPriority = (blockchain: string): number => {
  return BLOCKCHAIN_PRIORITIES[blockchain] ?? -99;
};

const isValidBalance = (balance: WalletBalance): boolean => {
  const balancePriority = getPriority(balance.blockchain);
  return balancePriority > -99 && balance.amount > 0;
};

// Custom hook for data processing - separates logic from component
const useProcessedBalances = (balances: WalletBalance[], prices: Record<string, number>) => {
  return useMemo(() => {
    // Pre-calculate priorities to avoid repeated function calls
    const balancesWithPriority = balances
      .filter(isValidBalance)
      .map(balance => ({
        ...balance,
        priority: getPriority(balance.blockchain),
        usdValue: prices[balance.currency] * balance.amount,
      }));

    // Single sort operation with pre-calculated priorities
    const sortedBalances = balancesWithPriority.sort((lhs, rhs) => {
      if (lhs.priority > rhs.priority) return -1;
      if (rhs.priority > lhs.priority) return 1;
      return 0;
    });

    // Single map operation to format balances
    const formattedBalances: FormattedWalletBalance[] = sortedBalances.map(balance => ({
      currency: balance.currency,
      amount: balance.amount,
      formatted: balance.amount.toFixed(2),
    }));

    return { formattedBalances, sortedBalances };
  }, [balances, prices]); // Proper dependencies
};

// Memoized row component to prevent unnecessary re-renders
const WalletRow = React.memo<{
  balance: FormattedWalletBalance;
  usdValue: number;
  index: number;
  classes: any;
}>(({ balance, usdValue, index, classes }) => (
  <div className={classes.row} key={index}>
    <div>{balance.amount}</div>
    <div>{usdValue.toFixed(2)}</div>
    <div>{balance.formatted}</div>
  </div>
));

// Main component with separated concerns
const WalletPage: React.FC<Props> = ({ children, ...rest }) => {
  const balances = useWalletBalances();
  const prices = usePrices();

  const { formattedBalances, sortedBalances } = useProcessedBalances(balances, prices);

  // Memoize row rendering to prevent recreation on every render
  const renderRows = useCallback(() => {
    return sortedBalances.map((balance, index) => (
      <WalletRow
        key={`${balance.currency}-${index}`} // More stable key
        balance={formattedBalances[index]}
        usdValue={balance.usdValue}
        index={index}
        classes={classes}
      />
    ));
  }, [sortedBalances, formattedBalances]);

  return (
    <div {...rest}>
      {renderRows()}
    </div>
  );
};

export default React.memo(WalletPage);
