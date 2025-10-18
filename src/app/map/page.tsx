"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '~/components/ui/button';
import { useAbly } from '~/components/AblyProvider';
import { InteractiveMap } from '~/components/ui/interactive-map';

interface Report {
  id: string;
  latitude: number;
  longitude: number;
  location_name: string | null;
  category: string;
  tags: string[];
  severity_level: number;
  description: string;
  createdAt: string;
  user?: {
    name: string | null;
    email: string | null;
  };
}

function Map() {
  const { data: session } = useSession();
  const ably = useAbly();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [realtimeMessages, setRealtimeMessages] = useState<string[]>([]);
  
  // Form state
  const [formData, setFormData] = useState({
    latitude: '',
    longitude: '',
    location_name: '',
    category: 'OTHER',
    tags: '',
    severity_level: '1',
    description: '',
  });

  // Set up real-time subscriptions and fetch initial reports
  useEffect(() => {
    // Create a channel for reports
    const channel = ably.channels.get('reports');

    // Subscribe to new report events
    const onNewReport = (message: any) => {
      const newReport = message.data as Report;
      setReports(prev => [newReport, ...prev]);
      setRealtimeMessages(prev => [...prev, `New report created: ${newReport.location_name || 'Unknown location'} by ${newReport.user?.name || newReport.user?.email || 'Unknown User'}`]);
    };

    // Subscribe to report updates
    const onReportUpdate = (message: any) => {
      const updatedReport = message.data as Report;
      setReports(prev => 
        prev.map(report => 
          report.id === updatedReport.id ? updatedReport : report
        )
      );
      setRealtimeMessages(prev => [...prev, `Report updated: ${updatedReport.location_name || 'Unknown location'}`]);
    };

    // Subscribe to events
    channel.subscribe('report-created', onNewReport);
    channel.subscribe('report-updated', onReportUpdate);

    // Fetch initial reports
    fetchReports();

    // Cleanup subscriptions
    return () => {
      channel.unsubscribe('report-created', onNewReport);
      channel.unsubscribe('report-updated', onReportUpdate);
    };
  }, [ably]);

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/report');
      if (response.ok) {
        const data = await response.json();
        setReports(data);
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user?.id) {
      alert('Please log in to submit a report');
      return;
    }

    setSubmitting(true);
    
    try {
      const response = await fetch('/api/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session.user.id,
          ...formData,
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
        }),
      });

      if (response.ok) {
        // Reset form
        setFormData({
          latitude: '',
          longitude: '',
          location_name: '',
          category: 'OTHER',
          tags: '',
          severity_level: '1',
          description: '',
        });
        
        // No need to manually refresh - real-time will handle it
        setRealtimeMessages(prev => [...prev, 'Report submitted successfully!']);
      } else {
        const error = await response.json();
        alert(`Failed to submit report: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to submit report:', error);
      alert('Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  const getSeverityColor = (level: number) => {
    switch (level) {
      case 1: return 'text-green-600';
      case 2: return 'text-yellow-600';
      case 3: return 'text-orange-600';
      case 4: return 'text-red-600';
      case 5: return 'text-red-800';
      default: return 'text-gray-600';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'EMERGENCY': return 'bg-red-100 text-red-800';
      case 'HAZARD': return 'bg-orange-100 text-orange-800';
      case 'INFRASTRUCTURE': return 'bg-blue-100 text-blue-800';
      case 'ENVIRONMENTAL': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in to access the map</h1>
          <p>You need to be authenticated to view and submit reports.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* Left side - Report Form */}
      <div className="w-1/3 p-6 border-r border-gray-200 overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">Submit Report</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Latitude *</label>
            <input
              type="number"
              step="any"
              name="latitude"
              value={formData.latitude}
              onChange={handleInputChange}
              required
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="e.g. 40.7128"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Longitude *</label>
            <input
              type="number"
              step="any"
              name="longitude"
              value={formData.longitude}
              onChange={handleInputChange}
              required
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="e.g. -74.0060"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Location Name</label>
            <input
              type="text"
              name="location_name"
              value={formData.location_name}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="e.g. Central Park"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Category *</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              required
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="EMERGENCY">Emergency</option>
              <option value="HAZARD">Hazard</option>
              <option value="INFRASTRUCTURE">Infrastructure</option>
              <option value="ENVIRONMENTAL">Environmental</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Severity Level *</label>
            <select
              name="severity_level"
              value={formData.severity_level}
              onChange={handleInputChange}
              required
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="1">1 - Low</option>
              <option value="2">2 - Medium</option>
              <option value="3">3 - High</option>
              <option value="4">4 - Critical</option>
              <option value="5">5 - Severe</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tags</label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="e.g. fire, accident, blocked (comma separated)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={4}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="Describe the incident or issue..."
            />
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full"
          >
            {submitting ? 'Submitting...' : 'Submit Report'}
          </Button>
        </form>
      </div>

      {/* Right side - Interactive Map */}
      <div className="flex-1 flex flex-col">
        {/* Real-time Messages */}
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold mb-2">Real-time Activity</h3>
          <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg max-h-24 overflow-y-auto">
            {realtimeMessages.length === 0 ? (
              <p className="text-sm text-gray-500">No activity yet...</p>
            ) : (
              <div className="space-y-1">
                {realtimeMessages.slice(-3).map((message, index) => (
                  <div key={index} className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="text-xs text-gray-500">{new Date().toLocaleTimeString()}</span> - {message}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Interactive Map */}
        <div className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">Loading map...</div>
            </div>
          ) : (
            <InteractiveMap reports={reports} className="h-full" />
          )}
        </div>
      </div>
    </div>
  );
}

export default Map;