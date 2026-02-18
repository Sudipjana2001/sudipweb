import { Link } from "react-router-dom";
import { PageLayout } from "@/components/layouts/PageLayout";
import { SEOHead } from "@/components/SEOHead";

const Privacy = () => {
  return (
    <PageLayout showNewsletter={false}>
      <SEOHead
        title="Privacy Policy"
        description="Read Pebric's privacy policy. Learn how we collect, use, and protect your personal information when you shop with us."
        keywords="Pebric privacy policy, data protection, personal information, pet store privacy"
      />
      <div className="container mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-12">
          <p className="mb-4 font-body text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Legal
          </p>
          <h1 className="font-display text-4xl font-medium tracking-tight md:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-4 font-body text-muted-foreground">
            Last updated: February 18, 2026
          </p>
        </div>

        {/* Content */}
        <div className="max-w-3xl space-y-10 font-body text-muted-foreground leading-relaxed">

          {/* Introduction */}
          <section>
            <p>
              At Pebric, your privacy is important to us. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services. Please read this policy carefully. By using our Services, you consent to the practices described in this Privacy Policy.
            </p>
          </section>

          {/* 1. Information We Collect */}
          <section>
            <h2 className="mb-4 font-display text-2xl font-medium text-foreground">
              1. Information We Collect
            </h2>

            <h3 className="mb-2 font-display text-lg font-medium text-foreground">
              Personal Information
            </h3>
            <p>We may collect the following personal information when you interact with our services:</p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Name, email address, phone number, and mailing/shipping address</li>
              <li>Payment information (credit card numbers, billing address) — processed securely through third-party payment processors</li>
              <li>Account credentials (username, password)</li>
              <li>Order history and purchase preferences</li>
              <li>Pet information you provide (pet name, breed, size) for personalized recommendations</li>
              <li>Communications and correspondence with our support team</li>
            </ul>

            <h3 className="mb-2 mt-6 font-display text-lg font-medium text-foreground">
              Automatically Collected Information
            </h3>
            <p>When you visit our website, we may automatically collect:</p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Device information (browser type, operating system, device type)</li>
              <li>IP address and approximate geographic location</li>
              <li>Pages viewed, links clicked, and time spent on our website</li>
              <li>Referring website or source that led you to our site</li>
              <li>Cookies and similar tracking technologies (see Section 6)</li>
            </ul>
          </section>

          {/* 2. How We Use Your Information */}
          <section>
            <h2 className="mb-4 font-display text-2xl font-medium text-foreground">
              2. How We Use Your Information
            </h2>
            <p>We use the information we collect for the following purposes:</p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li><strong className="text-foreground">Order Fulfillment:</strong> Processing your orders, managing payments, and arranging delivery</li>
              <li><strong className="text-foreground">Account Management:</strong> Creating and maintaining your account, tracking your order history, and managing your wishlist and favorites</li>
              <li><strong className="text-foreground">Customer Support:</strong> Responding to your inquiries, processing returns and exchanges, and resolving issues</li>
              <li><strong className="text-foreground">Personalization:</strong> Tailoring product recommendations, content, and offers based on your preferences and pet profiles</li>
              <li><strong className="text-foreground">Communication:</strong> Sending order confirmations, shipping updates, promotional offers, and newsletters (with your consent)</li>
              <li><strong className="text-foreground">Improvement:</strong> Analyzing usage patterns to improve our website, products, and services</li>
              <li><strong className="text-foreground">Security:</strong> Detecting and preventing fraud, unauthorized access, and other malicious activities</li>
              <li><strong className="text-foreground">Legal Compliance:</strong> Complying with applicable laws, regulations, and legal processes</li>
            </ul>
          </section>

          {/* 3. Information Sharing */}
          <section>
            <h2 className="mb-4 font-display text-2xl font-medium text-foreground">
              3. Information Sharing & Disclosure
            </h2>
            <p>
              We do not sell your personal information. We may share your information with trusted third parties only in the following circumstances:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li><strong className="text-foreground">Service Providers:</strong> Payment processors, shipping carriers, email service providers, and analytics tools that help us operate our business</li>
              <li><strong className="text-foreground">Business Partners:</strong> When you participate in co-branded promotions or loyalty programs</li>
              <li><strong className="text-foreground">Legal Requirements:</strong> When required by law, regulation, legal process, or governmental request</li>
              <li><strong className="text-foreground">Protection:</strong> To protect the rights, property, or safety of Pebric, our customers, or the public</li>
              <li><strong className="text-foreground">Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets, where your information may be transferred as a business asset</li>
            </ul>
          </section>

          {/* 4. Data Security */}
          <section>
            <h2 className="mb-4 font-display text-2xl font-medium text-foreground">
              4. Data Security
            </h2>
            <p>
              We implement industry-standard security measures to protect your personal information, including encryption of data in transit (SSL/TLS), secure storage practices, and regular security assessments. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
            </p>
            <p className="mt-3">
              We restrict access to your personal information to authorized employees and service providers who need it to perform their job functions. All such parties are bound by confidentiality obligations.
            </p>
          </section>

          {/* 5. Data Retention */}
          <section>
            <h2 className="mb-4 font-display text-2xl font-medium text-foreground">
              5. Data Retention
            </h2>
            <p>
              We retain your personal information for as long as your account is active or as needed to provide you with our services. We may also retain your information as necessary to comply with legal obligations, resolve disputes, and enforce our agreements. When your data is no longer required, we will securely delete or anonymize it.
            </p>
          </section>

          {/* 6. Cookies */}
          <section>
            <h2 className="mb-4 font-display text-2xl font-medium text-foreground">
              6. Cookies & Tracking Technologies
            </h2>
            <p>
              We use cookies and similar technologies to enhance your browsing experience. These include:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li><strong className="text-foreground">Essential Cookies:</strong> Required for core website functionality such as authentication, shopping cart, and checkout</li>
              <li><strong className="text-foreground">Analytics Cookies:</strong> Help us understand how visitors interact with our website so we can improve the user experience</li>
              <li><strong className="text-foreground">Preference Cookies:</strong> Remember your settings and preferences for a personalized experience</li>
              <li><strong className="text-foreground">Marketing Cookies:</strong> Used to deliver relevant advertisements and track the effectiveness of our marketing campaigns</li>
            </ul>
            <p className="mt-3">
              You can manage cookie preferences through your browser settings. Please note that disabling certain cookies may affect the functionality of our website.
            </p>
          </section>

          {/* 7. Your Rights */}
          <section>
            <h2 className="mb-4 font-display text-2xl font-medium text-foreground">
              7. Your Rights
            </h2>
            <p>Depending on your location, you may have the following rights regarding your personal information:</p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li><strong className="text-foreground">Access:</strong> Request a copy of the personal information we hold about you</li>
              <li><strong className="text-foreground">Correction:</strong> Request that we correct inaccurate or incomplete information</li>
              <li><strong className="text-foreground">Deletion:</strong> Request that we delete your personal information, subject to certain legal exceptions</li>
              <li><strong className="text-foreground">Opt-Out:</strong> Unsubscribe from marketing communications at any time by clicking the "unsubscribe" link in our emails or contacting us directly</li>
              <li><strong className="text-foreground">Data Portability:</strong> Request your data in a structured, commonly used, and machine-readable format</li>
              <li><strong className="text-foreground">Withdraw Consent:</strong> Where processing is based on consent, you may withdraw your consent at any time</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, please contact us using the details provided in Section 10. We will respond to your request within 30 days.
            </p>
          </section>

          {/* 8. Children's Privacy */}
          <section>
            <h2 className="mb-4 font-display text-2xl font-medium text-foreground">
              8. Children's Privacy
            </h2>
            <p>
              Our Services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If we learn that we have collected personal information from a child under 18, we will take steps to delete such information promptly. If you believe a child has provided us with personal information, please contact us immediately.
            </p>
          </section>

          {/* 9. Third-Party Links */}
          <section>
            <h2 className="mb-4 font-display text-2xl font-medium text-foreground">
              9. Third-Party Links
            </h2>
            <p>
              Our website may contain links to third-party websites and services. We are not responsible for the privacy practices or content of these third-party sites. We encourage you to review the privacy policies of any third-party sites you visit. This Privacy Policy applies solely to information collected by Pebric.
            </p>
          </section>

          {/* 10. Contact */}
          <section>
            <h2 className="mb-4 font-display text-2xl font-medium text-foreground">
              10. Contact Us
            </h2>
            <p>
              If you have any questions or concerns about this Privacy Policy, or wish to exercise your data rights, please contact us:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Email: <a href="mailto:privacy@pebric.com" className="text-foreground underline underline-offset-4 hover:text-foreground/70 transition-colors">privacy@pebric.com</a></li>
              <li>Visit our <Link to="/contact" className="text-foreground underline underline-offset-4 hover:text-foreground/70 transition-colors">Contact Page</Link></li>
              <li>Visit our <Link to="/support" className="text-foreground underline underline-offset-4 hover:text-foreground/70 transition-colors">Support Center</Link></li>
            </ul>
          </section>

          {/* 11. Changes to Policy */}
          <section>
            <h2 className="mb-4 font-display text-2xl font-medium text-foreground">
              11. Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our practices or for legal, operational, or regulatory reasons. We will notify you of any material changes by updating the "Last updated" date at the top of this page. We encourage you to review this Privacy Policy periodically to stay informed about how we protect your information.
            </p>
          </section>

          {/* Related link */}
          <div className="border-t border-border pt-8">
            <p className="text-sm">
              Please also review our{" "}
              <Link to="/terms" className="text-foreground underline underline-offset-4 hover:text-foreground/70 transition-colors">
                Terms of Service
              </Link>{" "}
              to understand the rules and regulations governing the use of our services.
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Privacy;
