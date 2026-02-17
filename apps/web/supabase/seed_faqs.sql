-- Clear existing FAQs to avoid duplicates (optional, use with caution)
-- DELETE FROM faqs;

INSERT INTO faqs (category, question, answer, sort_order, is_active) VALUES
-- Ordering
('ordering', 'How do I place an order?', 'Browse our collection, select your desired items and sizes, and click "Add to Cart". Once you''re ready, proceed to checkout, enter your details, and complete the payment.', 1, true),
('ordering', 'Can I modify or cancel my order?', 'Orders can be modified or canceled within 24 hours of placement. Please contact our support team immediately with your order ID.', 2, true),
('ordering', 'Do I need an account to place an order?', 'Yes, you need to create an account to place an order. This allows you to track your order and save your details for faster checkout.', 3, true),
('ordering', 'How do I track my order?', 'Once your order is shipped, you will receive a tracking link via email and SMS. You can also track it in the "My Orders" section of your account.', 4, true),

-- Shipping
('shipping', 'What are the shipping charges?', 'We offer free shipping on all orders above ₹999. For orders below that, a flat shipping fee of ₹99 applies.', 5, true),
('shipping', 'How long does delivery take?', 'Standard delivery takes 3-7 business days depending on your location. Metros usually receive orders within 3-4 days.', 6, true),
('shipping', 'Do you ship internationally?', 'Currently, we only ship within India. We are working on expanding our delivery network globally.', 7, true),
('shipping', 'What if I am not available to receive the delivery?', 'Our courier partner will attempt delivery 3 times. If you are unavailable, please contact us or the courier service to reschedule.', 8, true),

-- Returns & Exchanges
('returns', 'What is your return policy?', 'We offer a 7-day hassle-free return policy. Items must be unused, unwashed, and with original tags intact.', 9, true),
('returns', 'How do I initiate a return?', 'Go to "My Orders", select the order you want to return, and click "Return". Follow the instructions to schedule a pickup.', 10, true),
('returns', 'When will I get my refund?', 'Refunds are processed within 5-7 business days after the returned item reaches our warehouse and passes quality checks.', 11, true),
('returns', 'Can I exchange an item for a different size?', 'Yes, we offer free size exchanges. Select the "Exchange" option in your order details and choose the new size.', 12, true),

-- Sizing
('sizing', 'How do I know my size?', 'Please check our Size Guide available on every product page. If you are unsure, reliable measurements of your chest, waist, and hips will help.', 13, true),
('sizing', 'Do you have sizes for all dog breeds?', 'Our pet clothing comes in sizes XS to XXL, covering most breeds from Chihuahuas to Golden Retrievers. Check the pet size chart for details.', 14, true),
('sizing', 'What if the size doesn''t fit?', 'Don''t worry! You can easily exchange it for a different size within 7 days of delivery.', 15, true),

-- Payments
('payments', 'What payment methods do you accept?', 'We accept UPI (GPay, PhonePe, Paytm), Credit/Debit Cards, Net Banking, and Cash on Delivery (COD).', 16, true),
('payments', 'Is it safe to use my card on your website?', 'Yes, all payments are processed through Razorpay, which is 100% secure and encrypted. We do not store your card details.', 17, true),
('payments', 'Is Cash on Delivery (COD) available?', 'Yes, COD is available for most pin codes. There is no extra charge for COD orders.', 18, true),
('payments', 'My payment failed but money was deducted. What do I do?', 'Please wait for 24 hours as it is usually auto-refunded. If not, contact our support with the transaction ID.', 19, true),

-- General
('general', 'Where are your products made?', 'All our products are proudly designed and manufactured in India using high-quality sustainable fabrics.', 20, true),
('general', 'How do I contact customer support?', 'You can reach us via the "Contact Us" page, email us at support@pebric.com, or use the chat widget for quick assistance.', 21, true),
('general', 'Do you offer gift wrapping?', 'Yes, you can select the gift wrapping option at checkout for a nominal fee. We also verify special notes.', 22, true);
