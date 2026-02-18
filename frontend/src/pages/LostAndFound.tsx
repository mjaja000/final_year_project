import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { PackageSearch, Phone, Car, Loader2, CheckCircle2, ArrowLeft, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

const sendWhatsAppMessage = (phoneNumber: string, itemDescription: string) => {
  // Format phone number for WhatsApp (remove leading 0 and add country code)
  let whatsappNumber = phoneNumber.replace(/^0/, '254').replace(/\D/g, '');
  if (!whatsappNumber.startsWith('254')) {
    whatsappNumber = '254' + whatsappNumber;
  }

  const message = encodeURIComponent(
    `Hello! 👋\n\nThank you for reporting your lost item with MatatuConnect.\n\n📦 *Item:* ${itemDescription}\n\nOur team will actively search for your item and contact you if found. We've logged your report in our system.\n\nStay safe and we hope to help you recover your belongings! ✨`
  );

  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;
  window.open(whatsappUrl, '_blank');
};

export default function LostAndFound() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    itemDescription: '',
    phoneNumber: '',
    vehiclePlate: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);

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
      const response = await api.lostAndFound.createReport(formData);

      if (response.success) {
        setSuccessData(response.data);
        setIsSuccess(true);
        toast.success('Report submitted successfully!');
        
        // Automatically open WhatsApp after a short delay
        setTimeout(() => {
          sendWhatsAppMessage(formData.phoneNumber, formData.itemDescription);
        }, 1000);

        setFormData({
          itemDescription: '',
          phoneNumber: '',
          vehiclePlate: '',
        });
      } else {
        toast.error(response.message || 'Failed to submit report. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendWhatsApp = () => {
    if (successData) {
      sendWhatsAppMessage(formData.phoneNumber || successData.phone_number, successData.item_description);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-semibold mb-8 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Home
          </button>

          {isSuccess ? (
            <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg">
              <CardContent className="pt-12 pb-12">
                <div className="flex flex-col items-center justify-center text-center">
                  <CheckCircle2 className="h-20 w-20 text-green-600 mb-6 animate-bounce" />
                  <h2 className="text-3xl font-bold text-gray-900 mb-3">Report Submitted Successfully! ✓</h2>
                  <p className="text-lg text-gray-600 mb-8 max-w-md">
                    Your lost item report (ID: #{successData?.id}) has been registered in our system. We're actively searching for your item.
                  </p>

                  <div className="bg-white rounded-lg p-6 w-full mb-8 border-l-4 border-green-600">
                    <h3 className="font-semibold text-gray-900 mb-4">📋 Your Report Details:</h3>
                    <div className="space-y-3 text-left">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Item:</span>
                        <span className="font-medium text-gray-900">{successData?.item_description}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Contact:</span>
                        <span className="font-medium text-gray-900">{successData?.phone_number}</span>
                      </div>
                      {successData?.vehicle_plate && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Matatu Plate:</span>
                          <span className="font-medium text-gray-900">{successData.vehicle_plate}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className="font-medium text-yellow-600">Pending</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 w-full">
                    <Button
                      onClick={handleSendWhatsApp}
                      className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-5 text-base font-semibold shadow-lg"
                      size="lg"
                    >
                      <MessageCircle className="h-5 w-5 mr-2" />
                      Get WhatsApp Confirmation
                    </Button>

                    <Button
                      onClick={() => navigate('/')}
                      variant="outline"
                      className="w-full px-6 py-5 text-base"
                      size="lg"
                    >
                      Return to Home
                    </Button>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-8 w-full">
                    <p className="text-sm text-blue-900">
                      <strong>💡 Next Steps:</strong> Our admin team will review your report and contact you if a matching item is found. You can also check our Lost & Found Management dashboard regularly for updates.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-600 rounded-xl">
                    <PackageSearch className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-3xl text-gray-900">Report Lost Item</CardTitle>
                    <CardDescription className="text-base mt-1">
                      Help us find your lost belongings from a matatu ride
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-6">
                    <div className="space-y-2">
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
                        className="resize-none text-base"
                      />
                      <p className="text-sm text-gray-500">
                        Include details like color, brand, unique features, and where on the matatu you think you lost it
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
                      <p className="text-sm text-gray-500">
                        We'll use this to contact you when we find your item or send WhatsApp confirmations
                      </p>
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
                        If you remember the matatu's plate number, it helps us locate your item faster
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-8 py-6 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                      size="lg"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <PackageSearch className="h-5 w-5 mr-2" />
                          Submit Report
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

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-sm font-semibold text-blue-900 mb-1">✓ Quick Process</p>
                      <p className="text-xs text-blue-800">Your report is submitted instantly</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <p className="text-sm font-semibold text-green-900 mb-1">💬 WhatsApp Alert</p>
                      <p className="text-xs text-green-800">Get instant confirmation</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                      <p className="text-sm font-semibold text-purple-900 mb-1">👥 Admin Review</p>
                      <p className="text-xs text-purple-800">Our team actively searches</p>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm text-amber-900">
                      <strong>📌 Important:</strong> Ensure your phone number is correct and enabled for WhatsApp so we can send you immediate confirmation and future updates.
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
