# 🔧 Environment Variables Setup Guide

## 🎯 **Required Configuration**

### **1. Render (API Backend) Environment Variables**

Go to: https://dashboard.render.com → Your API Service → Environment Tab

#### **✅ Essential (Required)**
```env
NODE_ENV=production
PORT=10000
DATABASE_URL=postgresql://postgres.[your-ref]:[your-password]@aws-0-[region].pooler.supabase.com:6543/postgres
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
```

#### **📱 SMS/WhatsApp Notifications (Highly Recommended)**
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_SMS_NUMBER=+1234567890
```

#### **📧 Email Notifications (Optional)**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
```

#### **🗺️ Google Maps Integration (Optional)**
```env
GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### **2. Netlify (Frontend) Environment Variables**

Go to: https://app.netlify.com/projects/medicaltriagesystem → Site Settings → Environment Variables

#### **✅ Essential (Required)**
```env
VITE_API_BASE=https://medical-triage-api.onrender.com
```

---

## 🔑 **How to Get API Keys**

### **🔐 JWT Secret**
Generate a secure random string (32+ characters):
```bash
# Option 1: Use online generator
# Visit: https://generate-secret.vercel.app/32

# Option 2: Use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Option 3: Use OpenSSL
openssl rand -hex 32
```

### **📱 Twilio SMS Setup**
1. **Sign up**: https://www.twilio.com/try-twilio
2. **Get free trial**: $15 credit for testing
3. **Find credentials**: Console → Account Info
   - Account SID: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - Auth Token: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
4. **Get phone number**: Console → Phone Numbers → Manage → Buy a number
   - Format: `+1234567890`

### **📧 Gmail SMTP Setup**
1. **Enable 2FA**: Google Account → Security → 2-Step Verification
2. **Generate App Password**: Security → App passwords → Mail
3. **Use credentials**:
   - SMTP_USER: `your-email@gmail.com`
   - SMTP_PASS: `your-16-character-app-password`

### **🗺️ Google Maps API**
1. **Go to**: https://console.cloud.google.com/
2. **Enable APIs**: Maps JavaScript API, Places API, Directions API
3. **Create credentials**: APIs & Services → Credentials → Create API Key
4. **Restrict key**: Set application restrictions and API restrictions

### **🗄️ Supabase Database URL**
1. **Go to**: https://supabase.com/dashboard
2. **Select project** → Settings → Database
3. **Copy connection string**: Use the "URI" format
4. **Format**: `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`

---

## 🚀 **Quick Setup Commands**

### **For Render:**
```bash
# Set essential variables
DATABASE_URL=postgresql://postgres.your-ref:your-password@aws-0-region.pooler.supabase.com:6543/postgres
JWT_SECRET=your-generated-32-character-secret-key
NODE_ENV=production
PORT=10000

# Optional: SMS notifications
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_SMS_NUMBER=+1234567890
```

### **For Netlify:**
```bash
# Set API connection
VITE_API_BASE=https://medical-triage-api.onrender.com
```

---

## 🔍 **Testing Configuration**

### **Check API Environment**
Visit: `https://medical-triage-api.onrender.com/debug-env`

Should show:
```json
{
  "hasTwilioSid": true,
  "hasAuthToken": true,
  "hasSmsNumber": true,
  "twilioSid": "AC1234567...",
  "smsNumber": "+1234567890"
}
```

### **Check Frontend Environment**
Open browser console on your Netlify site and run:
```javascript
console.log('API_BASE:', window.location.origin)
```

---

## ⚠️ **Security Best Practices**

1. **Never commit secrets** to Git
2. **Use strong JWT secrets** (32+ characters)
3. **Restrict API keys** to specific domains/IPs
4. **Use environment variables** for all sensitive data
5. **Rotate keys regularly** in production

---

## 🎯 **Priority Setup Order**

### **Phase 1: Basic Functionality**
1. ✅ `DATABASE_URL` - Connect to database
2. ✅ `JWT_SECRET` - Enable authentication
3. ✅ `VITE_API_BASE` - Connect frontend to API

### **Phase 2: Enhanced Features**
4. 📱 Twilio SMS - Patient notifications
5. 📧 SMTP Email - Email notifications
6. 🗺️ Google Maps - Travel ETA features

---

## 🆘 **Troubleshooting**

### **Common Issues:**
- **"Failed to fetch"**: Check `VITE_API_BASE` in Netlify
- **"Database connection failed"**: Verify `DATABASE_URL` in Render
- **"SMS not sending"**: Check Twilio credentials and phone number format
- **"JWT errors"**: Ensure `JWT_SECRET` is set and consistent

### **Debug Commands:**
```bash
# Check Render logs
curl https://medical-triage-api.onrender.com/health

# Check environment variables
curl https://medical-triage-api.onrender.com/debug-env
```

---

**🎉 Once all variables are set, your Medical Triage System will be fully functional with all features enabled!**
