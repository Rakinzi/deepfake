import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, Check, X, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AuthService from '../services/AuthService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';

const RegistrationPage = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const { name, email, password, confirmPassword } = formData;
  const minLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const passwordsMatch = password === confirmPassword;
  const passwordStrength = [minLength, hasUpperCase, hasLowerCase, hasNumber, hasSpecialChar].filter(Boolean).length;

  useEffect(() => {
    document.title = 'Register';
    if (AuthService.isLoggedIn()) navigate('/dashboard');
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) { setError('Please fill in all fields'); return; }
    if (!passwordsMatch) { setError('Passwords do not match'); return; }
    if (passwordStrength < 5) { setError('Password does not meet all requirements'); return; }
    setIsLoading(true);
    setError('');
    try {
      await AuthService.register(name, email, password);
      navigate('/', { state: { message: 'Registration successful! Please log in.' } });
    } catch (err) {
      setError(err.error || 'Registration failed. Please try again.');
      setIsLoading(false);
    }
  };

  const ValidationItem = ({ isValid, text }) => (
    <div className="flex items-center gap-2">
      {isValid ? <Check className="h-3.5 w-3.5 text-foreground" /> : <X className="h-3.5 w-3.5 text-muted-foreground" />}
      <span className={`text-xs ${isValid ? 'text-foreground' : 'text-muted-foreground'}`}>{text}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Form panel */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 md:p-16 order-2 lg:order-1">
        <div className="max-w-md mx-auto w-full">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-1">Create an Account</h2>
            <p className="text-muted-foreground">Join and unlock all detection features</p>
          </div>

          {/* Step progress */}
          <div className="mb-8">
            <Progress value={currentStep === 1 ? 50 : 100} className="h-1" />
            <div className="flex justify-between mt-2">
              <span className="text-xs font-medium text-foreground">Personal Info</span>
              <span className={`text-xs font-medium ${currentStep === 2 ? 'text-foreground' : 'text-muted-foreground'}`}>Security</span>
            </div>
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive border border-destructive/20 p-3 rounded-md mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {currentStep === 1 ? (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" name="name" type="text" autoComplete="name" required value={name} onChange={handleChange} placeholder="John Doe" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={handleChange} placeholder="you@example.com" />
                </div>
                <Button type="button" onClick={() => name && email && setCurrentStep(2)} disabled={!name || !email} className="w-full">
                  Continue
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password" name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password" required value={password} onChange={handleChange}
                      placeholder="Create a strong password" className="pr-10"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {password.length > 0 && (
                  <div className="p-3 bg-muted rounded-md">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex gap-1 flex-1">
                        {[1,2,3,4,5].map((n) => (
                          <div key={n} className={`h-1 flex-1 rounded-full ${n <= passwordStrength ? 'bg-foreground' : 'bg-border'}`} />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">{['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][passwordStrength]}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      <ValidationItem isValid={minLength} text="At least 8 characters" />
                      <ValidationItem isValid={hasUpperCase} text="1 uppercase letter" />
                      <ValidationItem isValid={hasLowerCase} text="1 lowercase letter" />
                      <ValidationItem isValid={hasNumber} text="1 number" />
                      <ValidationItem isValid={hasSpecialChar} text="1 special character" />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword" name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password" required value={confirmPassword} onChange={handleChange}
                      placeholder="Repeat your password" className="pr-10"
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground">
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmPassword && !passwordsMatch && (
                    <p className="text-xs text-destructive">Passwords do not match</p>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setCurrentStep(1)} className="w-1/3">
                    Back
                  </Button>
                  <Button type="submit" disabled={isLoading || !passwordsMatch || !password} className="w-2/3">
                    {isLoading ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : 'Create Account'}
                  </Button>
                </div>
              </>
            )}
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <a href="/" className="font-medium text-foreground hover:underline">Sign In</a>
          </p>
        </div>
      </div>

      {/* Right decorative panel */}
      <div className="lg:w-1/2 bg-foreground order-1 lg:order-2 relative overflow-hidden min-h-48 lg:min-h-screen">
        <div className="absolute inset-0 opacity-5">
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className="absolute rounded-full border border-background"
              style={{ width: `${Math.random() * 250 + 50}px`, height: `${Math.random() * 250 + 50}px`, left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
            />
          ))}
        </div>
        <div className="relative z-10 p-12 h-full flex flex-col justify-center items-center">
          <ShieldCheck className="w-16 h-16 text-background/80 mb-6" />
          <h2 className="text-2xl font-bold text-background mb-4 text-center">AI-Powered Deepfake Detection</h2>
          <p className="text-background/70 text-center max-w-sm mb-8">
            Create an account to access state-of-the-art image analysis tools.
          </p>
          <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
            {['AI Detection', 'Image Alerts', 'Secure Storage', 'Analytics'].map((f) => (
              <div key={f} className="border border-background/20 rounded-lg p-3 flex items-center gap-2">
                <Check className="h-4 w-4 text-background/60 shrink-0" />
                <span className="text-background/80 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationPage;
