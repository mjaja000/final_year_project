import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { PackageSearch, Phone, Car, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

export default function LostAndFoundForm() {
  const [formData, setFormData] = useState({
    itemDescription: '',
    phoneNumber: '',
    vehiclePlate: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.itemDescription.trim() || !formData.phoneNumber.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${api.baseURL}/lost-and-found/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setIsSuccess(true);
        toast.success('Report submitted successfully! We\'ll contact you soon.');
        setFormData({
          itemDescription: '',
          phoneNumber: '',
          vehiclePlate: '',
        });

        // Reset success state after 5 seconds
        setTimeout(() => setIsSuccess(false), 5000);
      } else {
        toast.error(data.message || 'Failed to submit report. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="lost-and-found" className="animate-fade-in scroll-mt-20">
      <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-600 rounded-xl">
              <PackageSearch className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl sm:text-3xl text-gray-900">
                Lost Something in a Matatu?
              </CardTitle>
              <CardDescription className="text-base mt-1">
                Report your lost item and we'll help you recover it
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle2 className="h-16 w-16 text-green-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Report Submitted Successfully!</h3>
              <p className="text-gray-600 max-w-md">
                We've received your report. Our team will contact you if we find any matching items.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="itemDescription" className="text-base font-medium">
                    Item Description <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="itemDescription"
                    name="itemDescription"
                    placeholder="Describe your lost item in detail (e.g., Black leather wallet with ID cards, Samsung phone with cracked screen)"
                    value={formData.itemDescription}
                    onChange={handleChange}
                    rows={4}
                    required
                    className="resize-none"
                  />
                  <p className="text-sm text-gray-500">
                    Include details like color, brand, unique features, and where you think you lost it
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="text-base font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Your Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    placeholder="0712345678 or +254712345678"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    required
                    className="text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehiclePlate" className="text-base font-medium flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    Vehicle Plate Number (Optional)
                  </Label>
                  <Input
                    id="vehiclePlate"
                    name="vehiclePlate"
                    type="text"
                    placeholder="KAA 123B"
                    value={formData.vehiclePlate}
                    onChange={handleChange}
                    className="text-base uppercase"
                  />
                  <p className="text-sm text-gray-500">
                    If you remember the matatu's plate number
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-6 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Submitting Report...
                    </>
                  ) : (
                    <>
                      <PackageSearch className="h-5 w-5 mr-2" />
                      Submit Lost Item Report
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setFormData({
                      itemDescription: '',
                      phoneNumber: '',
                      vehiclePlate: '',
                    })
                  }
                  className="px-8 py-6 text-base"
                  size="lg"
                >
                  Clear Form
                </Button>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <p className="text-sm text-blue-900">
                  <strong>Note:</strong> We'll do our best to help you locate your item. Please ensure your contact information is correct so we can reach you.
                </p>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
