'use client';

import { WelcomeBanner } from '@/components/dashboard/welcome-banner';
import { KpiCards } from '@/components/dashboard/kpi-cards';
import { OverviewChart } from '@/components/dashboard/overview-chart';
import { RecentActivityTimeline } from '@/components/dashboard/recent-activity-timeline';
import { PendingRequestsTable } from '@/components/dashboard/pending-requests-table';
import { UpcomingEventsCard } from '@/components/dashboard/upcoming-events-card';

export function SecretaryDashboardView() {
  return (
    <div className="space-y-5 md:space-y-6 max-w-7xl mx-auto">
      {/* 1. Welcome Banner */}
      <WelcomeBanner />

      {/* 2. Four Statistics Cards */}
      <KpiCards />

      {/* 3. Middle Grid: Barangay Overview (60%) & Recent Activity (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 xl:col-span-8">
          <OverviewChart />
        </div>
        <div className="lg:col-span-5 xl:col-span-4">
          <RecentActivityTimeline />
        </div>
      </div>

      {/* 4. Bottom Grid: Pending Document Requests (60%) & Upcoming Events (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 xl:col-span-8">
          <PendingRequestsTable />
        </div>
        <div className="lg:col-span-5 xl:col-span-4">
          <UpcomingEventsCard />
        </div>
      </div>
    </div>
  );
}

