import { DocumentRequestClientPage } from "@/components/documents/document-request-client-page";

export default function DocumentsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#172B4D]">
          Certificates &amp; Clearances
        </h1>
        <p className="text-sm text-[#718096] mt-1">
          Review, approve, and process official document requests from residents.
        </p>
      </div>
      <DocumentRequestClientPage />
    </div>
  );
}
