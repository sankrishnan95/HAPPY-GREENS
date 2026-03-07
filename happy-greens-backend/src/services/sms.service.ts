export const sendSms = async (to: string, message: string, otp?: string) => {
    const apiKey = process.env.FAST2SMS_API_KEY;

    // Fast2SMS expects 10-digit Indian mobile numbers.
    let formattedPhone = to.replace(/\D/g, '');
    if (formattedPhone.startsWith('91') && formattedPhone.length === 12) {
        formattedPhone = formattedPhone.slice(2);
    }

    if (formattedPhone.length !== 10) {
        throw new Error('Invalid Indian mobile number for Fast2SMS');
    }

    if (apiKey && otp) {
        try {
            console.log(`[SMS Service] Dispatching Fast2SMS OTP to ${formattedPhone}...`);

            const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
                method: 'POST',
                headers: {
                    authorization: apiKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    route: 'otp',
                    variables_values: otp,
                    numbers: formattedPhone
                })
            });

            const result = await response.json();
            console.log('[SMS Service] Fast2SMS Result:', JSON.stringify(result));

            if (!response.ok || result.return !== true) {
                const reason = Array.isArray(result.message) ? result.message.join(', ') : (result.message || 'Fast2SMS rejected the request');
                throw new Error(reason);
            }

            console.log(`[SMS Service] OTP sent via Fast2SMS! Request ID: ${result.request_id || 'N/A'}`);
            return true;
        } catch (error: any) {
            console.error('[SMS Service] Fast2SMS Dispatch Error:', error.message);
            throw new Error(`SMS Dispatch Failed: ${error.message}`);
        }
    }

    // MOCKED SMS FOR DEVELOPMENT
    console.log('\n======================================================');
    console.log(`[SMS Service - MOCKED] Sending OTP to: ${formattedPhone}`);
    if (otp) {
        console.log(`OTP: ${otp}`);
    } else {
        console.log(`Message: ${message}`);
    }
    console.log('======================================================\n');
    return true;
};
