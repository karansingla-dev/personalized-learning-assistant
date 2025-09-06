// frontend/src/app/onboarding/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { showToast } from '@/lib/toast';

// Indian states list
const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Chandigarh", "Puducherry", "Jammu and Kashmir", "Ladakh"
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    // Personal Information (username from Clerk)
    phoneNumber: '',
    
    // Location
    city: '',
    state: '',
    country: 'India',
    
    // Educational Information
    board: '',
    classLevel: '',
    stream: '',
    targetExams: [] as string[]
  });

  // Redirect if not logged in
  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in');
    }
  }, [isLoaded, user, router]);

  const boards = [
    { code: 'CBSE', name: 'CBSE', icon: '📚', description: 'Central Board', color: 'blue' },
    { code: 'ICSE', name: 'ICSE', icon: '📖', description: 'Indian Certificate', color: 'purple' },
    { code: 'STATE', name: 'State Board', icon: '📝', description: 'State Education', color: 'green' }
  ];

  const classes = [
    { value: '6', label: '6th' },
    { value: '7', label: '7th' },
    { value: '8', label: '8th' },
    { value: '9', label: '9th' },
    { value: '10', label: '10th' },
    { value: '11', label: '11th' },
    { value: '12', label: '12th' }
  ];
  
  const streams = [
    { name: 'Science', icon: '🔬', subjects: 'Physics, Chemistry, Maths/Bio', color: 'blue' },
    { name: 'Commerce', icon: '💼', subjects: 'Accounts, Business, Economics', color: 'green' },
    { name: 'Arts', icon: '🎨', subjects: 'History, Political Science, Eco', color: 'purple' }
  ];
  
  const exams = [
    { code: 'JEE', name: 'JEE Main/Advanced', icon: '🎯', for: ['11', '12'], color: 'orange' },
    { code: 'NEET', name: 'NEET Medical', icon: '🏥', for: ['11', '12'], color: 'green' },
    { code: 'BOARDS', name: 'Board Exams', icon: '📋', for: ['10', '12'], color: 'blue' },
    { code: 'OLYMPIAD', name: 'Olympiads', icon: '🏆', for: ['6', '7', '8', '9', '10', '11', '12'], color: 'purple' }
  ];

  // Determine if we need stream selection
  const needsStream = formData.classLevel === '11' || formData.classLevel === '12';
  
  // Calculate total steps based on class selection
  const getTotalSteps = () => {
    if (!formData.classLevel) return 5; // Default before class selection
    return needsStream ? 6 : 5;
  };

  // Get the current step label
  const getStepLabel = (stepNumber: number) => {
    const labels = ['Phone', 'Location', 'Board', 'Class'];
    if (needsStream) {
      labels.push('Stream', 'Exams');
    } else {
      labels.push('Exams');
    }
    return labels[stepNumber - 1] || '';
  };

  // Step validation
  const validatePhone = () => {
    const cleaned = formData.phoneNumber.replace(/\D/g, '');
    return cleaned.length === 10 && /^[6-9]\d{9}$/.test(cleaned);
  };

  const canProceedStep1 = () => {
    return validatePhone();
  };

  const canProceedStep2 = () => {
    return formData.city.trim() !== '' && formData.state !== '';
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const cleaned = value.replace(/\D/g, '');
    // Limit to 10 digits
    const limited = cleaned.slice(0, 10);
    // Format as needed
    if (limited.length > 6) {
      return `${limited.slice(0, 5)} ${limited.slice(5)}`;
    } else if (limited.length > 5) {
      return `${limited.slice(0, 5)} ${limited.slice(5)}`;
    }
    return limited;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData({ ...formData, phoneNumber: formatted });
  };

  const handleClassSelection = (classValue: string) => {
    setFormData({ ...formData, classLevel: classValue, stream: '' }); // Reset stream when class changes
    
    if (classValue === '11' || classValue === '12') {
      setCurrentStep(5); // Go to stream selection
    } else {
      setCurrentStep(5); // Go to exams selection (which will be the 5th step for non-11/12)
    }
  };

  const handleComplete = async () => {
    try {
      setLoading(true);
      
      // Use username from Clerk user object or generate one
      const username = user?.username || 
                      user?.firstName?.toLowerCase() + user?.id?.slice(-4) || 
                      'user' + Date.now().toString().slice(-6);
      
      const payload = {
        clerk_id: user?.id || '',
        email: user?.emailAddresses[0]?.emailAddress || '',
        username: username,
        first_name: user?.firstName || '',
        last_name: user?.lastName || '',
        phone_number: formData.phoneNumber.replace(/\s/g, ''), // Remove spaces
        city: formData.city,
        state: formData.state,
        country: formData.country,
        class_level: formData.classLevel,
        board: formData.board,
        stream: formData.stream || null,
        target_exams: formData.targetExams
      };

      console.log('Sending payload:', payload);
      
      const response = await fetch('http://localhost:8000/api/v1/users/complete-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      console.log('Response:', data);
      
      if (response.ok) {
        showToast.success('Welcome aboard! Let\'s start learning! 🚀');
        router.push('/dashboard/subjects');
      } else {
        showToast.error(data.detail || 'Failed to complete setup');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error:', error);
      showToast.error('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const totalSteps = getTotalSteps();

  // Determine if we're on the final step
  const isOnFinalStep = () => {
    if (needsStream) {
      return currentStep === 6;
    } else {
      return currentStep === 5 && formData.classLevel !== '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Welcome, {user?.firstName}! 👋
          </h1>
          <p className="text-gray-600">Let's personalize your learning experience</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
              <div key={step} className="flex-1 flex items-center">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300
                    ${currentStep > step 
                      ? 'bg-green-500 text-white' 
                      : currentStep === step 
                        ? 'bg-blue-600 text-white shadow-lg scale-110' 
                        : 'bg-gray-200 text-gray-500'
                    }
                  `}
                >
                  {currentStep > step ? '✓' : step}
                </div>
                {step < totalSteps && (
                  <div className={`flex-1 h-1 mx-2 transition-all duration-300 ${
                    currentStep > step ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-600">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
              <span key={step} className="text-center">{getStepLabel(step)}</span>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 transition-all duration-300">
          
          {/* Step 1: Phone Number */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">📱 Contact Information</h2>
                <p className="text-gray-600">We'll use this to keep you updated about your progress</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 font-medium">+91</span>
                  </div>
                  <input
                    type="tel"
                    placeholder="98765 43210"
                    value={formData.phoneNumber}
                    onChange={handlePhoneChange}
                    className="w-full pl-14 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-gray-300"
                    autoFocus
                  />
                </div>
                {formData.phoneNumber && !validatePhone() && (
                  <p className="text-amber-600 text-sm mt-2 flex items-center">
                    <span className="mr-1">⚠️</span>
                    Please enter a valid 10-digit Indian mobile number
                  </p>
                )}
                {validatePhone() && (
                  <p className="text-green-600 text-sm mt-2 flex items-center">
                    <span className="mr-1">✅</span>
                    Valid phone number
                  </p>
                )}
              </div>

              <button
                onClick={() => setCurrentStep(2)}
                disabled={!canProceedStep1()}
                className={`
                  w-full py-3 rounded-xl font-semibold transition-all duration-300
                  ${canProceedStep1()
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg transform hover:scale-105'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }
                `}
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 2: Location */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">📍 Your Location</h2>
                <p className="text-gray-600">This helps us provide region-specific content</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  placeholder="Enter your city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-gray-300"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State
                </label>
                <select
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">Select your state</option>
                  {INDIAN_STATES.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="flex-1 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all"
                >
                  Back
                </button>
                <button
                  onClick={() => setCurrentStep(3)}
                  disabled={!canProceedStep2()}
                  className={`
                    flex-1 py-3 rounded-xl font-semibold transition-all duration-300
                    ${canProceedStep2()
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg transform hover:scale-105'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }
                  `}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Board Selection */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">🎓 Education Board</h2>
                <p className="text-gray-600">Select your education board</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {boards.map((board) => (
                  <button
                    key={board.code}
                    onClick={() => {
                      setFormData({ ...formData, board: board.code });
                      setCurrentStep(4);
                    }}
                    className={`
                      p-6 border-2 rounded-xl transition-all duration-300 hover:shadow-lg transform hover:scale-105
                      ${formData.board === board.code 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-blue-300'
                      }
                    `}
                  >
                    <div className="text-4xl mb-3">{board.icon}</div>
                    <div className="font-semibold text-lg text-gray-800">{board.name}</div>
                    <div className="text-sm text-gray-500 mt-1">{board.description}</div>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentStep(2)}
                className="w-full py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all"
              >
                Back
              </button>
            </div>
          )}

          {/* Step 4: Class Selection */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">📚 Select Your Class</h2>
                <p className="text-gray-600">Which class are you currently studying in?</p>
              </div>

              <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                {classes.map((cls) => (
                  <button
                    key={cls.value}
                    onClick={() => handleClassSelection(cls.value)}
                    className={`
                      py-4 px-6 border-2 rounded-xl transition-all duration-300 hover:shadow-lg transform hover:scale-105
                      ${formData.classLevel === cls.value 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-blue-300'
                      }
                    `}
                  >
                    <div className="text-xl font-bold text-gray-800">Class</div>
                    <div className="text-2xl font-bold text-blue-600">{cls.label}</div>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentStep(3)}
                className="w-full py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all"
              >
                Back
              </button>
            </div>
          )}

          {/* Step 5: Stream Selection (ONLY for 11-12) */}
          {currentStep === 5 && needsStream && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">🎯 Choose Your Stream</h2>
                <p className="text-gray-600">Select your academic stream</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {streams.map((stream) => (
                  <button
                    key={stream.name}
                    onClick={() => {
                      setFormData({ ...formData, stream: stream.name });
                      setCurrentStep(6); // Go to exams
                    }}
                    className={`
                      p-6 border-2 rounded-xl transition-all duration-300 hover:shadow-lg transform hover:scale-105
                      ${formData.stream === stream.name 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-blue-300'
                      }
                    `}
                  >
                    <div className="text-3xl mb-3">{stream.icon}</div>
                    <div className="font-semibold text-lg text-gray-800">{stream.name}</div>
                    <div className="text-xs text-gray-500 mt-2">{stream.subjects}</div>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentStep(4)}
                className="w-full py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all"
              >
                Back
              </button>
            </div>
          )}

          {/* Final Step: Target Exams */}
          {((currentStep === 6 && needsStream) || (currentStep === 5 && !needsStream && formData.classLevel)) && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">🎯 Target Exams</h2>
                <p className="text-gray-600">Select the exams you're preparing for (optional)</p>
              </div>

              <div className="space-y-3">
                {exams
                  .filter(exam => exam.for.includes(formData.classLevel))
                  .map((exam) => (
                    <label
                      key={exam.code}
                      className={`
                        flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-md
                        ${formData.targetExams.includes(exam.code) 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-blue-300'
                        }
                      `}
                    >
                      <input
                        type="checkbox"
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        checked={formData.targetExams.includes(exam.code)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              targetExams: [...formData.targetExams, exam.code]
                            });
                          } else {
                            setFormData({
                              ...formData,
                              targetExams: formData.targetExams.filter(e => e !== exam.code)
                            });
                          }
                        }}
                      />
                      <span className="text-2xl mx-3">{exam.icon}</span>
                      <div className="flex-1">
                        <span className="font-semibold text-gray-800">{exam.name}</span>
                      </div>
                    </label>
                  ))}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setCurrentStep(needsStream ? 5 : 4)}
                  className="flex-1 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handleComplete}
                  disabled={loading}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Setting up...
                    </span>
                  ) : (
                    'Start Learning 🚀'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Help Text */}
        <p className="text-center text-gray-500 text-sm mt-6">
          Need help? Contact us at support@ailearning.com
        </p>
      </div>

      {/* Add animation styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}