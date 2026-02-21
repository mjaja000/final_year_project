import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Filter,
  MessageSquare,
  Send,
  TrendingUp,
  User,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

interface Feedback {
  id: number;
  feedback_type: 'Complaint' | 'Compliment';
  comment: string;
  route_name: string;
  vehicle_registration: string;
  created_at: string;
  phone_number?: string;
  report_type?: 'FEEDBACK' | 'INCIDENT' | 'REPORT_TO_NTSA';
  ntsa_priority?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

interface NTSAStats {
  totalComplaints: number;
  byCriticality: {
    CRITICAL: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
  byCategory: Record<string, number>;
  forwardedToNTSA: number;
  handleLocally: number;
}

const getPriorityColor = (priority?: string) => {
  switch (priority) {
    case 'CRITICAL':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'HIGH':
      return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'MEDIUM':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'LOW':
      return 'bg-green-100 text-green-800 border-green-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

const getPriorityIcon = (priority?: string) => {
  switch (priority) {
    case 'CRITICAL':
      return <AlertTriangle className="h-4 w-4" />;
    case 'HIGH':
      return <AlertCircle className="h-4 w-4" />;
    case 'MEDIUM':
      return <Zap className="h-4 w-4" />;
    case 'LOW':
      return <CheckCircle className="h-4 w-4" />;
    default:
      return null;
  }
};

interface FeedbackManagerProps {
  showNTSAOnly?: boolean;
}

export default function FeedbackManager({ showNTSAOnly = false }: FeedbackManagerProps) {
  const [filterType, setFilterType] = useState<'all' | 'complaint' | 'compliment'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [forwardingNotes, setForwardingNotes] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch feedback
  const { data: feedbackList = [], isLoading } = useQuery({
    queryKey: ['admin-feedback', filterType, searchTerm],
    queryFn: async () => {
      const response = await api.feedback.getAll();
      
      // Handle backend response format: { success, feedback: [...], ...}
      let filtered = Array.isArray(response) 
        ? response 
        : Array.isArray(response?.feedback) 
          ? response.feedback 
          : Array.isArray(response?.data)
            ? response.data
            : [];

      if (filterType !== 'all') {
        filtered = filtered.filter(f =>
          filterType === 'complaint' ? f.feedback_type === 'Complaint' : f.feedback_type === 'Compliment'
        );
      }

      if (searchTerm) {
        filtered = filtered.filter(
          f =>
            f.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
            f.route_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            f.vehicle_registration?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      if (showNTSAOnly) {
        filtered = filtered.filter(f => f.ntsa_priority);
      }

      return filtered;
    },
  });

  // Fetch NTSA stats
  const { data: ntsaStats = { totalComplaints: 0, byCriticality: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 }, byCategory: {}, forwardedToNTSA: 0, handleLocally: 0 } } = useQuery({
    queryKey: ['ntsa-stats'],
    queryFn: async () => {
      try {
        const response = await api.feedback.getNTSAStats?.();
        
        // Handle multiple possible response formats
        return response?.stats || response || { 
          totalComplaints: 0, 
          byCriticality: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 }, 
          byCategory: {}, 
          forwardedToNTSA: 0, 
          handleLocally: 0 
        };
      } catch (error) {
        console.error('[NTSA Stats] Error:', error);
        return { 
          totalComplaints: 0, 
          byCriticality: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 }, 
          byCategory: {}, 
          forwardedToNTSA: 0, 
          handleLocally: 0 
        };
      }
    },
    enabled: !showNTSAOnly,
  });

  // Forward to NTSA mutation
  const forwardMutation = useMutation({
    mutationFn: async (feedbackId: number) =>
      api.feedback.forwardToNTSA?.(feedbackId, { additionalInfo: forwardingNotes }),
    onSuccess: () => {
      toast({ title: 'Forwarded to NTSA', description: 'Complaint forwarded successfully.' });
      setSelectedFeedback(null);
      setForwardingNotes('');
      queryClient.invalidateQueries({ queryKey: ['admin-feedback'] });
      queryClient.invalidateQueries({ queryKey: ['ntsa-stats'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Forward failed',
        description: error.message || 'Unable to forward to NTSA',
        variant: 'destructive',
      });
    },
  });

  // Send WhatsApp mutation
  const sendWhatsAppMutation = useMutation({
    mutationFn: async (feedbackId: number) => {
      const phoneNumber = selectedFeedback?.phone_number;
      return fetch(`/api/feedback/admin/whatsapp/${feedbackId}/${phoneNumber}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }).then((res) => res.json());
    },
    onSuccess: () => {
      toast({ title: 'WhatsApp Sent', description: 'Feedback summary sent via WhatsApp.' });
    },
    onError: (error: any) => {
      toast({
        title: 'Send failed',
        description: error.message || 'Unable to send WhatsApp',
        variant: 'destructive',
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Loading feedback...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      {ntsaStats && !showNTSAOnly && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-red-700 font-semibold">Critical</p>
                <p className="text-2xl font-bold text-red-900">{ntsaStats.byCriticality.CRITICAL}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600 opacity-50" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-orange-700 font-semibold">High</p>
                <p className="text-2xl font-bold text-orange-900">{ntsaStats.byCriticality.HIGH}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-600 opacity-50" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-yellow-700 font-semibold">Medium</p>
                <p className="text-2xl font-bold text-yellow-900">{ntsaStats.byCriticality.MEDIUM}</p>
              </div>
              <Zap className="h-8 w-8 text-yellow-600 opacity-50" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-700 font-semibold">To NTSA</p>
                <p className="text-2xl font-bold text-blue-900">{ntsaStats.forwardedToNTSA}</p>
              </div>
              <Send className="h-8 w-8 text-blue-600 opacity-50" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          placeholder="Search by comment, route, or vehicle..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as any)}
          className="rounded-md border px-3 py-2 text-sm"
        >
          <option value="all">All Types</option>
          <option value="complaint">Complaints Only</option>
          <option value="compliment">Compliments Only</option>
        </select>
      </div>

      {/* Feedback List */}
      <div className="space-y-3">
        {feedbackList.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No feedback found</p>
          </div>
        ) : (
          feedbackList.map((feedback) => (
            <div
              key={feedback.id}
              className={cn(
                'p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md',
                selectedFeedback?.id === feedback.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              )}
              onClick={() => setSelectedFeedback(feedback)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={cn(
                        'px-2 py-1 rounded-full text-xs font-bold border',
                        feedback.feedback_type === 'Complaint'
                          ? 'bg-red-100 text-red-800 border-red-300'
                          : 'bg-green-100 text-green-800 border-green-300'
                      )}
                    >
                      {feedback.feedback_type}
                    </span>
                    {feedback.ntsa_priority && (
                      <span className={cn('px-2 py-1 rounded-full text-xs font-bold border flex items-center gap-1', getPriorityColor(feedback.ntsa_priority))}>
                        {getPriorityIcon(feedback.ntsa_priority)}
                        {feedback.ntsa_priority}
                      </span>
                    )}
                    {feedback.report_type && (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-300">
                        {feedback.report_type}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-900 font-medium">{feedback.comment.substring(0, 100)}...</p>
                  <div className="flex items-center gap-4 text-xs text-gray-600 mt-2">
                    <span>📍 {feedback.route_name}</span>
                    <span>🚗 {feedback.vehicle_registration}</span>
                    <span>📞 {feedback.phone_number || 'N/A'}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">ID: {feedback.id}</p>
                </div>
                <User className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Panel */}
      {selectedFeedback && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <h3 className="text-lg font-bold">Feedback Details - ID #{selectedFeedback.id}</h3>
            </div>

            <div className="p-6 space-y-4">
              {/* Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600 font-semibold">Type</p>
                  <p className="text-sm font-medium">{selectedFeedback.feedback_type}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-semibold">Route</p>
                  <p className="text-sm font-medium">{selectedFeedback.route_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-semibold">Vehicle</p>
                  <p className="text-sm font-medium">{selectedFeedback.vehicle_registration}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-semibold">Contact</p>
                  <p className="text-sm font-medium">{selectedFeedback.phone_number || 'N/A'}</p>
                </div>
                {selectedFeedback.report_type && (
                  <div>
                    <p className="text-xs text-gray-600 font-semibold">Report Type</p>
                    <p className="text-sm font-medium">{selectedFeedback.report_type}</p>
                  </div>
                )}
                {selectedFeedback.ntsa_priority && (
                  <div>
                    <p className="text-xs text-gray-600 font-semibold">NTSA Priority</p>
                    <p className={cn('text-sm font-bold', getPriorityColor(selectedFeedback.ntsa_priority))}>
                      {selectedFeedback.ntsa_priority}
                    </p>
                  </div>
                )}
              </div>

              {/* Full Comment */}
              <div>
                <p className="text-xs text-gray-600 font-semibold mb-2">Full Comment</p>
                <div className="bg-gray-50 p-3 rounded text-sm whitespace-pre-wrap">{selectedFeedback.comment}</div>
              </div>

              {/* NTSA Forwarding (for complaints) */}
              {selectedFeedback.feedback_type === 'Complaint' && (
                <div className="space-y-3 p-4 bg-red-50 rounded-lg border border-red-200">
                  <h4 className="font-semibold text-sm text-red-900">Forward to NTSA</h4>
                  <Textarea
                    placeholder="Add any additional notes for NTSA (optional)..."
                    value={forwardingNotes}
                    onChange={(e) => setForwardingNotes(e.target.value)}
                    rows={3}
                    className="text-sm"
                  />
                  <Button
                    onClick={() => forwardMutation.mutate(selectedFeedback.id)}
                    disabled={forwardMutation.isPending}
                    className="w-full bg-red-600 hover:bg-red-700"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Forward to NTSA
                  </Button>
                </div>
              )}

              {/* Send WhatsApp notification */}
              {selectedFeedback.phone_number && (
                <div className="space-y-3 p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-sm text-green-900">Send WhatsApp Notification</h4>
                  <p className="text-xs text-green-800">
                    Send feedback summary to customer via WhatsApp
                  </p>
                  <Button
                    onClick={() => sendWhatsAppMutation.mutate(selectedFeedback.id)}
                    disabled={sendWhatsAppMutation.isPending}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send WhatsApp
                  </Button>
                </div>
              )}

              {/* Admin Notes */}
              <div>
                <p className="text-xs text-gray-600 font-semibold mb-2">Admin Notes</p>
                <Textarea placeholder="Add internal notes..." value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={3} />
              </div>
            </div>

            {/* Close Button */}
            <div className="p-6 border-t flex gap-2">
              <Button variant="outline" onClick={() => setSelectedFeedback(null)} className="flex-1">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
