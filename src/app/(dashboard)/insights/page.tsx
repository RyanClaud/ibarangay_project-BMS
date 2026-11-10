'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { generateInsightsAction, generateCustomReportAction } from '@/app/actions/ai-actions';
import { Loader2, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppContext } from '@/contexts/app-context';
import { generatePdf, generateExcel } from '@/lib/reports';

const customReportSchema = z.object({
  reportTitle: z.string().min(5, 'Title must be at least 5 characters long.'),
  reportParameters: z.string().optional(),
  reportDescription: z.string().min(20, 'Description must be at least 20 characters long.'),
  reportFormat: z.enum(['PDF', 'Excel']),
});

export default function InsightsPage() {
  const [insights, setInsights] = useState<string | null>(null);
  const [reportSummary, setReportSummary] = useState<string | null>(null);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const { residents, documentRequests } = useAppContext();

  const form = useForm<z.infer<typeof customReportSchema>>({
    resolver: zodResolver(customReportSchema),
    defaultValues: {
      reportTitle: '',
      reportParameters: '{}',
      reportDescription: '',
      reportFormat: 'PDF',
    },
  });

  const handleGenerateInsights = async () => {
    setIsGeneratingInsights(true);
    setInsights(null);
    if (!residents || !documentRequests) {
      toast({ title: 'Data not loaded yet. Please try again in a moment.', variant: 'destructive'});
      setIsGeneratingInsights(false);
      return;
    }

    try {
      const residentData = JSON.stringify(residents);
      const documentRequestData = JSON.stringify(documentRequests);
      const result = await generateInsightsAction(residentData, documentRequestData);
      setInsights(result.insights);
      toast({ title: 'Insights Generated Successfully' });
    } catch (error) {
      console.error("Insight generation error:", error);
      let description = 'An unexpected error occurred while contacting the AI service.';
      if (error instanceof Error && error.message.includes('UND_ERR_CONNECT_TIMEOUT')) {
        description = 'Connection timed out. Please check your internet connection and firewall settings.';
      } else if (error instanceof Error) {
        description = error.message;
      }
      toast({ title: 'Error Generating Insights', description, variant: 'destructive' });
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  const onCustomReportSubmit = async (values: z.infer<typeof customReportSchema>) => {
    setIsGeneratingReport(true);
    setReportSummary(null);
    try {
      if (!residents || !documentRequests) {
        toast({ title: 'Data not loaded yet. Please try again in a moment.', variant: 'destructive'});
        setIsGeneratingReport(false);
        return;
      }
      const residentData = JSON.stringify(residents);
      const documentRequestData = JSON.stringify(documentRequests);

      const result = await generateCustomReportAction({
        ...values,
        reportParameters: values.reportParameters || '{}',
        residentData,
        documentRequestData,
      });
      const { reportSummary, reportData } = result;
      setReportSummary(reportSummary);

      // Generate and trigger the download from structured data
      const format = values.reportFormat.toLowerCase();
      const fileName = `${values.reportTitle.replace(/ /g, '_')}.${format}`;

      if (format === 'pdf') {
        generatePdf(reportData.title, [reportData.headers], reportData.rows, fileName);
      } else {
        generateExcel([reportData.headers, ...reportData.rows], fileName);
      }

      toast({ title: 'Custom Report Generated Successfully' });
    } catch (error) {
      console.error("Custom report error:", error);
      let description = 'An unexpected error occurred while contacting the AI service.';
      if (error instanceof Error && error.message.includes('UND_ERR_CONNECT_TIMEOUT')) {
        description = 'Connection timed out. Please check your internet connection and firewall settings.';
      } else if (error instanceof Error) {
        description = error.message;
      }
      toast({ title: 'Error Generating Custom Report', description, variant: 'destructive' });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#172B4D]">
          AI-Powered Analytics &amp; Reports
        </h1>
        <p className="text-sm text-[#718096] mt-1">
          Leverage AI to analyze demographic trends and generate on-demand custom reports.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Card 1: Barangay Data Analysis */}
        <div className="rounded-2xl border border-[#E5EAF2] bg-white shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-6 border-b border-[#E5EAF2] bg-[#F8FAFC]">
              <h3 className="flex items-center gap-2 text-lg font-bold text-[#172B4D]">
                <Sparkles className="size-5 text-[#246BDE]" />
                Barangay Data Analysis
              </h3>
              <p className="text-xs sm:text-sm text-[#718096] mt-1">
                Analyze resident demographics and document request patterns with AI.
              </p>
            </div>
            <div className="p-6 min-h-[220px]">
              {isGeneratingInsights ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-3/4 rounded-md" />
                  <Skeleton className="h-4 w-full rounded-md" />
                  <Skeleton className="h-4 w-5/6 rounded-md" />
                  <Skeleton className="h-4 w-1/2 rounded-md" />
                </div>
              ) : insights ? (
                <div className="prose prose-sm max-w-none text-[#172B4D] leading-relaxed">{insights}</div>
              ) : (
                <div className="text-center text-xs text-[#718096] p-8 border border-dashed border-[#E5EAF2] rounded-xl bg-[#F8FAFC]">
                  Click &quot;Generate Insights&quot; to begin AI analysis of current barangay records.
                </div>
              )}
            </div>
          </div>
          <div className="p-4 bg-[#F8FAFC] border-t border-[#E5EAF2]">
            <Button 
              onClick={handleGenerateInsights} 
              disabled={isGeneratingInsights} 
              className="bg-[#246BDE] hover:bg-[#1E5CC0] text-white rounded-xl shadow-xs font-semibold text-xs h-10 px-5"
            >
              {isGeneratingInsights ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Sparkles className="mr-2 size-4" />}
              {isGeneratingInsights ? 'Analyzing Records...' : 'Generate Insights'}
            </Button>
          </div>
        </div>

        {/* Card 2: Custom Report Generator */}
        <div className="rounded-2xl border border-[#E5EAF2] bg-white shadow-sm overflow-hidden">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onCustomReportSubmit)}>
              <div className="p-6 border-b border-[#E5EAF2] bg-[#F8FAFC]">
                <h3 className="flex items-center gap-2 text-lg font-bold text-[#172B4D]">
                  <Sparkles className="size-5 text-[#246BDE]" />
                  Custom Report Generator
                </h3>
                <p className="text-xs sm:text-sm text-[#718096] mt-1">
                  Define parameters to synthesize and download a custom AI report.
                </p>
              </div>
              <div className="p-6 space-y-4">
                <FormField control={form.control} name="reportTitle" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-[#172B4D]">Report Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Q4 Document Issuance & Demographics" className="h-10 rounded-xl border-[#E2E8F0] bg-[#F0F4FA] text-sm text-[#172B4D] placeholder-[#718096] focus:bg-white focus:border-[#246BDE]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="reportDescription" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-[#172B4D]">Report Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe the focus or specific data summary needed..." className="rounded-xl border-[#E2E8F0] bg-[#F0F4FA] text-sm text-[#172B4D] placeholder-[#718096] focus:bg-white focus:border-[#246BDE] min-h-[80px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="reportFormat" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-[#172B4D]">Download Format</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-10 rounded-xl border-[#E2E8F0] bg-[#F0F4FA] text-sm text-[#172B4D] focus:bg-white focus:border-[#246BDE]">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-xl border-[#E5EAF2]">
                        <SelectItem value="PDF" className="text-xs rounded-lg cursor-pointer">PDF Document (.pdf)</SelectItem>
                        <SelectItem value="Excel" className="text-xs rounded-lg cursor-pointer">Excel Spreadsheet (.xlsx)</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                {reportSummary && (
                  <div className="text-xs text-[#172B4D] border-t border-[#E5EAF2] pt-3 leading-relaxed">{reportSummary}</div>
                )}
                {isGeneratingReport && (
                  <div className="space-y-2 pt-3 border-t border-[#E5EAF2]">
                    <Skeleton className="h-4 w-1/4 rounded-md" />
                    <Skeleton className="h-4 w-full rounded-md" />
                    <Skeleton className="h-4 w-3/4 rounded-md" />
                  </div>
                )}
              </div>
              <div className="p-4 bg-[#F8FAFC] border-t border-[#E5EAF2]">
                <Button 
                  type="submit" 
                  disabled={isGeneratingReport} 
                  className="bg-[#246BDE] hover:bg-[#1E5CC0] text-white rounded-xl shadow-xs font-semibold text-xs h-10 px-5"
                >
                  {isGeneratingReport ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Sparkles className="mr-2 size-4" />}
                  {isGeneratingReport ? 'Compiling Report...' : 'Generate & Download Report'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
