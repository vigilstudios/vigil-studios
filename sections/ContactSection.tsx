"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, MapPin, Phone } from "lucide-react";
import { ContactFormData } from "@/types";

const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  company: z.string().min(2, "Company name required"),
  service: z.string().min(1, "Please select a service"),
  budget: z.string().min(1, "Please select a budget range"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactFormInputs = z.infer<typeof contactFormSchema>;

export function ContactSection() {
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactFormInputs>({
    resolver: zodResolver(contactFormSchema),
  });

  const onSubmit = async (data: ContactFormInputs) => {
    setIsLoading(true);
    try {
      // TODO: Integrate with Resend API
      // For now, just simulate the submission
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSubmitted(true);
      reset();
      setTimeout(() => setSubmitted(false), 3000);
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="contact" className="section-padding relative overflow-hidden">
      <div className="container-wide">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Left Column */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[color:var(--accent)]/10 border border-[color:var(--accent)]/30 mb-6">
              <div className="w-2 h-2 rounded-full bg-[color:var(--accent)]" />
              <span className="text-sm font-medium text-[color:var(--accent)]">Contact</span>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold text-[color:var(--text-primary)] mb-6">
              Let's Work Together
            </h2>

            <p className="text-lg text-[color:var(--text-secondary)] mb-8">
              Ready to take your online presence to the next level? Schedule a free consultation with us today.
            </p>

            {/* Contact Info */}
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-lg bg-[color:var(--accent)]/10 flex items-center justify-center flex-shrink-0">
                  <Mail size={20} className="text-[color:var(--accent)]" />
                </div>
                <div>
                  <p className="text-sm text-[color:var(--text-secondary)] mb-1">Email</p>
                  <a
                    href="mailto:hello@vigilstudios.co"
                    className="text-[color:var(--text-primary)] hover:text-[color:var(--accent)] transition-colors"
                  >
                    hello@vigilstudios.co
                  </a>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-lg bg-[color:var(--accent)]/10 flex items-center justify-center flex-shrink-0">
                  <MapPin size={20} className="text-[color:var(--accent)]" />
                </div>
                <div>
                  <p className="text-sm text-[color:var(--text-secondary)] mb-1">Service Area</p>
                  <p className="text-[color:var(--text-primary)]">
                    Serving businesses nationwide
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-lg bg-[color:var(--accent)]/10 flex items-center justify-center flex-shrink-0">
                  <Phone size={20} className="text-[color:var(--accent)]" />
                </div>
                <div>
                  <p className="text-sm text-[color:var(--text-secondary)] mb-1">
                    Schedule a Call
                  </p>
                  <a
                    href="#"
                    className="text-[color:var(--text-primary)] hover:text-[color:var(--accent)] transition-colors"
                  >
                    Book via Calendly
                  </a>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column - Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="glass p-8 lg:p-12 rounded-2xl"
          >
            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-full flex items-center justify-center text-center"
              >
                <div>
                  <div className="w-16 h-16 rounded-full bg-[color:var(--accent)]/10 flex items-center justify-center mx-auto mb-4">
                    <div className="w-8 h-8 rounded-full bg-[color:var(--accent)]" />
                  </div>
                  <h3 className="text-2xl font-bold text-[color:var(--text-primary)] mb-2">
                    Thanks for reaching out!
                  </h3>
                  <p className="text-[color:var(--text-secondary)]">
                    We'll get back to you within 24 hours.
                  </p>
                </div>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-[color:var(--text-primary)] mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    {...register("name")}
                    placeholder="Your name"
                    className="w-full px-4 py-3 rounded-lg bg-[color:var(--bg-secondary)] border border-[color:var(--border)] text-[color:var(--text-primary)] placeholder-[color:var(--text-secondary)] focus:outline-none focus:border-[color:var(--accent)] transition-colors"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-[color:var(--text-primary)] mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    {...register("email")}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 rounded-lg bg-[color:var(--bg-secondary)] border border-[color:var(--border)] text-[color:var(--text-primary)] placeholder-[color:var(--text-secondary)] focus:outline-none focus:border-[color:var(--accent)] transition-colors"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Company */}
                <div>
                  <label className="block text-sm font-medium text-[color:var(--text-primary)] mb-2">
                    Company
                  </label>
                  <input
                    type="text"
                    {...register("company")}
                    placeholder="Your company name"
                    className="w-full px-4 py-3 rounded-lg bg-[color:var(--bg-secondary)] border border-[color:var(--border)] text-[color:var(--text-primary)] placeholder-[color:var(--text-secondary)] focus:outline-none focus:border-[color:var(--accent)] transition-colors"
                  />
                  {errors.company && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.company.message}
                    </p>
                  )}
                </div>

                {/* Service */}
                <div>
                  <label className="block text-sm font-medium text-[color:var(--text-primary)] mb-2">
                    Service Needed
                  </label>
                  <select
                    {...register("service")}
                    className="w-full px-4 py-3 rounded-lg bg-[color:var(--bg-secondary)] border border-[color:var(--border)] text-[color:var(--text-primary)] focus:outline-none focus:border-[color:var(--accent)] transition-colors"
                  >
                    <option value="">Select a service</option>
                    <option value="custom-website">New Website</option>
                    <option value="landing-page">Landing Page</option>
                    <option value="ecommerce">E-Commerce</option>
                    <option value="ecommerce">Website Redesign</option>
                    <option value="seo">SEO Optimization</option>
                    <option value="maintenance">Website Maintenance</option>
                    <option value="other">Not Sure Yet</option>
                  </select>
                  {errors.service && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.service.message}
                    </p>
                  )}
                </div>

                {/* Budget */}
                <div>
                  <label className="block text-sm font-medium text-[color:var(--text-primary)] mb-2">
                    Budget Range
                  </label>
                  <select
                    {...register("budget")}
                    className="w-full px-4 py-3 rounded-lg bg-[color:var(--bg-secondary)] border border-[color:var(--border)] text-[color:var(--text-primary)] focus:outline-none focus:border-[color:var(--accent)] transition-colors"
                  >
                    <option value="">Select a budget</option>
                    <option value="starter-budget">Starter ($500 - $1,000)</option>
                    <option value="professional-budget">Professional ($1,000 - $2,500)</option>
                    <option value="growth-budget">Growth ($2,500+)</option>
                  </select>
                  {errors.budget && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.budget.message}
                    </p>
                  )}
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-[color:var(--text-primary)] mb-2">
                    Message
                  </label>
                  <textarea
                    {...register("message")}
                    placeholder="Tell us about your project..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg bg-[color:var(--bg-secondary)] border border-[color:var(--border)] text-[color:var(--text-primary)] placeholder-[color:var(--text-secondary)] focus:outline-none focus:border-[color:var(--accent)] transition-colors resize-none"
                  />
                  {errors.message && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.message.message}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full"
                >
                  {isLoading ? "Sending..." : "Send Message"}
                </button>

                <p className="text-xs text-[color:var(--text-secondary)] text-center">
                  We'll respond within 24 hours.
                </p>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
