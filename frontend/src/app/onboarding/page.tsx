// frontend/src/app/onboarding/page.tsx
'use client';

import { useUser, useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface OnboardingData {
  // Personal Info
  age: number | '';
  dateOfBirth: string;
  phoneNumber: string;
  
  // Educational Info
  classLevel: string;
  school: string;
  competitiveExam: string;
  
  // Location Info
  country: string;
  state: string;
  city: string;
}

export default function OnboardingPage() {
  const { isLoaded: userLoaded, user } = useUser();
  const { isLoaded: authLoaded, userId } = useAuth();
  const router = useRouter();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState<OnboardingData>({
    age: '',
    dateOfBirth: '',
    phoneNumber: '',
    classLevel: '',
    school: '',
    competitiveExam: 'none',
    country: '',
    state: '',
    city: '',
  });

  // Redirect if not signed in
  useEffect(() => {
    if (authLoaded && !userId) {
      router.push('/auth/sign-in');
    }
  }, [authLoaded, userId, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'age' ? (value ? parseInt(value) : '') : value
    }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.age || !formData.dateOfBirth || !formData.phoneNumber) {
          setError('Please fill in all personal information');
          return false;
        }
        if (formData.age < 5 || formData.age > 100) {
          setError('Please enter a valid age');
          return false;
        }
        break;
      case 2:
        if (!formData.classLevel || !formData.school) {
          setError('Please fill in all educational information');
          return false;
        }
        break;
      case 3:
        if (!formData.country || !formData.state || !formData.city) {
          setError('Please fill in all location information');
          return false;
        }
        break;
    }
    setError('');
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
    setError('');
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;
    
    setIsLoading(true);
    setError('');

    try {
      console.log('Submitting onboarding data:', formData);
      
      // Send to backend
      const response = await fetch('http://localhost:8000/api/v1/auth/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clerk_id: userId,
          age: formData.age,
          date_of_birth: formData.dateOfBirth,
          phone_number: formData.phoneNumber,
          class_level: formData.classLevel,
          school: formData.school,
          competitive_exam: formData.competitiveExam,
          country: formData.country,
          state: formData.state,
          city: formData.city,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Onboarding failed');
      }

      const result = await response.json();
      console.log('Onboarding complete:', result);
      
      // Set cookie to mark onboarding complete
      document.cookie = 'onboarded=true; path=/; max-age=31536000';
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Onboarding error:', error);
      setError(error.message || 'Failed to complete onboarding. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    // For development/testing only
    console.log('Skipping onboarding');
    router.push('/dashboard');
  };

  if (!userLoaded || !authLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-700 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !userId) {
    return null; // Will redirect via useEffect
  }

  const steps = [
    { number: 1, title: 'Personal Info' },
    { number: 2, title: 'Education' },
    { number: 3, title: 'Location' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Complete Your Profile
          </h1>
          <p className="text-gray-600">
            Help us personalize your learning experience
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-between mb-8 max-w-md mx-auto">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center font-semibold
                ${currentStep >= step.number 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-500'}
              `}>
                {step.number}
              </div>
              <div className={`ml-2 ${index === steps.length - 1 ? 'hidden' : 'block'}`}>
                <div className={`w-20 h-1 ${currentStep > step.number ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
              </div>
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold mb-6 text-center">
            {steps[currentStep - 1].title}
          </h2>

          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Age
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    min="5"
                    max="100"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your age"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="+1234567890"
                />
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Welcome, {user.firstName}!</strong> We need this information to create 
                  personalized study plans tailored to your age group.
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Educational Information */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Class/Grade
                </label>
                <input
                  type="text"
                  name="classLevel"
                  value={formData.classLevel}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 10th Grade, Class XII, Freshman"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  School/Institution Name
                </label>
                <input
                  type="text"
                  name="school"
                  value={formData.school}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your school name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preparing for Competitive Exam?
                </label>
                <select
                  name="competitiveExam"
                  value={formData.competitiveExam}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="none">Not preparing for any exam</option>
                  <option value="jee">JEE (Engineering)</option>
                  <option value="neet">NEET (Medical)</option>
                  <option value="cat">CAT (Management)</option>
                  <option value="gate">GATE</option>
                  <option value="upsc">UPSC</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 3: Location Information */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                </label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., United States, India"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State/Province
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., California, Maharashtra"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., San Francisco, Mumbai"
                />
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Almost done!</strong> This helps us provide location-specific 
                  educational content and connect you with local resources.
                </p>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            {currentStep > 1 ? (
              <button
                onClick={handlePrevious}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Previous
              </button>
            ) : (
              <button
                onClick={handleSkip}
                className="px-6 py-2 text-gray-500 hover:text-gray-700"
              >
                Skip for now
              </button>
            )}
            
            {currentStep < 3 ? (
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {isLoading ? 'Completing...' : 'Complete Setup'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}