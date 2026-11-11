'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFirebase } from '@/firebase';
import { collection, writeBatch, doc } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  AlertCircle, 
  CheckCircle, 
  ArrowLeft,
  Sparkles,
  Building2,
  CheckCircle2,
  MapPin,
  Layers
} from 'lucide-react';
import Link from 'next/link';

export default function ImportBarangaysPage() {
  const { firestore } = useFirebase();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [results, setResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

  const downloadTemplate = () => {
    const csvContent = `Barangay Name,Municipality,Province,Address,Contact Number,Seal/Logo URL
Mina De Oro,Bongabong,Oriental Mindoro,"Bongabong, Oriental Mindoro",+63 123 456 7890,
San Isidro,Bongabong,Oriental Mindoro,"Bongabong, Oriental Mindoro",+63 123 456 7891,
Poblacion,Calapan City,Oriental Mindoro,"Calapan City, Oriental Mindoro",+63 123 456 7892,`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'barangay_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        toast({
          title: 'Invalid File',
          description: 'Please select a CSV file',
          variant: 'destructive',
        });
        return;
      }
      setFile(selectedFile);
    }
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());
    
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      return obj;
    });
  };

  const handleImport = async () => {
    if (!file || !firestore) return;

    setIsImporting(true);
    setResults(null);

    try {
      const text = await file.text();
      const barangays = parseCSV(text);
      
      let successCount = 0;
      let failedCount = 0;
      const errors: string[] = [];
      const barangaysToAdd: any[] = [];

      for (const row of barangays) {
        try {
          if (!row['Barangay Name'] || !row['Municipality'] || !row['Province']) {
            errors.push(`Skipped row: Missing required fields`);
            failedCount++;
            continue;
          }

          const barangayData = {
            name: row['Barangay Name'],
            municipality: row['Municipality'],
            province: row['Province'],
            address: row['Address'] || `${row['Municipality']}, ${row['Province']}`,
            contactNumber: row['Contact Number'] || '',
            sealLogoUrl: row['Seal/Logo URL'] || '',
            isActive: true,
            createdAt: new Date().toISOString(),
          };

          barangaysToAdd.push(barangayData);
          successCount++;
        } catch (error: any) {
          errors.push(`Failed to add ${row['Barangay Name']}: ${error.message}`);
          failedCount++;
        }
      }

      for (let i = 0; i < barangaysToAdd.length; i += 500) {
        const batchData = barangaysToAdd.slice(i, i + 500);
        const currentBatch = writeBatch(firestore);
        
        for (const data of batchData) {
          const docRef = doc(collection(firestore, 'barangays'));
          currentBatch.set(docRef, data);
        }
        
        await currentBatch.commit();
      }

      setResults({ success: successCount, failed: failedCount, errors });
      
      toast({
        title: 'Import Complete',
        description: `Successfully imported ${successCount} barangays`,
      });
    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: 'Import Failed',
        description: error.message || 'Failed to import barangays',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Executive Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0C2340] via-[#123E75] to-[#1D5496] p-6 md:p-8 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="relative z-10 flex items-center gap-4">
          <Link href="/barangays">
            <Button
              variant="outline"
              size="icon"
              className="size-11 rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/20 backdrop-blur-xs shrink-0"
            >
              <ArrowLeft className="size-5" />
            </Button>
          </Link>
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/15 text-xs font-semibold text-blue-200 mb-1.5 backdrop-blur-xs">
              <Sparkles className="size-3 text-yellow-400" />
              <span>Bulk Data Ingestion • CSV Format</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
              Import Barangays via CSV
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/80 mt-0.5 max-w-xl">
              Import formatted spreadsheet records to batch-register multiple barangay jurisdictions simultaneously.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2.5 shrink-0">
          <Link href="/barangays">
            <Button
              variant="outline"
              className="rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/20 backdrop-blur-xs font-semibold h-10 px-4 text-xs sm:text-sm"
            >
              Return to Roster
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Instructions Card */}
        <div className="rounded-2xl border border-[#E5EAF2] bg-white p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-[#E5EAF2]">
            <div className="size-10 rounded-xl bg-[#2474E8]/10 text-[#2474E8] flex items-center justify-center">
              <FileSpreadsheet className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#102D56]">Ingestion Instructions</h2>
              <p className="text-xs text-[#718096]">Follow three simple steps to prepare your file</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="size-7 rounded-lg bg-[#246BDE] text-white flex items-center justify-center text-xs font-bold shrink-0">
                1
              </div>
              <div>
                <p className="font-bold text-xs text-[#172B4D]">Download CSV Schema Template</p>
                <p className="text-xs text-[#718096] mt-0.5">Use the pre-formatted headers to guarantee validation compatibility.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="size-7 rounded-lg bg-[#246BDE] text-white flex items-center justify-center text-xs font-bold shrink-0">
                2
              </div>
              <div>
                <p className="font-bold text-xs text-[#172B4D]">Populate Jurisdiction Records</p>
                <p className="text-xs text-[#718096] mt-0.5">Required fields: Barangay Name, Municipality, Province.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="size-7 rounded-lg bg-[#246BDE] text-white flex items-center justify-center text-xs font-bold shrink-0">
                3
              </div>
              <div>
                <p className="font-bold text-xs text-[#172B4D]">Upload & Ingest</p>
                <p className="text-xs text-[#718096] mt-0.5">Attach your CSV file and execute batch insertion.</p>
              </div>
            </div>
          </div>

          <Button 
            onClick={downloadTemplate} 
            variant="outline" 
            className="w-full h-11 rounded-xl border-[#E5EAF2] text-[#172B4D] font-bold text-xs hover:bg-[#F8FAFC]"
          >
            <Download className="mr-2 size-4 text-[#246BDE]" />
            Download Official Template (.csv)
          </Button>

          <div className="rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] p-3.5">
            <p className="text-xs text-[#1E40AF]">
              <strong>Standard Encoding:</strong> UTF-8 formatted CSV with comma delimiters is recommended.
            </p>
          </div>
        </div>

        {/* Upload Card */}
        <div className="rounded-2xl border border-[#E5EAF2] bg-white p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-[#E5EAF2]">
            <div className="size-10 rounded-xl bg-[#10A875]/10 text-[#10A875] flex items-center justify-center">
              <Upload className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#102D56]">Upload Document</h2>
              <p className="text-xs text-[#718096]">Attach your prepared CSV file</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="csvFile" className="text-xs font-bold text-[#172B4D]">Select CSV Data File</Label>
            <Input
              id="csvFile"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={isImporting}
              className="rounded-xl bg-[#F0F4FA] border-[#E2E8F0] file:rounded-lg file:border-0 file:bg-[#246BDE] file:text-white file:text-xs file:font-semibold file:mr-3 file:py-1"
            />
            {file && (
              <p className="text-xs font-semibold text-[#246BDE] mt-1">
                Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          <Button
            onClick={handleImport}
            disabled={!file || isImporting}
            className="w-full h-11 rounded-xl bg-[#246BDE] hover:bg-[#1E5CC0] text-white font-bold shadow-xs text-xs sm:text-sm"
          >
            {isImporting ? (
              <>Ingesting records...</>
            ) : (
              <>
                <Upload className="mr-2 size-4" />
                Upload & Ingest Barangays
              </>
            )}
          </Button>

          {results && (
            <div className="space-y-3 pt-4 border-t border-[#E5EAF2]">
              <div className="flex items-center gap-2 text-xs font-bold text-[#10A875]">
                <CheckCircle2 className="size-4" />
                <span>{results.success} barangays imported successfully</span>
              </div>
              
              {results.failed > 0 && (
                <div className="rounded-xl bg-[#FEF2F2] border border-[#FECACA] p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#EF4655]">
                    <AlertCircle className="size-4" />
                    <span>{results.failed} records failed</span>
                  </div>
                  {results.errors.length > 0 && (
                    <ul className="text-[11px] text-[#718096] pl-5 list-disc space-y-0.5">
                      {results.errors.slice(0, 4).map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <Button
                onClick={() => router.push('/barangays')}
                variant="outline"
                className="w-full h-10 rounded-xl border-[#E5EAF2] text-xs font-semibold text-[#172B4D]"
              >
                View Updated Roster
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Oriental Mindoro Quick Reference Card */}
      <div className="rounded-2xl border border-[#E5EAF2] bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E5EAF2]">
          <div>
            <h2 className="text-base font-bold text-[#102D56]">Oriental Mindoro Municipal Reference</h2>
            <p className="text-xs text-[#718096]">Official cluster catalog (15 Municipalities / Cities • 426 Barangays)</p>
          </div>
          <span className="text-xs font-bold text-[#246BDE]">Region IV-B MIMAROPA</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          {[
            { name: 'Baco', count: 26 },
            { name: 'Bansud', count: 14 },
            { name: 'Bongabong', count: 19 },
            { name: 'Bulalacao', count: 15 },
            { name: 'Calapan City', count: 62 },
            { name: 'Gloria', count: 28 },
            { name: 'Mansalay', count: 21 },
            { name: 'Naujan', count: 69 },
            { name: 'Pinamalayan', count: 25 },
            { name: 'Pola', count: 25 },
            { name: 'Puerto Galera', count: 13 },
            { name: 'Roxas', count: 9 },
            { name: 'San Teodoro', count: 18 },
            { name: 'Socorro', count: 15 },
            { name: 'Victoria', count: 27 },
          ].map((m) => (
            <div
              key={m.name}
              className="p-3 rounded-xl border border-[#E5EAF2] bg-[#F8FAFC] hover:bg-white hover:border-[#246BDE]/40 transition-all shadow-2xs"
            >
              <p className="font-bold text-xs text-[#102D56]">{m.name}</p>
              <p className="text-[11px] font-medium text-[#718096] mt-0.5">{m.count} Barangays</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
