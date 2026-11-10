import type { Resident } from "@/lib/types";
import { ResidentClientPage } from "@/components/residents/resident-client-page";

export default function ResidentsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#172B4D]">
          Resident Management
        </h1>
        <p className="text-sm text-[#718096] mt-1">
          View, add, and manage resident profiles in your barangay.
        </p>
      </div>
      <ResidentClientPage />
    </div>
  );
}
