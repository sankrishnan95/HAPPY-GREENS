import LegalPageLayout from '../components/LegalPageLayout';

const RefundCancellationPolicy = () => {
    return (
        <LegalPageLayout
            title="Refund and Cancellation Policy"
            effectiveDate="March 21, 2026"
            lastUpdated="March 21, 2026"
        >
            <p>
                This Refund and Cancellation Policy explains how Happy Greens handles order cancellations, refunds,
                replacements, and return-related requests for grocery orders placed through our platform.
            </p>

            <h2>1. Order Cancellation</h2>
            <p>
                Orders may be cancelled before they are accepted, packed, or dispatched. Once order processing or
                dispatch has started, cancellation may no longer be available.
            </p>
            <p>We may also cancel an order in situations such as:</p>
            <ul>
                <li>product unavailability</li>
                <li>pricing or listing errors</li>
                <li>suspected fraud or abuse</li>
                <li>payment failure or verification issues</li>
                <li>delivery service limitations</li>
            </ul>

            <h2>2. Refund Eligibility</h2>
            <p>Refunds may be considered for eligible cases such as:</p>
            <ul>
                <li>order cancelled before fulfillment</li>
                <li>damaged, spoiled, or defective products</li>
                <li>wrong item delivered</li>
                <li>missing item in an order</li>
                <li>duplicate payment or failed transaction capture</li>
            </ul>

            <h2>3. Non-Returnable or Limited Return Items</h2>
            <p>
                Since Happy Greens primarily deals in grocery and other potentially perishable items, returns may be
                restricted once the order has been delivered. Fresh, temperature-sensitive, or opened items may not be
                eligible for return unless there is a quality or fulfillment issue.
            </p>

            <h2>4. Replacement or Resolution</h2>
            <p>
                Depending on the issue, we may offer one of the following resolutions:
            </p>
            <ul>
                <li>replacement of the affected item</li>
                <li>partial refund for specific missing or damaged items</li>
                <li>full refund where the entire order is impacted</li>
                <li>store credit or another reasonable resolution, where applicable</li>
            </ul>

            <h2>5. Refund Processing Time</h2>
            <p>
                Approved refunds are generally initiated to the original payment method. Actual credit timelines depend
                on your bank, card issuer, UPI provider, or payment partner. In many cases, refunds may take several
                business days after approval.
            </p>

            <h2>6. Cash on Delivery Orders</h2>
            <p>
                For eligible Cash on Delivery refund cases, we may request additional details in order to process the
                refund through an alternate supported method.
            </p>

            <h2>7. Reporting an Issue</h2>
            <p>
                If your order has a problem, please contact Happy Greens support as soon as possible with relevant order
                details. Faster reporting helps us investigate and resolve issues more effectively.
            </p>

            <h2>8. Abuse Prevention</h2>
            <p>
                Happy Greens reserves the right to reject refund, cancellation, or replacement claims that appear
                fraudulent, abusive, repetitive without merit, or inconsistent with actual order history.
            </p>

            <h2>9. Contact</h2>
            <p>
                For cancellation or refund support, contact <strong>support@happygreens.com</strong>.
            </p>
        </LegalPageLayout>
    );
};

export default RefundCancellationPolicy;
