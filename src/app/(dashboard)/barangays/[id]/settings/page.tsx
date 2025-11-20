'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Save, 
  Users, 
  FileText, 
  DollarSign, 
  Building2,
  Mail,
  Phone,
  MapPin,
  BarChart3,
  CheckCircle
} from "lucide-react";
import type { Barangay } from "@/lib/types";

// Mock data - replace with actual API call
const mockBarangay: Barangay = {
  id: "brgy-001",
  name: "Barangay San Jose",
  municipality: "Bongabong",
  province: "Oriental Mindoro",
  region: "MIMAROPA",
  address: "San Jose, Bongabong, Oriental Mindoro",
  zipCode: "5201",
  contactNumber: "+63 912 345 6789",
  email: "sanjose.bongabong@gmail.com",
  captainName: "Juan Dela Cruz",
  captainContact: "+63 912 345 6789",
  totalPopulation: 2500,
  totalHouseholds: 625,
  totalVoters: 1800,
  landArea: 15.5,
  isActive: true,
  createdAt: "2024-01-15",
  updatedAt: "2024-01-15"
};

// Mock document pricing
const mockDocumentPricing = {
  "Barangay Clearance": 50,
  "Certificate of Residency": 30,
  "Certificate of Indigency": 0,
  "Business Permit": 200,
  "Barangay ID": 25
};

// Mock GCash settings
const mockGCashSettings = {
  gcashNumber: "+63 912 345 6789",
  gcashName: "Juan Dela Cruz",
  isEnabled: true
};

