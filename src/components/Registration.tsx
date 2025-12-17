import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, Linkedin, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Registration = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    linkedIn: "",
    resume: null as File | null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasLinkedIn, setHasLinkedIn] = useState(false);
  const [hasResume, setHasResume] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    if (name === "linkedIn" && value.trim()) {
      setHasLinkedIn(true);
    } else if (name === "linkedIn") {
      setHasLinkedIn(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
        toast.error("Please upload a PDF file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      setFormData((prev) => ({ ...prev, resume: file }));
      setHasResume(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.fullName.trim()) {
      toast.error("Please enter your full name");
      return;
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (!hasLinkedIn && !hasResume) {
      toast.error("Please provide either your LinkedIn profile or upload your resume");
      return;
    }

    setIsSubmitting(true);
    
    try {
      let resumePath: string | null = null;

      // Upload resume if provided
      if (formData.resume) {
        const fileExt = formData.resume.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('resumes')
          .upload(fileName, formData.resume);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw new Error('Failed to upload resume');
        }
        
        resumePath = fileName;
      }

      // Insert registration into database
      const { error: insertError } = await supabase
        .from('registrations')
        .insert({
          full_name: formData.fullName.trim(),
          email: formData.email.trim().toLowerCase(),
          linkedin_url: formData.linkedIn.trim() || null,
          resume_path: resumePath,
        });

      if (insertError) {
        console.error('Insert error:', insertError);
        if (insertError.code === '23505') {
          throw new Error('This email is already registered');
        }
        throw new Error('Failed to submit registration');
      }

      toast.success("Registration successful! We'll be in touch soon.");
      setFormData({ fullName: "", email: "", linkedIn: "", resume: null });
      setHasLinkedIn(false);
      setHasResume(false);
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error instanceof Error ? error.message : 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="register" className="py-24 relative">
      <div className="absolute inset-0 circuit-pattern opacity-10" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="text-gradient">Register</span> Now
            </h2>
            <p className="text-muted-foreground text-lg">
              Secure your spot at JengaHacks 2026. Limited to 500 participants.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 bg-card p-8 rounded-2xl border border-border">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={handleInputChange}
                className="bg-muted border-border focus:border-primary"
                required
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={handleInputChange}
                className="bg-muted border-border focus:border-primary"
                required
              />
            </div>

            {/* Divider */}
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-card px-4 text-sm text-muted-foreground">
                  Provide at least one *
                </span>
              </div>
            </div>

            {/* LinkedIn */}
            <div className="space-y-2">
              <Label htmlFor="linkedIn" className="flex items-center gap-2">
                <Linkedin className="w-4 h-4" />
                LinkedIn Profile
                {hasLinkedIn && <CheckCircle className="w-4 h-4 text-primary" />}
              </Label>
              <Input
                id="linkedIn"
                name="linkedIn"
                type="url"
                placeholder="https://linkedin.com/in/yourprofile"
                value={formData.linkedIn}
                onChange={handleInputChange}
                className="bg-muted border-border focus:border-primary"
              />
            </div>

            {/* Resume Upload */}
            <div className="space-y-2">
              <Label htmlFor="resume" className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Resume (PDF)
                {hasResume && <CheckCircle className="w-4 h-4 text-primary" />}
              </Label>
              <div className="relative">
                <Input
                  id="resume"
                  name="resume"
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                  className="bg-muted border-border focus:border-primary file:bg-primary file:text-primary-foreground file:border-0 file:rounded file:px-4 file:py-1 file:mr-4 file:font-medium file:cursor-pointer"
                />
              </div>
              {formData.resume && (
                <p className="text-sm text-muted-foreground">
                  Selected: {formData.resume.name}
                </p>
              )}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              variant="hero"
              size="lg"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Complete Registration"}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              By registering, you agree to our terms and conditions. 
              We'll never share your information without consent.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Registration;
