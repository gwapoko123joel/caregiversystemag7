import React, { useState } from 'react';
import { 
  Heart, 
  Send, 
  Shield 
} from 'lucide-react';
import { toast } from 'sonner';

const FacebookIcon = ({ size, className }: any) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>;
const TwitterIcon = ({ size, className }: any) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>;
const LinkedinIcon = ({ size, className }: any) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>;
const InstagramIcon = ({ size, className }: any) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>;

const Footer: React.FC = () => {
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;

    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      toast.success('Thank you for your feedback!', {
        description: 'Your user voice helps us build a better BantayanCare.',
      });
      setFeedback('');
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <footer className="relative z-10 w-full mt-20 border-t border-card-border bg-card/30 backdrop-blur-xl transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 py-16 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          
          {/* Column 1: Brand & Identity */}
          <div className="md:col-span-4 space-y-6">
            <div className="flex items-center gap-3 group/logo">
              <div className="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center shadow-lg group-hover/logo:shadow-sky-500/40 transition-all">
                <Heart size={20} className="text-white fill-white" />
              </div>
              <span className="font-black tracking-tight text-xl text-text-main uppercase transition-colors">
                Bantayan<span className="text-sky-500">Care</span>
              </span>
            </div>
            <p className="text-sidebar-text-muted font-medium leading-relaxed max-w-sm">
              Empowering Barangay Bantayan through automated care coordination and real-time health monitoring.
            </p>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold w-fit">
              <Shield size={14} />
              HIPAA COMPLIANT SYSTEM
            </div>
          </div>

          {/* Column 2: Social Connectivity */}
          <div className="md:col-span-3 space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-text-main">Connect With Us</h3>
            <div className="flex flex-wrap gap-4">
              {[
                { icon: FacebookIcon, label: 'Facebook', url: 'https://facebook.com/bantayancare' },
                { icon: TwitterIcon, label: 'Twitter', url: 'https://twitter.com/bantayancare' },
                { icon: LinkedinIcon, label: 'LinkedIn', url: 'https://linkedin.com/company/bantayancare' },
                { icon: InstagramIcon, label: 'Instagram', url: 'https://instagram.com/bantayancare' }
              ].map((social) => (
                <a 
                  key={social.label}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-card border border-card-border flex items-center justify-center text-sidebar-text-muted hover:text-sky-500 hover:border-sky-500/50 hover:shadow-[0_0_15px_rgba(14,165,233,0.3)] transition-all duration-300 group"
                  aria-label={social.label}
                >
                  <social.icon size={20} className="group-hover:scale-110 transition-transform" />
                </a>
              ))}
            </div>
            <div className="space-y-4 pt-4">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-sidebar-text-muted">Resources</h4>
               <ul className="space-y-2">
                 <li><a href="#" className="text-sm font-semibold text-sidebar-text-muted hover:text-text-main transition-colors">Privacy Policy</a></li>
                 <li><a href="#" className="text-sm font-semibold text-sidebar-text-muted hover:text-text-main transition-colors">Terms of Service</a></li>
                 <li><a href="#" className="text-sm font-semibold text-sidebar-text-muted hover:text-text-main transition-colors">Support Center</a></li>
               </ul>
            </div>
          </div>

          {/* Column 3: Feedback Mechanism */}
          <div className="md:col-span-5 space-y-6">
            <div className="p-6 rounded-2xl bg-card border border-card-border shadow-harmonized ring-1 ring-white/5">
              <h3 className="text-xs font-black uppercase tracking-widest text-text-main mb-4">User Voice</h3>
              <p className="text-xs text-sidebar-text-muted mb-4 font-medium uppercase tracking-tight">Your feedback drives our automation.</p>
              
              <form onSubmit={handleSubmitFeedback} className="space-y-4">
                <textarea 
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Share your thoughts or suggest a feature..."
                  className="w-full min-h-[100px] p-4 bg-primary/50 border border-card-border rounded-xl text-text-main text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/50 transition-all resize-none placeholder:text-sidebar-text-muted/50"
                  required
                />
                <button 
                  type="submit"
                  disabled={isSubmitting || !feedback.trim()}
                  className="w-full py-3 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black uppercase tracking-widest text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 active:scale-[0.98] transition-all"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Submit Feedback <Send size={14} />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

        </div>

        {/* Legal Row */}
        <div className="mt-16 pt-8 border-t border-card-border/50 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-[10px] font-black uppercase tracking-widest text-sidebar-text-muted">
            © 2026 BantayanCare. All rights reserved.
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
               <span className="text-[8px] font-black uppercase tracking-widest text-sidebar-text-muted">Systems Operational</span>
            </div>
            <div className="h-4 w-[1px] bg-card-border hidden md:block" />
            <div className="text-[8px] font-black uppercase tracking-widest text-sidebar-text-muted">
              Built with ♥ for Barangay Bantayan
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
