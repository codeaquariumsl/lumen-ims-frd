'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Settings, Save, Upload } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { useAuth } from '@/lib/auth/auth-context';

export default function SettingsPage() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    companyName: 'Optical Vision Care',
    ownerName: 'Raj Kumar',
    email: 'info@optical.com',
    phone: '+91-9876543210',
    alternatePhone: '+91-9876543211',
    website: 'www.optical.com',
    address: '123 Main Street, Medical Complex',
    city: 'Mumbai',
    state: 'Maharashtra',
    postalCode: '400001',
    country: 'India',
    taxRegistrationNumber: 'AAAAR0001K1Z5',
    gstNumber: '27AABTU1234H1Z0',
    businessRegistration: 'BR-12345-67890',
    bankAccountName: 'Optical Vision Care',
    bankName: 'State Bank of India',
    accountNumber: '3456789012345678',
    ifscCode: 'SBIN0000001',
    swiftCode: 'SBININBB001',
  });

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Load from cache (user.companyDetails) if available
    if (user?.companyDetails) {
      setFormData((prev) => ({
        ...prev,
        ...user.companyDetails
      }));
    }
    
    // Optionally fetch latest settings
    const fetchSettings = async () => {
      try {
        const response = await apiClient.get('/settings');
        if (response.data?.success && response.data?.data?.settings) {
          setFormData((prev) => ({
            ...prev,
            ...response.data.data.settings
          }));
        }
      } catch (err) {
        console.error('Failed to load settings', err);
      }
    };
    fetchSettings();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await apiClient.post('/settings', formData);
      
      // Update local storage user cache if needed
      const storedUser = localStorage.getItem('optical_user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        parsedUser.companyDetails = formData;
        localStorage.setItem('optical_user', JSON.stringify(parsedUser));
      }
      
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 3000);
    } catch (error) {
      console.error('Error saving settings', error);
      alert('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 p-8 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Company Settings</h1>
            <p className="mt-2 text-purple-100">Configure company details, branding, and business information</p>
          </div>
          <Settings size={40} className="text-purple-200" />
        </div>
      </div>

      {/* Success Message */}
      {savedMessage && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-green-800">
          <p className="font-medium">Settings saved successfully!</p>
        </div>
      )}

      {/* Basic Information */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-bold">1</span>
          Basic Information
        </h2>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Company Name</label>
            <Input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleInputChange}
              placeholder="Company name"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Owner Name</label>
            <Input
              type="text"
              name="ownerName"
              value={formData.ownerName}
              onChange={handleInputChange}
              placeholder="Owner name"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
            <Input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Email"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Primary Phone</label>
            <Input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="Phone number"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Alternate Phone</label>
            <Input
              type="tel"
              name="alternatePhone"
              value={formData.alternatePhone}
              onChange={handleInputChange}
              placeholder="Alternate phone"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Website</label>
            <Input
              type="text"
              name="website"
              value={formData.website}
              onChange={handleInputChange}
              placeholder="Website URL"
            />
          </div>
        </div>
      </Card>

      {/* Company Logo */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-bold">2</span>
          Company Logo & Branding
        </h2>

        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Upload Logo</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-600 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
                id="logo-upload"
              />
              <label htmlFor="logo-upload" className="cursor-pointer">
                <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                <p className="text-sm font-medium text-gray-700">Click to upload logo</p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF (Max 5MB)</p>
              </label>
            </div>
          </div>

          {logoPreview && (
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-700 mb-3">Logo Preview</p>
              <div className="bg-gray-100 rounded-lg p-6 flex items-center justify-center h-48">
                <img src={logoPreview} alt="Logo preview" className="max-h-40 max-w-full" />
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Address Information */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-bold">3</span>
          Address Information
        </h2>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Street Address</label>
            <Input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="Street address"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
            <Input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              placeholder="City"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
            <Input
              type="text"
              name="state"
              value={formData.state}
              onChange={handleInputChange}
              placeholder="State"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Postal Code</label>
            <Input
              type="text"
              name="postalCode"
              value={formData.postalCode}
              onChange={handleInputChange}
              placeholder="Postal code"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
            <Input
              type="text"
              name="country"
              value={formData.country}
              onChange={handleInputChange}
              placeholder="Country"
            />
          </div>
        </div>
      </Card>

      {/* Tax & Business Information */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-bold">4</span>
          Tax & Business Information
        </h2>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Tax Registration Number</label>
            <Input
              type="text"
              name="taxRegistrationNumber"
              value={formData.taxRegistrationNumber}
              onChange={handleInputChange}
              placeholder="Tax registration number"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">GST Registration Number</label>
            <Input
              type="text"
              name="gstNumber"
              value={formData.gstNumber}
              onChange={handleInputChange}
              placeholder="GST registration number"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Business Registration</label>
            <Input
              type="text"
              name="businessRegistration"
              value={formData.businessRegistration}
              onChange={handleInputChange}
              placeholder="Business registration number"
            />
          </div>
        </div>
      </Card>

      {/* Bank Information */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-bold">5</span>
          Bank Account Information
        </h2>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Account Holder Name</label>
            <Input
              type="text"
              name="bankAccountName"
              value={formData.bankAccountName}
              onChange={handleInputChange}
              placeholder="Account holder name"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Bank Name</label>
            <Input
              type="text"
              name="bankName"
              value={formData.bankName}
              onChange={handleInputChange}
              placeholder="Bank name"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Account Number</label>
            <Input
              type="text"
              name="accountNumber"
              value={formData.accountNumber}
              onChange={handleInputChange}
              placeholder="Account number"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">IFSC Code</label>
            <Input
              type="text"
              name="ifscCode"
              value={formData.ifscCode}
              onChange={handleInputChange}
              placeholder="IFSC code"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">SWIFT Code</label>
            <Input
              type="text"
              name="swiftCode"
              value={formData.swiftCode}
              onChange={handleInputChange}
              placeholder="SWIFT code"
            />
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex gap-3 justify-end">
        <Button variant="outline">Cancel</Button>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2 bg-purple-600 hover:bg-purple-700 text-white">
          <Save size={20} />
          {isSaving ? 'Saving...' : 'Save All Changes'}
        </Button>
      </div>
    </div>
  );
}
