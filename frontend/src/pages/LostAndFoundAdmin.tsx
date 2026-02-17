import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PackageSearch, Phone, Car, Calendar, Filter, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { format } from 'date-fns';

interface LostItem {
  id: number;
  item_description: string;
  phone_number: string;
  vehicle_plate: string | null;
  status: 'pending' | 'found' | 'resolved' | 'closed';
  admin_notes: string | null;
  user_name: string | null;
  user_email: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

interface Stats {
  total_reports: string;
  pending: string;
  found: string;
  resolved: string;
  closed: string;
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  found: 'bg-blue-100 text-blue-800 border-blue-300',
  resolved: 'bg-green-100 text-green-800 border-green-300',
  closed: 'bg-gray-100 text-gray-800 border-gray-300',
};

const statusLabels = {
  pending: 'Pending',
  found: 'Found',
  resolved: 'Resolved',
  closed: 'Closed',
};

export default function LostAndFoundAdmin() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<LostItem | null>(null);
  const [updateStatus, setUpdateStatus] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const queryClient = useQueryClient();

  // Fetch lost and found reports
  const { data: reports, isLoading } = useQuery<LostItem[]>({
    queryKey: ['lostAndFound', statusFilter, searchTerm],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchTerm) params.append('searchTerm', searchTerm);

      const response = await fetch(`${api.baseURL}/lost-and-found?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      return data.data || [];
    },
  });

  // Fetch stats
  const { data: stats } = useQuery<Stats>({
    queryKey: ['lostAndFoundStats'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch(`${api.baseURL}/lost-and-found/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      return data.data;
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: number; status: string; notes: string }) => {
      const token = localStorage.getItem('token');
      const response = await fetch(`${api.baseURL}/lost-and-found/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, adminNotes: notes }),
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lostAndFound'] });
      queryClient.invalidateQueries({ queryKey: ['lostAndFoundStats'] });
      toast.success('Status updated successfully');
      setSelectedItem(null);
      setAdminNotes('');
      setUpdateStatus('');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update status');
    },
  });

  const handleUpdateStatus = () => {
    if (!selectedItem || !updateStatus) return;
    updateStatusMutation.mutate({
      id: selectedItem.id,
      status: updateStatus,
      notes: adminNotes,
    });
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <PackageSearch className="h-8 w-8 text-orange-600" />
              Lost & Found Management
            </h1>
            <p className="text-gray-600 mt-2">Manage reported lost items and help reunite passengers with their belongings</p>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Reports</CardDescription>
                  <CardTitle className="text-3xl">{stats.total_reports}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Pending</CardDescription>
                  <CardTitle className="text-3xl text-yellow-600">{stats.pending}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Found</CardDescription>
                  <CardTitle className="text-3xl text-blue-600">{stats.found}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Resolved</CardDescription>
                  <CardTitle className="text-3xl text-green-600">{stats.resolved}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Closed</CardDescription>
                  <CardTitle className="text-3xl text-gray-600">{stats.closed}</CardTitle>
                </CardHeader>
              </Card>
            </div>
          )}

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                <CardTitle>Filters</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="search">Search</Label>
                  <Input
                    id="search"
                    placeholder="Search by item description or plate number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="w-full sm:w-48">
                  <Label htmlFor="status">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="found">Found</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reports Table */}
          <Card>
            <CardHeader>
              <CardTitle>Lost Item Reports</CardTitle>
              <CardDescription>
                {reports?.length || 0} report{reports?.length !== 1 ? 's' : ''} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : reports && reports.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Item Description</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reports.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              {format(new Date(item.created_at), 'MMM dd, yyyy')}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <p className="text-sm line-clamp-2">{item.item_description}</p>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-4 w-4 text-gray-400" />
                              {item.phone_number}
                            </div>
                            {item.user_name && (
                              <p className="text-xs text-gray-500 mt-1">{item.user_name}</p>
                            )}
                          </TableCell>
                          <TableCell>
                            {item.vehicle_plate ? (
                              <div className="flex items-center gap-2 text-sm">
                                <Car className="h-4 w-4 text-gray-400" />
                                {item.vehicle_plate}
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">N/A</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={statusColors[item.status]}>
                              {statusLabels[item.status]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedItem(item);
                                    setUpdateStatus(item.status);
                                    setAdminNotes(item.admin_notes || '');
                                  }}
                                >
                                  Manage
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Manage Lost Item Report #{item.id}</DialogTitle>
                                  <DialogDescription>
                                    Update the status and add notes for this report
                                  </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-4 py-4">
                                  <div className="space-y-2">
                                    <Label>Item Description</Label>
                                    <p className="text-sm bg-gray-50 p-3 rounded-lg">{item.item_description}</p>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label>Contact Number</Label>
                                      <p className="text-sm bg-gray-50 p-3 rounded-lg">{item.phone_number}</p>
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Vehicle Plate</Label>
                                      <p className="text-sm bg-gray-50 p-3 rounded-lg">
                                        {item.vehicle_plate || 'Not provided'}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor="status-update">Update Status</Label>
                                    <Select value={updateStatus} onValueChange={setUpdateStatus}>
                                      <SelectTrigger id="status-update">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="found">Found</SelectItem>
                                        <SelectItem value="resolved">Resolved</SelectItem>
                                        <SelectItem value="closed">Closed</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor="admin-notes">Admin Notes</Label>
                                    <Textarea
                                      id="admin-notes"
                                      value={adminNotes}
                                      onChange={(e) => setAdminNotes(e.target.value)}
                                      placeholder="Add notes about this case..."
                                      rows={4}
                                    />
                                  </div>

                                  {item.admin_notes && item.admin_notes !== adminNotes && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                      <Label className="text-sm font-medium text-blue-900">Previous Notes:</Label>
                                      <p className="text-sm text-blue-800 mt-1">{item.admin_notes}</p>
                                    </div>
                                  )}

                                  <div className="flex gap-3 pt-4">
                                    <Button
                                      onClick={handleUpdateStatus}
                                      disabled={updateStatusMutation.isPending}
                                      className="flex-1"
                                    >
                                      {updateStatusMutation.isPending ? (
                                        <>
                                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                          Updating...
                                        </>
                                      ) : (
                                        <>
                                          <CheckCircle className="h-4 w-4 mr-2" />
                                          Update Status
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600 font-medium">No reports found</p>
                  <p className="text-gray-500 text-sm mt-1">Try adjusting your filters or check back later</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
