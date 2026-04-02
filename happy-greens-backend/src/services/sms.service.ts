export const sendSms = async (to: string, message: string, otp?: string) => {
    const msg91AuthKey = process.env.MSG91_AUTH_KEY;
    const msg91FlowId = process.env.MSG91_FLOW_ID;
    const msg91SenderId = process.env.MSG91_SENDER_ID;
    const msg91OtpVariable = (process.env.MSG91_OTP_VARIABLE || 'OTP').trim();
    const apiKey = process.env.FAST2SMS_API_KEY;

    // Fast2SMS expects 10-digit Indian mobile numbers.
    let formattedPhone = to.replace(/\D/g, '');
    if (formattedPhone.startsWith('91') && formattedPhone.length === 12) {
        formattedPhone = formattedPhone.slice(2);
    }

    if (formattedPhone.length !== 10) {
        throw new Error('Invalid Indian mobile number for Fast2SMS');
    }

    if (msg91AuthKey && msg91FlowId && msg91SenderId && otp) {
        try {
            console.log(`[SMS Service] Dispatching MSG91 OTP to ${formattedPhone}...`);

            const response = await fetch('https://api.msg91.com/api/v5/flow/', {
                method: 'POST',
                headers: {
                    authkey: msg91AuthKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    flow_id: msg91FlowId,
                    sender: msg91SenderId,
                    recipients: [
                        {
                            mobiles: `91${formattedPhone}`,
                            [msg91OtpVariable]: otp,
                        }
                    ]
                })
            });

            const rawResult = await response.text();
            console.log('[SMS Service] MSG91 Result:', rawResult);

            if (!response.ok) {
                throw new Error(rawResult || 'MSG91 rejected the request');
            }

            console.log(`[SMS Service] OTP sent via MSG91 to ${formattedPhone}`);
            return true;
        } catch (error: any) {
            console.error('[SMS Service] MSG91 Dispatch Error:', error.message);
            throw new Error(`SMS Dispatch Failed: ${error.message}`);
        }
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
