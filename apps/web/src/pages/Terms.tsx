import { Link } from "react-router-dom";
import { PageLayout } from "@/components/layouts/PageLayout";
import { SEOHead } from "@/components/SEOHead";

const Terms = () => {
  return (
    <PageLayout showNewsletter={false}>
      <SEOHead
        title="Terms of Service"
        description="Read Pebric's terms of service. Understand the rules and regulations governing the use of our website and services."
        keywords="Pebric terms of service, user agreement, terms and conditions"
      />
      <div className="container mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-12">
          <p className="mb-4 font-body text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Legal
          </p>
          <h1 className="font-display text-4xl font-medium tracking-tight md:text-5xl">
            Terms of Service
          </h1>
          <p className="mt-4 font-body text-muted-foreground">
            Last updated: February 18, 2026
          </p>
        </div>

        {/* Content */}
        <div className="max-w-3xl space-y-10 font-body text-muted-foreground leading-relaxed">

          {/* 1. Agreement */}
          <section>
            <h2 className="mb-4 font-display text-2xl font-medium text-foreground">
              1. Agreement to Terms
            </h2>
            <p>
              By accessing or using the Pebric website and services ("Services"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our Services. These Terms constitute a legally binding agreement between you and Pebric ("we", "us", or "our").
            </p>
            <p className="mt-3">
              We reserve the right to update or modify these Terms at any time. We will notify you of significant changes by updating the "Last updated" date at the top of this page. Your continued use of the Services after any modifications constitutes your acceptance of the revised Terms.
            </p>
          </section>

          {/* 2. Use of Services */}
          <section>
            <h2 className="mb-4 font-display text-2xl font-medium text-foreground">
              2. Use of Services
            </h2>
            <p>You agree to use our Services only for lawful purposes and in accordance with these Terms. You agree not to:</p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Use the Services in any way that violates any applicable laws or regulations</li>
              <li>Attempt to interfere with, compromise the system integrity, or decipher any transmissions to or from the servers running the Services</li>
              <li>Use any robot, spider, or other automatic device to access the Services for any purpose</li>
              <li>Impersonate or attempt to impersonate Pebric, an employee, another user, or any other entity</li>
              <li>Engage in any conduct that restricts or inhibits anyone's use or enjoyment of the Services</li>
            </ul>
          </section>

          {/* 3. Account */}
          <section>
            <h2 className="mb-4 font-display text-2xl font-medium text-foreground">
              3. Account Registration
            </h2>
            <p>
              To access certain features of our Services, you may be required to create an account. When creating an account, you agree to provide accurate, current, and complete information. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
            </p>
            <p className="mt-3">
              You must be at least 18 years of age or have the consent of a parent or legal guardian to create an account and use our Services. You agree to notify us immediately of any unauthorized use of your account.
            </p>
          </section>

          {/* 4. Products & Orders */}
          <section>
            <h2 className="mb-4 font-display text-2xl font-medium text-foreground">
              4. Products & Orders
            </h2>
            <p>
              All product descriptions, pricing, and availability are subject to change at any time without notice. We reserve the right to limit the quantities of any products or services that we offer. We make every effort to display product colors and images as accurately as possible, but we cannot guarantee that your device's display will accurately reflect the actual colors.
            </p>
            <p className="mt-3">
              By placing an order, you represent that the products ordered will be used only in a lawful manner. We reserve the right to refuse or cancel any order for any reason, including limitations on quantities available for purchase, inaccuracies in product or pricing information, or problems identified by our fraud and verification team.
            </p>
          </section>

          {/* 5. Pricing & Payment */}
          <section>
            <h2 className="mb-4 font-display text-2xl font-medium text-foreground">
              5. Pricing & Payment
            </h2>
            <p>
              All prices are listed in Indian Rupees (₹) and are inclusive of applicable taxes unless otherwise stated. We reserve the right to adjust pricing at any time. Any price changes will not affect orders that have already been confirmed.
            </p>
            <p className="mt-3">
              Payment must be received in full before orders are dispatched. We accept various payment methods as displayed at checkout. You agree that you will pay for all products you purchase through our Services and that we may charge your selected payment method for any products purchased and any additional amounts (including applicable taxes and shipping fees).
            </p>
          </section>

          {/* 6. Shipping */}
          <section>
            <h2 className="mb-4 font-display text-2xl font-medium text-foreground">
              6. Shipping & Delivery
            </h2>
            <p>
              Estimated delivery times are provided as a guide and are not guaranteed. We are not responsible for delays caused by carriers, customs, weather events, or other circumstances beyond our control. Risk of loss and title for items purchased pass to you upon delivery of the items to the carrier.
            </p>
            <p className="mt-3">
              Free shipping is available on qualifying orders as displayed on our website. Shipping fees for orders below the qualifying threshold will be calculated and displayed at checkout before payment is confirmed.
            </p>
          </section>

          {/* 7. Returns & Refunds */}
          <section>
            <h2 className="mb-4 font-display text-2xl font-medium text-foreground">
              7. Returns & Refunds
            </h2>
            <p>
              We offer a 30-day return policy for unworn, unwashed items in their original packaging with tags attached. To initiate a return, please contact our support team or use the returns portal in your account dashboard.
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Refunds will be processed to the original payment method within 7–10 business days after we receive the returned item</li>
              <li>Items marked as final sale, personalized items, and pet accessories that have been used are not eligible for return</li>
              <li>Customers are responsible for return shipping costs unless the item was damaged or defective upon arrival</li>
              <li>We may offer exchanges or store credit as alternatives to refunds</li>
            </ul>
          </section>

          {/* 8. Intellectual Property */}
          <section>
            <h2 className="mb-4 font-display text-2xl font-medium text-foreground">
              8. Intellectual Property
            </h2>
            <p>
              All content on our website — including text, graphics, logos, images, product designs, and software — is the property of Pebric or its content suppliers and is protected by applicable intellectual property laws. You may not reproduce, distribute, modify, or create derivative works from any content without our prior written consent.
            </p>
            <p className="mt-3">
              The Pebric name, logo, and all related product and service names, designs, and slogans are trademarks of Pebric. You may not use these marks without our prior written permission.
            </p>
          </section>

          {/* 9. User Content */}
          <section>
            <h2 className="mb-4 font-display text-2xl font-medium text-foreground">
              9. User-Generated Content
            </h2>
            <p>
              By submitting reviews, photos, or other content ("User Content") to our Services, you grant Pebric a non-exclusive, worldwide, royalty-free, perpetual license to use, reproduce, modify, publish, and display such content in connection with our Services and marketing activities.
            </p>
            <p className="mt-3">
              You represent that you own or have the necessary rights to submit User Content and that it does not infringe on any third party's rights. We reserve the right to remove any User Content that violates these Terms or that we find objectionable.
            </p>
          </section>

          {/* 10. Limitation of Liability */}
          <section>
            <h2 className="mb-4 font-display text-2xl font-medium text-foreground">
              10. Limitation of Liability
            </h2>
            <p>
              To the fullest extent permitted by applicable law, Pebric shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, arising from your use of or inability to use the Services.
            </p>
            <p className="mt-3">
              In no event shall our total liability to you for all claims relating to the Services exceed the amount you paid to Pebric during the twelve (12) months immediately preceding the event giving rise to such liability.
            </p>
          </section>

          {/* 11. Governing Law */}
          <section>
            <h2 className="mb-4 font-display text-2xl font-medium text-foreground">
              11. Governing Law
            </h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions. Any disputes arising under or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts located in India.
            </p>
          </section>

          {/* 12. Contact */}
          <section>
            <h2 className="mb-4 font-display text-2xl font-medium text-foreground">
              12. Contact Us
            </h2>
            <p>
              If you have any questions about these Terms of Service, please contact us:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Email: <a href="mailto:support@pebric.com" className="text-foreground underline underline-offset-4 hover:text-foreground/70 transition-colors">support@pebric.com</a></li>
              <li>Visit our <Link to="/contact" className="text-foreground underline underline-offset-4 hover:text-foreground/70 transition-colors">Contact Page</Link></li>
              <li>Visit our <Link to="/support" className="text-foreground underline underline-offset-4 hover:text-foreground/70 transition-colors">Support Center</Link></li>
            </ul>
          </section>

          {/* Related link */}
          <div className="border-t border-border pt-8">
            <p className="text-sm">
              Please also review our{" "}
              <Link to="/privacy" className="text-foreground underline underline-offset-4 hover:text-foreground/70 transition-colors">
                Privacy Policy
              </Link>{" "}
              to understand how we collect, use, and protect your personal information.
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Terms;
