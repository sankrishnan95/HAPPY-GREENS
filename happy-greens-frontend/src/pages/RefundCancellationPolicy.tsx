import LegalPageLayout from '../components/LegalPageLayout';

const RefundCancellationPolicy = () => {
    return (
        <LegalPageLayout
            title="Refund and Cancellation Policy"
            effectiveDate="March 21, 2026"
            lastUpdated="March 21, 2026"
        >
            <p>
                This policy explains how Happy Greens handles order cancellation, refunds, replacements, and
                return-related requests for grocery orders placed through the platform.
            </p>

            <h2>1. Order Cancellation</h2>
            <p>
                Orders may be cancelled before they are accepted, packed, or dispatched. Once processing or dispatch
                has begun, cancellation may no longer be available.
            </p>
            <p>We may also cancel an order due to stock issues, pricing errors, payment failure, delivery limitations, or suspected misuse.</p>

            <h2>2. Refund Eligibility</h2>
            <p>Refunds may be considered in cases such as:</p>
            <ul>
                <li>successful cancellation before fulfillment</li>
                <li>missing items</li>
                <li>wrong items delivered</li>
                <li>damaged, spoiled, or defective items</li>
                <li>duplicate or failed payment capture</li>
            </ul>

            <h2>3. Perishable Items</h2>
            <p>
                Because Happy Greens mainly supplies grocery and perishable products, returns may be restricted after
                delivery unless the issue relates to quality, damage, or fulfillment error.
            </p>

            <h2>4. Resolution Options</h2>
            <p>Depending on the nature of the issue, we may offer:</p>
            <ul>
                <li>item replacement</li>
                <li>partial refund</li>
                <li>full refund</li>
                <li>store credit or another appropriate resolution</li>
            </ul>

            <h2>5. Refund Processing Time</h2>
            <p>
                Approved refunds are usually initiated to the original payment method. Final settlement time depends on
                your bank, card issuer, UPI provider, or payment gateway.
            </p>

            <h2>6. Cash on Delivery Orders</h2>
            <p>
                For eligible cash-on-delivery cases, Happy Greens may request additional details to process the refund
                through an alternative supported method.
            </p>

            <h2>7. Reporting a Problem</h2>
            <p>
                Customers should report order issues as soon as possible with order details and, where relevant, photo
                evidence. Delayed reporting may affect available resolution options.
            </p>

            <h2>8. Abuse Prevention</h2>
            <p>
                Happy Greens may reject claims that appear fraudulent, abusive, repetitive without merit, or inconsistent
                with order records.
            </p>

            <h2>9. Contact</h2>
            <p>
                For refund or cancellation support, contact <strong>happygreens80@gmail.com</strong>.
            </p>
        </LegalPageLayout>
    );
};

export default RefundCancellationPolicy;
