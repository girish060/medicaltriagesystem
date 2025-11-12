# WhatsApp Reminder Setup Guide

## Overview
The triage system now sends WhatsApp reminders to patients 30 minutes before their scheduled appointments.

## Features
- ✅ Automatic WhatsApp reminders 30 minutes before appointment
- ✅ Includes appointment details (date, time, doctor, department)
- ✅ Only sends to patients with valid phone numbers
- ✅ Prevents duplicate reminders
- ✅ Logs all notifications in the database

## Setup Instructions

### 1. Get Twilio Account (Free Trial Available)

1. Sign up at [Twilio](https://www.twilio.com/try-twilio)
2. Verify your phone number
3. Get a free trial account with credits

### 2. Get Your Credentials

1. Go to [Twilio Console](https://console.twilio.com/)
2. Copy your **Account SID**
3. Copy your **Auth Token**
4. Note the WhatsApp sandbox number (usually `whatsapp:+14155238886`)

### 3. Configure Environment Variables

Create a `.env` file in `apps/api/` directory:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

### 4. Activate WhatsApp Sandbox (For Testing)

1. Go to [Twilio WhatsApp Sandbox](https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn)
2. Send the join code from your WhatsApp to the sandbox number
3. Example: Send `join <your-code>` to `+1 415 523 8886`

### 5. Patient Phone Number Format

Ensure patient phone numbers are stored in one of these formats:
- With country code: `+919876543210`
- Without country code: `9876543210` (system adds +91 automatically)

## How It Works

1. **Appointment Creation**: When an appointment is booked, it's stored in the database
2. **Scheduler Service**: Runs every minute checking for appointments 30 minutes away
3. **WhatsApp Service**: Sends formatted reminder message via Twilio API
4. **Notification Log**: Records all sent reminders in the database

## Testing Without Twilio

If Twilio credentials are not configured, the system will:
- Log the WhatsApp message to console
- Still record the notification in the database
- Continue functioning normally

Check the API logs to see the messages that would be sent.

## Message Template

```
🏥 *Appointment Reminder*

Hello [Patient Name],

Your appointment is in 30 minutes!

📅 Date: [Date]
⏰ Time: [Time]
👨‍⚕️ Doctor: [Doctor Name]
🏥 Department: [Department]

Please arrive on time to avoid delays.

Thank you!
```

## Troubleshooting

### Messages not sending?
1. Check Twilio credentials in `.env` file
2. Verify patient has valid phone number
3. Check API logs for errors
4. Ensure WhatsApp sandbox is activated (for testing)

### Phone number format issues?
- Use E.164 format: `+[country code][number]`
- For India: `+919876543210`

### Production Deployment
For production use:
1. Upgrade from Twilio sandbox to approved WhatsApp Business API
2. Get your message templates approved by WhatsApp
3. Use environment variables on your hosting platform

## Cost
- Twilio free trial: $15 credit
- WhatsApp messages: ~$0.005 per message
- 3000 free messages with trial credit