export default function BarangaySettingsPage() {
  const router = useRouter();
  const params = useParams();
  const barangayId = params.id as string;
  
  const [barangay, setBarangay] = useState<Barangay>(mockBarangay);
  const [documentPricing, setDocumentPricing] = useState(mockDocumentPricing);
  const [gcashSettings, setGCashSettings] = useState(mockGCashSettings);
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [generalForm, setGeneralForm] = useState({
    name: barangay.name,
    municipality: barangay.municipality,
    province: barangay.province,
    region: barangay.region,
    address: barangay.address,
    zipCode: barangay.zipCode,
    contactNumber: barangay.contactNumber,
    email: barangay.email,
    captainName: barangay.captainName,
    captainContact: barangay.captainContact,
    isActive: barangay.isActive
  });

  const [statisticsForm, setStatisticsForm] = useState({
    totalPopulation: barangay.totalPopulation,
    totalHouseholds: barangay.totalHouseholds,
    totalVoters: barangay.totalVoters,
    landArea: barangay.landArea
  });

  useEffect(() => {
    // Load barangay data based on ID
    console.log('Loading barangay:', barangayId);
  }, [barangayId]);

  const handleSaveGeneral = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setBarangay(prev => ({ ...prev, ...generalForm }));
      toast({
        title: "Settings Saved",
        description: "General settings have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveStatistics = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setBarangay(prev => ({ ...prev, ...statisticsForm }));
      toast({
        title: "Statistics Updated",
        description: "Barangay statistics have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update statistics. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDocumentPricing = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Pricing Updated",
        description: "Document pricing has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update pricing. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveGCashSettings = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Payment Settings Updated",
        description: "GCash payment settings have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update payment settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => router.push('/barangays')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Barangays
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{barangay.name} Settings</h1>
          <p className="text-muted-foreground">
            Manage settings and configuration for {barangay.name}
          </p>
        </div>
        <Badge variant={barangay.isActive ? "default" : "secondary"}>
          {barangay.isActive ? "Active" : "Inactive"}
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Population</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{barangay.totalPopulation.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total residents</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Households</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{barangay.totalHouseholds.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Registered households</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Voters</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{barangay.totalVoters.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Registered voters</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Land Area</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{barangay.landArea} ha</div>
            <p className="text-xs text-muted-foreground">Total land area</p>
          </CardContent>
        </Card>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General Information</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
          <TabsTrigger value="pricing">Document Pricing</TabsTrigger>
          <TabsTrigger value="payment">Payment Settings</TabsTrigger>
        </TabsList>

        {/* General Information Tab */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Information</CardTitle>
              <CardDescription>
                Update basic information about the barangay
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Barangay Name</Label>
                  <Input
                    id="name"
                    value={generalForm.name}
                    onChange={(e) => setGeneralForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="municipality">Municipality</Label>
                  <Input
                    id="municipality"
                    value={generalForm.municipality}
                    onChange={(e) => setGeneralForm(prev => ({ ...prev, municipality: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="province">Province</Label>
                  <Input
                    id="province"
                    value={generalForm.province}
                    onChange={(e) => setGeneralForm(prev => ({ ...prev, province: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="region">Region</Label>
                  <Input
                    id="region"
                    value={generalForm.region}
                    onChange={(e) => setGeneralForm(prev => ({ ...prev, region: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Complete Address</Label>
                <Input
                  id="address"
                  value={generalForm.address}
                  onChange={(e) => setGeneralForm(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="zipCode">ZIP Code</Label>
                  <Input
                    id="zipCode"
                    value={generalForm.zipCode}
                    onChange={(e) => setGeneralForm(prev => ({ ...prev, zipCode: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactNumber">Contact Number</Label>
                  <Input
                    id="contactNumber"
                    value={generalForm.contactNumber}
                    onChange={(e) => setGeneralForm(prev => ({ ...prev, contactNumber: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={generalForm.email}
                  onChange={(e) => setGeneralForm(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="captainName">Barangay Captain</Label>
                  <Input
                    id="captainName"
                    value={generalForm.captainName}
                    onChange={(e) => setGeneralForm(prev => ({ ...prev, captainName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="captainContact">Captain Contact</Label>
                  <Input
                    id="captainContact"
                    value={generalForm.captainContact}
                    onChange={(e) => setGeneralForm(prev => ({ ...prev, captainContact: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={generalForm.isActive}
                  onCheckedChange={(checked) => setGeneralForm(prev => ({ ...prev, isActive: checked }))}
                />
                <Label htmlFor="isActive">Barangay is Active</Label>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveGeneral} disabled={isLoading}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="statistics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Barangay Statistics</CardTitle>
              <CardDescription>
                Update demographic and statistical information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="totalPopulation">Total Population</Label>
                  <Input
                    id="totalPopulation"
                    type="number"
                    value={statisticsForm.totalPopulation}
                    onChange={(e) => setStatisticsForm(prev => ({ ...prev, totalPopulation: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="totalHouseholds">Total Households</Label>
                  <Input
                    id="totalHouseholds"
                    type="number"
                    value={statisticsForm.totalHouseholds}
                    onChange={(e) => setStatisticsForm(prev => ({ ...prev, totalHouseholds: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="totalVoters">Total Voters</Label>
                  <Input
                    id="totalVoters"
                    type="number"
                    value={statisticsForm.totalVoters}
                    onChange={(e) => setStatisticsForm(prev => ({ ...prev, totalVoters: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="landArea">Land Area (hectares)</Label>
                  <Input
                    id="landArea"
                    type="number"
                    step="0.1"
                    value={statisticsForm.landArea}
                    onChange={(e) => setStatisticsForm(prev => ({ ...prev, landArea: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveStatistics} disabled={isLoading}>
                  <Save className="mr-2 h-4 w-4" />
                  Update Statistics
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Document Pricing Tab */}
        <TabsContent value="pricing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Document Pricing</CardTitle>
              <CardDescription>
                Set prices for barangay documents and certificates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(documentPricing).map(([docType, price]) => (
                <div key={docType} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{docType}</p>
                      <p className="text-sm text-muted-foreground">Document fee</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">₱</span>
                    <Input
                      type="number"
                      value={price}
                      onChange={(e) => setDocumentPricing(prev => ({
                        ...prev,
                        [docType]: parseFloat(e.target.value) || 0
                      }))}
                      className="w-24"
                    />
                  </div>
                </div>
              ))}

              <div className="flex justify-end">
                <Button onClick={handleSaveDocumentPricing} disabled={isLoading}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Pricing
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Settings Tab */}
        <TabsContent value="payment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>GCash Payment Settings</CardTitle>
              <CardDescription>
                Configure GCash payment details for document requests
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <Switch
                  id="gcashEnabled"
                  checked={gcashSettings.isEnabled}
                  onCheckedChange={(checked) => setGCashSettings(prev => ({ ...prev, isEnabled: checked }))}
                />
                <Label htmlFor="gcashEnabled">Enable GCash Payments</Label>
              </div>

              {gcashSettings.isEnabled && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="gcashNumber">GCash Number</Label>
                    <Input
                      id="gcashNumber"
                      value={gcashSettings.gcashNumber}
                      onChange={(e) => setGCashSettings(prev => ({ ...prev, gcashNumber: e.target.value }))}
                      placeholder="+63 912 345 6789"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gcashName">Account Name</Label>
                    <Input
                      id="gcashName"
                      value={gcashSettings.gcashName}
                      onChange={(e) => setGCashSettings(prev => ({ ...prev, gcashName: e.target.value }))}
                      placeholder="Juan Dela Cruz"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end">
                <Button onClick={handleSaveGCashSettings} disabled={isLoading}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Payment Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
