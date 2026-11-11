'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useFirebase } from '@/firebase';
import { collection, writeBatch, doc, query, where, getDocs } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  CheckCircle, 
  Building2, 
  MapPin, 
  Layers, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Import PSGC data
const phData = require('ph-geo-admin-divisions');

interface Municipality {
  name: string;
  code: string;
  provinceId: string;
}

interface Barangay {
  name: string;
  code: string;
  municipalityId: string;
}

export default function BulkCreateBarangaysPage() {
  const { firestore } = useFirebase();
  const router = useRouter();
  
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [selectedMunicipality, setSelectedMunicipality] = useState<string>('');
  const [barangays, setBarangays] = useState<Barangay[]>([]);
  const [selectedBarangays, setSelectedBarangays] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState(false);
  const [existingBarangays, setExistingBarangays] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadMunicipalities();
  }, []);

  useEffect(() => {
    if (selectedMunicipality) {
      loadBarangays(selectedMunicipality);
      checkExistingBarangays(selectedMunicipality);
    }
  }, [selectedMunicipality]);

  const loadMunicipalities = () => {
    try {
      const { provinces, municipalities: allMunicipalities } = phData;
      
      const orientalMindoro = provinces.find((p: any) => 
        p.name && p.name.toLowerCase().includes('oriental mindoro')
      );
      
      if (!orientalMindoro) {
        toast({
          title: 'Error',
          description: 'Oriental Mindoro province not found',
          variant: 'destructive',
        });
        return;
      }
      
      const orientalMindoroMunicipalities = allMunicipalities
        .filter((m: any) => m.provinceId === orientalMindoro.provinceId)
        .map((m: any) => ({
          name: m.name,
          code: m.municipalityId,
          provinceId: m.provinceId,
        }))
        .sort((a: Municipality, b: Municipality) => a.name.localeCompare(b.name));
      
      setMunicipalities(orientalMindoroMunicipalities);
    } catch (error) {
      console.error('Error loading municipalities:', error);
      toast({
        title: 'Error',
        description: 'Failed to load municipalities',
        variant: 'destructive',
      });
    }
  };

  const loadBarangays = (municipalityCode: string) => {
    try {
      const { baranggays: allBarangays } = phData;
      const municipality = municipalities.find(m => m.code === municipalityCode);
      
      if (!municipality) return;
      
      const municipalityBarangays = allBarangays
        .filter((b: any) => 
          b.municipalityId === municipalityCode &&
          b.provinceId === municipality.provinceId
        )
        .map((b: any) => ({
          name: b.name,
          code: b.psgcId || '',
          municipalityId: b.municipalityId,
        }))
        .sort((a: Barangay, b: Barangay) => a.name.localeCompare(b.name));
      
      setBarangays(municipalityBarangays);
      setSelectedBarangays(new Set());
    } catch (error) {
      console.error('Error loading barangays:', error);
      toast({
        title: 'Error',
        description: 'Failed to load barangays',
        variant: 'destructive',
      });
    }
  };

  const checkExistingBarangays = async (municipalityCode: string) => {
    if (!firestore) return;
    
    try {
      const municipality = municipalities.find(m => m.code === municipalityCode);
      if (!municipality) return;
      
      const q = query(
        collection(firestore, 'barangays'),
        where('municipality', '==', municipality.name)
      );
      
      const snapshot = await getDocs(q);
      const existing = new Set(snapshot.docs.map(doc => doc.data().name));
      setExistingBarangays(existing);
    } catch (error) {
      console.error('Error checking existing barangays:', error);
    }
  };

  const toggleBarangay = (barangayName: string) => {
    const newSelected = new Set(selectedBarangays);
    if (newSelected.has(barangayName)) {
      newSelected.delete(barangayName);
    } else {
      newSelected.add(barangayName);
    }
    setSelectedBarangays(newSelected);
  };

  const selectAll = () => {
    const newBarangays = barangays.filter(b => !existingBarangays.has(b.name));
    setSelectedBarangays(new Set(newBarangays.map(b => b.name)));
  };

  const deselectAll = () => {
    setSelectedBarangays(new Set());
  };

  const handleCreate = async () => {
    if (!firestore || selectedBarangays.size === 0) return;

    setIsCreating(true);

    try {
      const municipality = municipalities.find(m => m.code === selectedMunicipality);
      if (!municipality) throw new Error('Municipality not found');

      const barangaysToCreate = barangays.filter(b => selectedBarangays.has(b.name));
      
      for (let i = 0; i < barangaysToCreate.length; i += 500) {
        const batch = writeBatch(firestore);
        const batchData = barangaysToCreate.slice(i, i + 500);
        
        for (const barangay of batchData) {
          const docRef = doc(collection(firestore, 'barangays'));
          
          const cleanName = barangay.name
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .substring(0, 30);
          const adminEmail = `admin@ibarangay${cleanName}.com`;
          
          batch.set(docRef, {
            name: barangay.name,
            municipality: municipality.name,
            province: 'Oriental Mindoro',
            region: 'MIMAROPA',
            psgcCode: barangay.code,
            address: `${barangay.name}, ${municipality.name}, Oriental Mindoro`,
            contactNumber: '',
            sealLogoUrl: '',
            adminEmail: adminEmail,
            isActive: true,
            createdAt: new Date().toISOString(),
          });
        }
        
        await batch.commit();
      }

      toast({
        title: 'Success',
        description: `Provisioned ${barangaysToCreate.length} barangay jurisdictions successfully.`,
      });

      await checkExistingBarangays(selectedMunicipality);
      setSelectedBarangays(new Set());
      
    } catch (error: any) {
      console.error('Creation error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create barangays',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const selectedMunicipalityData = municipalities.find(m => m.code === selectedMunicipality);
  const availableBarangays = barangays.filter(b => !existingBarangays.has(b.name));

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
              <span>PSGC Standard Geodatabase • Oriental Mindoro</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
              Bulk Provision Barangays
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/80 mt-0.5 max-w-xl">
              Rapidly enroll multiple municipal barangay units from official Philippine Standard Geographic Code data.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2.5 shrink-0">
          <Link href="/barangays">
            <Button
              variant="outline"
              className="rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/20 backdrop-blur-xs font-semibold h-10 px-4 text-xs sm:text-sm"
            >
              View Roster
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Municipality Selection Card */}
        <div className="rounded-2xl border border-[#E5EAF2] bg-white p-6 shadow-xs space-y-5 lg:col-span-1">
          <div className="flex items-center gap-3 pb-4 border-b border-[#E5EAF2]">
            <div className="size-10 rounded-xl bg-[#2474E8]/10 text-[#2474E8] flex items-center justify-center">
              <Building2 className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#102D56]">Select Municipality</h2>
              <p className="text-xs text-[#718096]">Choose municipal cluster in Oriental Mindoro</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-[#172B4D]">Target LGU Cluster</Label>
            <Select value={selectedMunicipality} onValueChange={setSelectedMunicipality}>
              <SelectTrigger className="h-11 rounded-xl bg-[#F0F4FA] border-[#E2E8F0] text-sm text-[#172B4D] font-medium">
                <SelectValue placeholder="Choose municipality..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-[#E5EAF2]">
                {municipalities.map((municipality) => (
                  <SelectItem key={municipality.code} value={municipality.code}>
                    {municipality.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedMunicipalityData && (
            <div className="rounded-xl bg-[#F8FAFC] border border-[#E5EAF2] p-4 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[#718096] font-medium">Total PSGC Units:</span>
                <span className="font-bold text-[#102D56]">{barangays.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#718096] font-medium">Already Registered:</span>
                <span className="font-bold text-[#102D56]">{existingBarangays.size}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#718096] font-medium">Available to Provision:</span>
                <span className="font-bold text-[#10A875]">{availableBarangays.length}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#E5EAF2]">
                <span className="text-[#172B4D] font-bold">Selected to Create:</span>
                <span className="font-extrabold text-[#246BDE]">{selectedBarangays.size}</span>
              </div>
            </div>
          )}
        </div>

        {/* Barangay Selection Card */}
        <div className="rounded-2xl border border-[#E5EAF2] bg-white p-6 shadow-xs lg:col-span-2 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E5EAF2] gap-3">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-[#10A875]/10 text-[#10A875] flex items-center justify-center">
                <MapPin className="size-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#102D56]">Select Jurisdictions</h2>
                <p className="text-xs text-[#718096]">
                  {selectedMunicipalityData 
                    ? `Barangays in ${selectedMunicipalityData.name} ready for batch enrollment` 
                    : 'Select a municipality on the left to load its barangay units'}
                </p>
              </div>
            </div>

            {barangays.length > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAll}
                  disabled={availableBarangays.length === 0}
                  className="rounded-xl border-[#E5EAF2] text-xs font-semibold h-8"
                >
                  Select All ({availableBarangays.length})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={deselectAll}
                  disabled={selectedBarangays.size === 0}
                  className="rounded-xl border-[#E5EAF2] text-xs font-semibold h-8"
                >
                  Deselect
                </Button>
              </div>
            )}
          </div>

          {!selectedMunicipality ? (
            <div className="text-center py-16 text-[#718096] space-y-2">
              <Building2 className="size-12 mx-auto text-[#CBD5E1]" />
              <p className="font-semibold text-[#172B4D]">Awaiting Municipality Selection</p>
              <p className="text-xs text-[#718096]">Please choose a municipal cluster from the left panel.</p>
            </div>
          ) : barangays.length === 0 ? (
            <div className="text-center py-16 text-[#718096] space-y-2">
              <MapPin className="size-12 mx-auto text-[#CBD5E1]" />
              <p className="font-semibold text-[#172B4D]">No barangays cataloged</p>
              <p className="text-xs text-[#718096]">No official PSGC barangays found for this municipality.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[460px] overflow-y-auto pr-1">
                {barangays.map((barangay) => {
                  const isExisting = existingBarangays.has(barangay.name);
                  const isSelected = selectedBarangays.has(barangay.name);
                  
                  return (
                    <div
                      key={barangay.code}
                      onClick={() => !isExisting && !isCreating && toggleBarangay(barangay.name)}
                      className={`flex items-center space-x-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isExisting
                          ? 'bg-slate-50 border-[#E2E8F0] opacity-60 cursor-not-allowed'
                          : isSelected
                          ? 'bg-[#246BDE]/10 border-[#246BDE] shadow-xs'
                          : 'border-[#E5EAF2] bg-white hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <Checkbox
                        id={barangay.code}
                        checked={isSelected}
                        onCheckedChange={() => toggleBarangay(barangay.name)}
                        disabled={isExisting || isCreating}
                        className="data-[state=checked]:bg-[#246BDE]"
                      />
                      <label
                        htmlFor={barangay.code}
                        className="flex-1 text-xs font-bold leading-none cursor-pointer text-[#172B4D]"
                      >
                        {barangay.name}
                        {isExisting && (
                          <span className="block mt-1 text-[11px] font-normal text-[#718096]">Already Enrolled</span>
                        )}
                      </label>
                      {isSelected && <CheckCircle className="size-4 text-[#246BDE] shrink-0" />}
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-[#E5EAF2]">
                <Button
                  onClick={handleCreate}
                  disabled={selectedBarangays.size === 0 || isCreating}
                  className="w-full sm:flex-1 h-11 rounded-xl bg-[#246BDE] hover:bg-[#1E5CC0] text-white font-bold shadow-xs text-xs sm:text-sm"
                >
                  {isCreating ? (
                    <>Provisioning {selectedBarangays.size} Barangays...</>
                  ) : (
                    <>Provision {selectedBarangays.size} Selected Jurisdictions</>
                  )}
                </Button>
                <Link href="/barangays" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    className="w-full h-11 rounded-xl border-[#E5EAF2] text-xs font-semibold text-[#172B4D]"
                  >
                    Return to Roster
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
