interface BalanceDisplayProps {
  balance: string | null;
  symbol: string;
}

export function BalanceDisplay({ balance, symbol }: BalanceDisplayProps) {
  // Format balance for display
  const formattedBalance = balance ? parseFloat(balance).toFixed(2) : '0.00';

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-secondary/10 rounded-lg border border-border">
      <span className="text-lg font-mono font-semibold text-foreground" data-testid="balance-amount">
        {formattedBalance}
      </span>
      <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide" data-testid="balance-symbol">
        {symbol}
      </span>
    </div>
  );
}