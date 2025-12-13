'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';

interface StaffPerformance {
  name: string;
  orders: number;
  sales: number;
}

export function StaffPerformanceList() {
  const [staff, setStaff] = useState<StaffPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics/staff-performance?days=30&limit=5')
      .then((res) => res.json())
      .then((result) => {
        setStaff(result.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Staff Performance</CardTitle>
          <CardDescription>Last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-gray-500">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (staff.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Staff Performance
          </CardTitle>
          <CardDescription>Last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">No data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Staff Performance
        </CardTitle>
        <CardDescription>Last 30 days</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {staff.map((member, index) => (
            <div key={index} className="flex justify-between items-center">
              <div>
                <p className="font-medium">{member.name}</p>
                <p className="text-sm text-gray-500">
                  {member.orders} orders • ₹{member.sales.toFixed(2)} sales
                </p>
              </div>
              <Badge variant={index === 0 ? 'default' : 'secondary'}>
                #{index + 1}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

