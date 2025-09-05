// frontend/src/app/onboarding/page.tsx
'use client';

import { useUser, useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { authService } from '@/lib/api/auth.service';
import { showToast } from '@/lib/toast';

interface OnboardingFormData {
  // Step 1: Personal Info
  firstName: string;
  lastName: string;
  age: string;
  dateOfBirth: string;
  
  // Step 2: Educational Info
  phoneNumber: string;
  classLevel: string;
  school: string;
  competitiveExam: string;
  
  // Step 3: Location Info
  country: string;
  state: string;
  city: string;
}

interface FormErrors {
  [key: string]: string;
}

export default function OnboardingPage() {
  const { isLoaded: userLoaded, user } = useUser();
  const { isLoaded: authLoaded, userId } = useAuth();
  const router = useRouter();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  
  const [formData, setFormData] = useState<OnboardingFormData>({
    firstName: '',
    lastName: '',
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

  // Pre-fill user data from Clerk
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
      }));
    }
  }, [user]);

  // Redirect if not signed in
  useEffect(() => {
    if (authLoaded && !userId) {
      router.push('/auth/sign-in');
    }
  }, [authLoaded, userId, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: FormErrors = {};

    switch (step) {
      case 1:
        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
        if (!formData.age || parseInt(formData.age) < 5 || parseInt(formData.age) > 100) {
          newErrors.age = 'Please enter a valid age between 5 and 100';
        }
        if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
        break;
      
      case 2:
        if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required';
        if (formData.phoneNumber && !/^[+]?[0-9]{10,15}$/.test(formData.phoneNumber.replace(/\s/g, ''))) {
          newErrors.phoneNumber = 'Please enter a valid phone number';
        }
        if (!formData.classLevel) newErrors.classLevel = 'Class level is required';
        if (!formData.school.trim()) newErrors.school = 'School name is required';
        if (!formData.competitiveExam) newErrors.competitiveExam = 'Please select an option';
        break;
      
      case 3:
        if (!formData.country.trim()) newErrors.country = 'Country is required';
        if (!formData.state.trim()) newErrors.state = 'State is required';
        if (!formData.city.trim()) newErrors.city = 'City is required';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSkip = () => {
    router.push('/dashboard');
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep) || !userId) return;

    setIsSubmitting(true);
    try {
      const onboardingData = {
        clerk_id: userId,
        age: parseInt(formData.age),
        date_of_birth: formData.dateOfBirth,
        phone_number: formData.phoneNumber,
        class_level: formData.classLevel,
        school: formData.school,
        competitive_exam: formData.competitiveExam,
        country: formData.country,
        state: formData.state,
        city: formData.city,
      };

      await authService.completeOnboarding(onboardingData);
      
      showToast.success('Profile completed successfully!');
      router.push('/dashboard');
    } catch (error) {
      console.error('Onboarding error:', error);
      showToast.error('Failed to complete profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { number: 1, title: 'Personal Info', icon: '👤' },
    { number: 2, title: 'Education', icon: '🎓' },
    { number: 3, title: 'Location', icon: '📍' },
  ];

  const classLevels = [
    { value: '', label: 'Select your class' },
    { value: '8', label: 'Class 8' },
    { value: '9', label: 'Class 9' },
    { value: '10', label: 'Class 10' },
    { value: '11', label: 'Class 11' },
    { value: '12', label: 'Class 12' },
    { value: 'undergraduate', label: 'Undergraduate' },
    { value: 'postgraduate', label: 'Postgraduate' },
    { value: 'other', label: 'Other' },
  ];

  const competitiveExams = [
    { value: 'none', label: 'Not preparing for any' },
    { value: 'jee', label: 'JEE (Engineering)' },
    { value: 'neet', label: 'NEET (Medical)' },
    { value: 'cat', label: 'CAT (MBA)' },
    { value: 'gate', label: 'GATE' },
    { value: 'upsc', label: 'UPSC (Civil Services)' },
    { value: 'banking', label: 'Banking Exams' },
    { value: 'ssc', label: 'SSC' },
    { value: 'other', label: 'Other' },
  ];

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
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
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
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center font-semibold text-lg
                    ${currentStep >= step.number 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-500'}
                  `}>
                    <span className="text-xl">{step.icon}</span>
                  </div>
                  <span className={`mt-2 text-sm ${currentStep >= step.number ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-4 ${currentStep > step.number ? 'bg-blue-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm p-8">
          {/* Step 1: Personal Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Personal Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.firstName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="John"
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.lastName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Doe"
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Age *
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    min="5"
                    max="100"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.age ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="18"
                  />
                  {errors.age && (
                    <p className="mt-1 text-sm text-red-600">{errors.age}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.dateOfBirth && (
                    <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Educational Info */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Educational Information</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="+91 98765 43210"
                />
                {errors.phoneNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class/Level *
                </label>
                <select
                  name="classLevel"
                  value={formData.classLevel}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.classLevel ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  {classLevels.map(level => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
                {errors.classLevel && (
                  <p className="mt-1 text-sm text-red-600">{errors.classLevel}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  School/Institution Name *
                </label>
                <input
                  type="text"
                  name="school"
                  value={formData.school}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.school ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your school or college name"
                />
                {errors.school && (
                  <p className="mt-1 text-sm text-red-600">{errors.school}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preparing for Competitive Exam? *
                </label>
                <select
                  name="competitiveExam"
                  value={formData.competitiveExam}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.competitiveExam ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  {competitiveExams.map(exam => (
                    <option key={exam.value} value={exam.value}>
                      {exam.label}
                    </option>
                  ))}
                </select>
                {errors.competitiveExam && (
                  <p className="mt-1 text-sm text-red-600">{errors.competitiveExam}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Location Info */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Location Information</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country *
                </label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.country ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="India"
                />
                {errors.country && (
                  <p className="mt-1 text-sm text-red-600">{errors.country}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State *
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.state ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Maharashtra"
                />
                {errors.state && (
                  <p className="mt-1 text-sm text-red-600">{errors.state}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.city ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Mumbai"
                />
                {errors.city && (
                  <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                )}
              </div>

              {/* Summary Preview */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Profile Summary</h3>
                <p className="text-sm text-blue-700">
                  <strong>Name:</strong> {formData.firstName} {formData.lastName}<br />
                  <strong>Education:</strong> {formData.classLevel ? classLevels.find(l => l.value === formData.classLevel)?.label : 'Not specified'}<br />
                  <strong>Location:</strong> {formData.city}, {formData.state}, {formData.country}
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            {currentStep > 1 ? (
              <button
                onClick={handlePrevious}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition"
              >
                Previous
              </button>
            ) : (
              <button
                onClick={handleSkip}
                className="px-6 py-3 text-gray-500 hover:text-gray-700 font-medium"
              >
                Skip for now
              </button>
            )}
            
            {currentStep < 3 ? (
              <button
                onClick={handleNext}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition"
              >
                Next Step
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium transition flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Completing...
                  </>
                ) : (
                  'Complete Setup'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}