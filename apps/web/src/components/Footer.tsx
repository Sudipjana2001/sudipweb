import { Link } from "react-router-dom";
import { Instagram, Facebook, Twitter, Youtube, Mail, Phone, MapPin } from "lucide-react";

const footerLinks = {
  shop: [
    { name: "Twinning Sets", href: "/shop" },
    { name: "Summer Collection", href: "/summer" },
    { name: "Winter Collection", href: "/winter" },
    { name: "Rainy Collection", href: "/rainy" },
    { name: "Compare Products", href: "/compare" },
  ],
  support: [
    { name: "Track Order", href: "/tracking" },
    { name: "FAQs", href: "/faq" },
    { name: "Contact Us", href: "/contact" },
  ],
  company: [
    { name: "Our Story", href: "/about" },
  ],
  legal: [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
  ],
};

const socialLinks = [
  { name: "Instagram", icon: Instagram, href: "#" },
  { name: "Facebook", icon: Facebook, href: "#" },
  { name: "Twitter", icon: Twitter, href: "#" },
  { name: "YouTube", icon: Youtube, href: "#" },
];

export function Footer() {
  return (
    <footer className="bg-foreground text-background relative z-50">
      {/* Main Footer */}
      <div className="container mx-auto px-6 py-16 md:py-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-6">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link to="/" className="mb-6 inline-block">
              <h3 className="font-display text-2xl font-medium">Twinning</h3>
            </Link>
            <p className="mb-6 max-w-xs font-body text-sm leading-relaxed text-background/70">
              Premium matching outfits for pets and their humans. Because the best moments are the ones we share.
            </p>
            
            {/* Social Links */}
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href === "#" ? undefined : social.href}
                  className="flex h-10 w-10 items-center justify-center border border-background/20 text-background/70 transition-all duration-300 hover:border-background hover:text-background cursor-pointer"
                  aria-label={social.name}
                  onClick={(e) => {
                    if (social.href === "#") e.preventDefault();
                  }}
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="mb-6 font-body text-xs uppercase tracking-[0.2em] text-background/50">
              Shop
            </h4>
            <ul className="space-y-3">
              {footerLinks.shop.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="font-body text-sm text-background/70 transition-colors hover:text-background"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="mb-6 font-body text-xs uppercase tracking-[0.2em] text-background/50">
              Support
            </h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="font-body text-sm text-background/70 transition-colors hover:text-background"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="mb-6 font-body text-xs uppercase tracking-[0.2em] text-background/50">
              Company
            </h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="font-body text-sm text-background/70 transition-colors hover:text-background"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="mb-6 font-body text-xs uppercase tracking-[0.2em] text-background/50">
              Contact
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 text-background/50" />
                <span className="font-body text-sm text-background/70">
                  hello@twinning.com
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 text-background/50" />
                <span className="font-body text-sm text-background/70">
                  +1 (800) 123-4567
                </span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-background/50" />
                <span className="font-body text-sm text-background/70">
                  New York, NY 10001
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-background/10">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-6 py-6 md:flex-row">
          <p className="font-body text-xs text-background/50">
            © {new Date().getFullYear()} Twinning. All rights reserved.
          </p>
          <div className="flex gap-6">
            {footerLinks.legal.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="font-body text-xs text-background/50 transition-colors hover:text-background"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
