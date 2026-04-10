import LegalPageLayout from '../components/LegalPageLayout';

const PrivacyPolicy = () => {
    return (
        <LegalPageLayout
            title="Privacy Policy"
            effectiveDate="March 21, 2026"
            lastUpdated="March 21, 2026"
        >
            <p>
                This Privacy Policy explains how Happy Greens collects, uses, stores, and protects personal information
                when you use our website, storefront, checkout, support channels, and related services.
            </p>

            <h2>1. Information We Collect</h2>
            <p>We may collect information that you provide directly or that is generated through your use of the platform.</p>
            <ul>
                <li>Account details such as name, email address, and phone number</li>
                <li>Authentication details such as login method and verification status</li>
                <li>Order information such as delivery address, order history, and payment references</li>
                <li>Preference data such as cart, wishlist, and loyalty activity</li>
                <li>Technical and usage data such as device type, browser, product views, and checkout events</li>
            </ul>

            <h2>2. How We Use Information</h2>
            <ul>
                <li>To create and manage user accounts</li>
                <li>To authenticate users and secure access to services</li>
                <li>To process orders, payments, refunds, and deliveries</li>
                <li>To send OTPs, invoices, service notifications, and support responses</li>
                <li>To improve platform performance, analytics, and customer experience</li>
                <li>To detect and prevent fraud, abuse, and unauthorized access</li>
            </ul>

            <h2>3. Sharing of Information</h2>
            <p>We do not sell personal information. We may share limited data with service providers only where necessary.</p>
            <ul>
                <li>Payment providers</li>
                <li>Authentication providers such as Google and Firebase</li>
                <li>SMS, email, analytics, hosting, and infrastructure providers</li>
                <li>Delivery and logistics partners</li>
                <li>Authorities or regulators where disclosure is legally required</li>
            </ul>

            <h2>4. Payments and Security</h2>
            <p>
                Payments are processed through third-party payment providers. Happy Greens does not store full card
                details on its own servers. We use reasonable security measures such as authentication controls, input
                validation, password hashing, and secure communication where applicable.
            </p>

            <h2>5. Cookies and Local Storage</h2>
            <p>
                We use cookies and browser storage to keep users signed in, retain cart and wishlist data, remember
                preferences, and support platform functionality.
            </p>

            <h2>6. Data Retention</h2>
            <p>
                We retain information only for as long as needed to provide services, maintain records, resolve
                disputes, meet legal obligations, and protect the platform from misuse.
            </p>

            <h2>7. Your Choices and Rights</h2>
            <p>
                Subject to applicable law, you may request access to, correction of, or deletion of your personal
                information. You may also contact us to update your profile details or raise privacy questions.
            </p>

            <h2>8. Children&apos;s Privacy</h2>
            <p>
                Happy Greens is not intended for children under the minimum legal age required to use online purchasing
                services in the applicable jurisdiction.
            </p>

            <h2>9. Policy Updates</h2>
            <p>
                We may update this Privacy Policy from time to time. The revised version will be posted on this page
                with an updated effective date.
            </p>

            <h2>10. Contact</h2>
            <p>
                For privacy-related questions, please contact <strong>happygreenspy@gmail.com</strong>.
            </p>
        </LegalPageLayout>
    );
};

export default PrivacyPolicy;
