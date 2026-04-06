"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Send, Phone, GraduationCap, Briefcase, School, UserCheck } from "lucide-react";
import { z } from "zod";

// Validation schemas
const enrollmentSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Invalid email address").max(255),
  phone: z.string().trim().min(10, "Phone number must be at least 10 digits").max(15),
  course: z.string().min(1, "Please select a course"),
});

const enquirySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Invalid email address").max(255),
  phone: z.string().trim().min(10, "Phone number must be at least 10 digits").max(15),
  message: z.string().trim().min(1, "Message is required").max(1000),
});

interface PopupFormProps {
  isOpen: boolean;
  onClose: () => void;
  type: "enrollment" | "enquiry" | "callback" | "mentor" | "partner";
  title?: string;
}

const courseOptions = [
  "Full Stack Development Bootcamp",
  "Data Science & AI Bootcamp",
  "UI/UX Design Crash Program",
  "Complete React Developer",
  "Python for Data Science",
  "AWS Cloud Practitioner",
];

export const PopupForm = ({ isOpen, onClose, type, title }: PopupFormProps) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    course: "",
    message: "",
    organization: "",
    role: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getIcon = () => {
    switch (type) {
      case "enrollment": return <GraduationCap className="h-6 w-6" />;
      case "mentor": return <UserCheck className="h-6 w-6" />;
      case "partner": return <School className="h-6 w-6" />;
      case "callback": return <Phone className="h-6 w-6" />;
      default: return <Briefcase className="h-6 w-6" />;
    }
  };

  const getTitle = () => {
    if (title) return title;
    switch (type) {
      case "enrollment": return "Enroll Now";
      case "enquiry": return "Quick Enquiry";
      case "callback": return "Request Callback";
      case "mentor": return "Apply as Mentor";
      case "partner": return "Partner With Us";
      default: return "Get in Touch";
    }
  };

  const getDescription = () => {
    switch (type) {
      case "enrollment": return "Fill in your details to enroll in your preferred course or bootcamp.";
      case "enquiry": return "Have questions? Send us a quick message and we'll get back to you.";
      case "callback": return "Leave your number and we'll call you back within 24 hours.";
      case "mentor": return "Join our team of mentors and inspire the next generation.";
      case "partner": return "Let's discuss how we can collaborate with your institution.";
      default: return "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      if (type === "enrollment") {
        enrollmentSchema.parse(formData);
      } else {
        enquirySchema.parse(formData);
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast.success("Thank you! We'll get back to you soon.");
      setFormData({ name: "", email: "", phone: "", course: "", message: "", organization: "", role: "" });
      onClose();
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.issues.forEach((error) => {
          if (error.path[0]) {
            fieldErrors[error.path[0].toString()] = error.message;
          }
        });
        setErrors(fieldErrors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary text-primary-foreground">
              {getIcon()}
            </div>
            <div>
              <DialogTitle className="text-xl">{getTitle()}</DialogTitle>
              <DialogDescription className="mt-1">
                {getDescription()}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Input
              placeholder="Your Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
          </div>

          <div>
            <Input
              type="email"
              placeholder="Email Address *"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={errors.email ? "border-destructive" : ""}
            />
            {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
          </div>

          <div>
            <Input
              type="tel"
              placeholder="Phone Number *"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className={errors.phone ? "border-destructive" : ""}
            />
            {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
          </div>

          {type === "enrollment" && (
            <div>
              <Select value={formData.course} onValueChange={(value) => setFormData({ ...formData, course: value })}>
                <SelectTrigger className={errors.course ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select Course/Bootcamp *" />
                </SelectTrigger>
                <SelectContent>
                  {courseOptions.map((course) => (
                    <SelectItem key={course} value={course}>
                      {course}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.course && <p className="text-xs text-destructive mt-1">{errors.course}</p>}
            </div>
          )}

          {(type === "partner" || type === "mentor") && (
            <div>
              <Input
                placeholder={type === "partner" ? "Organization Name" : "Current Role/Company"}
                value={formData.organization}
                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
              />
            </div>
          )}

          {(type === "enquiry" || type === "mentor" || type === "partner") && (
            <div>
              <Textarea
                placeholder={type === "enquiry" ? "Your Message *" : "Tell us about yourself and your expertise"}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={4}
                className={errors.message ? "border-destructive" : ""}
              />
              {errors.message && <p className="text-xs text-destructive mt-1">{errors.message}</p>}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" variant="default" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Export hook for managing popup state
export const usePopupForm = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [formType, setFormType] = useState<"enrollment" | "enquiry" | "callback" | "mentor" | "partner">("enquiry");
  const [formTitle, setFormTitle] = useState<string | undefined>();

  const openForm = (type: typeof formType, title?: string) => {
    setFormType(type);
    setFormTitle(title);
    setIsOpen(true);
  };

  const closeForm = () => setIsOpen(false);

  return { isOpen, formType, formTitle, openForm, closeForm };
};
