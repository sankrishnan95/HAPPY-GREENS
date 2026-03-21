import LegalPageLayout from '../components/LegalPageLayout';

const PrivacyPolicy = () => {
    return (
        <LegalPageLayout
            title="Privacy Policy"
            effectiveDate="March 21, 2026"
            lastUpdated="March 21, 2026"
        >
            <p>
                Happy Greens (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) values your privacy. This Privacy Policy explains how we collect,
                use, store, share, and protect your information when you use our website, storefront, admin systems,
                and related services.
            </p>

            <h2>1. Information We Collect</h2>
            <p>We may collect the following categories of information:</p>
            <ul>
                <li>Account information such as name, email, phone number, and login details</li>
                <li>Order and transaction data such as delivery address, order history, and payment references</li>
                <li>Wishlist, cart, loyalty, and profile preferences</li>
                <li>Device, browser, and usage information including product views and checkout activity</li>
                <li>Communication records such as OTP requests, support messages, and order notifications</li>
            </ul>

            <h2>2. How We Use Information</h2>
            <ul>
                <li>To create and manage your account</li>
                <li>To authenticate users and secure platform access</li>
                <li>To process orders, payments, and deliveries</li>
                <li>To send OTPs, invoices, and service-related notifications</li>
                <li>To improve platform performance, analytics, and customer experience</li>
                <li>To prevent fraud, abuse, and unauthorized access</li>
            </ul>

            <h2>3. Sharing of Information</h2>
            <p>We do not sell your personal information. We may share limited data with service providers such as:</p>
            <ul>
                <li>Payment providers</li>
                <li>Authentication providers such as Google and Firebase</li>
                <li>SMS, email, hosting, analytics, and infrastructure providers</li>
                <li>Delivery and logistics partners</li>
                <li>Legal or regulatory authorities where required by law</li>
            </ul>

            <h2>4. Payments</h2>
            <p>
                Payment processing is handled through third-party providers. We do not store full card details on our
                own servers.
            </p>

            <h2>5. Cookies and Local Storage</h2>
            <p>
                We use cookies and local storage to keep users logged in, remember cart and wishlist data, store
                preferences, and improve security and usability.
            </p>

            <h2>6. Data Retention</h2>
            <p>
                We retain data only for as long as necessary to provide services, comply with legal obligations, resolve
                disputes, prevent fraud, and maintain business records.
            </p>

            <h2>7. Security</h2>
            <p>
                We use reasonable technical and organizational safeguards including authentication controls, password
                hashing, input validation, and HTTPS-based communication where applicable. No system can guarantee
                absolute security.
            </p>

            <h2>8. Your Rights</h2>
            <p>
                Depending on applicable law, you may have the right to access, correct, update, or request deletion of
                your information. You may contact us to make such requests.
            </p>

            <h2>9. Children&apos;s Privacy</h2>
            <p>
                Happy Greens is not intended for children under the age of 18 or the minimum legal age required in your
                jurisdiction to enter into online transactions.
            </p>

            <h2>10. Changes to This Policy</h2>
            <p>
                We may update this Privacy Policy from time to time. Continued use of the platform after updates means
                you accept the revised policy.
            </p>

            <h2>11. Contact</h2>
            <p>
                For privacy questions, support, or legal requests, contact us at <strong>support@happygreens.com</strong>.
            </p>
        </LegalPageLayout>
    );
};

export default PrivacyPolicy;
