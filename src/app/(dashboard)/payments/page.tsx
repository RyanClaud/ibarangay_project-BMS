import { PaymentsClientPage } from "@/components/payments/payments-client-page";

export default function PaymentsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#172B4D]">
          Payments &amp; Fee Collection
        </h1>
        <p className="text-sm text-[#718096] mt-1">
          Review verified transactions, track revenue collections, and manage official receipts.
        </p>
      </div>
      <PaymentsClientPage />
    </div>
  );
}
