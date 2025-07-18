import methods from "./data/methods.json";
import escrow from "./data/escrow.json";
import transactions from "./data/transactions.json";
import PayoutsFilterBar from "./components/PayoutsFilterBar";
import PayoutPageCards from "./components/PayoutsPageCards";
import PayoutMethods from "./components/PayoutMethods";
import EscrowStatusTable from "./components/EscrowStatusTable";
import TransactionHistory from "./components/TransactionHistory";

export default function PayoutsPage() {
  return (
    <div className="grid gap-6 p-4">
      <PayoutsFilterBar />
      <PayoutPageCards />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1">
          <PayoutMethods methods={methods} />
        </div>
        <div className="lg:col-span-2">
          <EscrowStatusTable orders={escrow} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5">
        <TransactionHistory transactions={transactions} />
      </div>
    </div>
  );
}
