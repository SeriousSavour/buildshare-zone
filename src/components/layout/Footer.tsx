import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background/80 backdrop-blur-sm border-t border-border/50 py-6 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Copyright */}
          <div className="text-sm text-muted-foreground">
            © {currentYear} philosopher. All rights reserved.
          </div>

          {/* Legal Links */}
          <div className="flex gap-6 text-sm">
            <Link 
              to="/terms" 
              className="text-muted-foreground hover:text-primary transition-colors duration-200"
            >
              Terms of Service
            </Link>
            <Link 
              to="/privacy" 
              className="text-muted-foreground hover:text-primary transition-colors duration-200"
            >
              Privacy Policy
            </Link>
            <Link 
              to="/help" 
              className="text-muted-foreground hover:text-primary transition-colors duration-200"
            >
              Help & Support
            </Link>
          </div>

          {/* Attribution Note */}
          <div className="text-xs text-muted-foreground/70">
            Only licensed content allowed
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;