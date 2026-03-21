import LegalPageLayout from '../components/LegalPageLayout';

const TermsAndConditions = () => {
    return (
        <LegalPageLayout
            title="Terms and Conditions"
            effectiveDate="March 21, 2026"
            lastUpdated="March 21, 2026"
        >
            <p>
                These Terms and Conditions (&quot;Terms&quot;) govern your use of the Happy Greens platform, including our
                storefront, services, content, and ordering system. By using Happy Greens, you agree to these Terms.
            </p>

            <h2>1. Eligibility</h2>
            <p>
                You must be legally capable of entering into a binding agreement to use the Services. You are
                responsible for providing accurate and current information.
            </p>

            <h2>2. Accounts</h2>
            <p>
                You are responsible for maintaining the confidentiality of your account credentials and for all activity
                performed under your account.
            </p>

            <h2>3. Products and Availability</h2>
            <p>
                We aim to keep product details, pricing, units, stock, and images accurate. However, availability,
                pricing, packaging, and descriptions may change or contain errors from time to time.
            </p>

            <h2>4. Pricing and Orders</h2>
            <ul>
                <li>All orders are subject to acceptance and availability</li>
                <li>We may limit, reject, or cancel orders due to stock, pricing, fraud, or technical issues</li>
                <li>Applicable taxes, discounts, and delivery fees may be reflected at checkout</li>
                <li>Where unit-based pricing applies, final pricing is validated by backend systems</li>
            </ul>

            <h2>5. Payments</h2>
            <p>
                Payments may be processed through third-party providers such as Razorpay. By using these payment methods,
                you also agree to the applicable third-party terms and policies.
            </p>

            <h2>6. Delivery</h2>
            <p>
                Delivery times are estimates and may be affected by operational, traffic, weather, or logistics issues.
                You are responsible for providing accurate delivery information.
            </p>

            <h2>7. Cancellations, Refunds, and Returns</h2>
            <p>
                Refunds, replacements, and cancellations may depend on order stage, product type, perishability,
                delivery status, and quality issues. Perishable products may have limited return eligibility.
            </p>

            <h2>8. Promotions and Loyalty</h2>
            <p>
                Coupons, offers, loyalty points, and other promotional benefits may be modified, withdrawn, or reversed
                in cases of misuse, cancellation, fraud, or technical error.
            </p>

            <h2>9. Acceptable Use</h2>
            <ul>
                <li>No unlawful or fraudulent use of the platform</li>
                <li>No unauthorized access, scraping, abuse, or interference with services</li>
                <li>No misuse of rewards, promotions, discounts, or order workflows</li>
            </ul>

            <h2>10. Intellectual Property</h2>
            <p>
                All branding, software, content, designs, and related materials are owned by or licensed to Happy Greens
                unless otherwise stated.
            </p>

            <h2>11. Third-Party Services</h2>
            <p>
                Happy Greens may rely on third-party providers for payment, authentication, hosting, messaging,
                analytics, and infrastructure. We are not responsible for those third-party terms beyond our own legal
                obligations.
            </p>

            <h2>12. Disclaimer and Liability</h2>
            <p>
                The service is provided on an &quot;as is&quot; and &quot;as available&quot; basis. To the maximum extent permitted by law,
                Happy Greens is not liable for indirect, incidental, or consequential damages, service interruptions, or
                third-party failures beyond our reasonable control.
            </p>

            <h2>13. Termination</h2>
            <p>
                We may suspend or terminate access where misuse, fraud, policy violations, or legal requirements apply.
            </p>

            <h2>14. Governing Law</h2>
            <p>
                These Terms are governed by the laws of India. Disputes shall be subject to the jurisdiction of the
                courts located in the applicable business jurisdiction of Happy Greens.
            </p>

            <h2>15. Contact</h2>
            <p>
                For legal or support queries, contact <strong>support@happygreens.com</strong>.
            </p>
        </LegalPageLayout>
    );
};

export default TermsAndConditions;
