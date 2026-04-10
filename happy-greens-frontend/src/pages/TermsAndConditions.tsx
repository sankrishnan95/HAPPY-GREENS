import LegalPageLayout from '../components/LegalPageLayout';

const TermsAndConditions = () => {
    return (
        <LegalPageLayout
            title="Terms and Conditions"
            effectiveDate="March 21, 2026"
            lastUpdated="March 21, 2026"
        >
            <p>
                These Terms and Conditions govern your use of Happy Greens, including browsing products, creating an
                account, placing orders, making payments, and using related services on the platform.
            </p>

            <h2>1. Eligibility</h2>
            <p>
                By using Happy Greens, you confirm that you are legally capable of entering into a binding transaction
                and that the information you provide is accurate and current.
            </p>

            <h2>2. Accounts</h2>
            <p>
                You are responsible for keeping your login credentials secure and for activity performed through your
                account. We may suspend or restrict access where fraud, misuse, or policy violations are detected.
            </p>

            <h2>3. Products and Availability</h2>
            <p>
                We aim to keep product details, pricing, units, stock, and descriptions accurate. However, some product
                details may change due to operational updates, supplier changes, or technical errors.
            </p>

            <h2>4. Orders</h2>
            <p>
                All orders are subject to confirmation, stock availability, payment verification, and operational
                acceptance. Happy Greens may limit, reject, or cancel orders where required for legal, technical, stock,
                or fraud-prevention reasons.
            </p>

            <h2>5. Payments</h2>
            <p>
                Payments may be processed through third-party payment providers. By using such methods, you also agree
                to the applicable provider terms. Happy Greens may decline or reverse a transaction where payment
                irregularity or abuse is detected.
            </p>

            <h2>6. Delivery</h2>
            <p>
                Delivery timelines are estimates only. Delays may occur due to stock issues, operational conditions,
                traffic, weather, or delivery partner constraints. Users must provide accurate delivery details.
            </p>

            <h2>7. Cancellations and Refunds</h2>
            <p>
                Cancellation, refund, and replacement outcomes depend on order stage, item type, perishability, and the
                nature of the issue reported. Additional policy details are provided in the Refund and Cancellation
                Policy.
            </p>

            <h2>8. Offers, Coupons, and Loyalty</h2>
            <p>
                Promotional offers, loyalty points, discounts, and coupon benefits may be limited, withdrawn, or
                reversed where misuse, cancellation, or fraud is identified.
            </p>

            <h2>9. Acceptable Use</h2>
            <ul>
                <li>No fraudulent, unlawful, or abusive use of the platform</li>
                <li>No unauthorized access, scraping, interference, or misuse of APIs or services</li>
                <li>No manipulation of pricing, offers, rewards, or ordering workflows</li>
            </ul>

            <h2>10. Intellectual Property</h2>
            <p>
                The platform design, software, branding, content, and related materials belong to Happy Greens or its
                licensors unless otherwise stated.
            </p>

            <h2>11. Liability</h2>
            <p>
                To the extent permitted by law, Happy Greens is not liable for indirect, incidental, or consequential
                loss arising from service interruption, third-party failures, or use of the platform beyond our
                reasonable control.
            </p>

            <h2>12. Governing Law</h2>
            <p>
                These Terms are governed by the laws of India. Disputes are subject to the jurisdiction of the
                applicable courts in the business jurisdiction of Happy Greens.
            </p>

            <h2>13. Contact</h2>
            <p>
                For legal or service-related questions, contact <strong>happygreenspy@gmail.com</strong>.
            </p>
        </LegalPageLayout>
    );
};

export default TermsAndConditions;
