# Password Reset Email Debugging Guide

If you're seeing the success message but not receiving emails, follow these steps:

## Step 1: Check Environment Variables

The most common issue is that `RESEND_API_KEY` is not set or not loaded properly.

### Check if RESEND_API_KEY is set:

1. **Check your `.env.local` or `.env` file:**
   ```bash
   RESEND_API_KEY=re_your_actual_api_key_here
   ```

2. **Verify it's loaded in your application:**
   - Restart your Next.js development server after adding/changing environment variables
   - In production, ensure the environment variable is set in your hosting platform (Vercel, etc.)

3. **Check server logs:**
   When you request a password reset, you should see one of these in your server console:
   
   - ✅ **Success:** `[Email] Password reset email sent successfully. Resend ID: ...`
   - ❌ **API Key Missing:** `[Email] RESEND_API_KEY is not configured. Cannot send password reset email.`
   - ❌ **API Error:** `[Email] Failed to send password reset email. Status: ...`

## Step 2: Check Server Logs

After requesting a password reset, check your server console/terminal for these log messages:

### If email was sent successfully:
```
[Agency Auth] Password reset email sent successfully to: user@example.com
[Email] Password reset email sent successfully. Resend ID: abc123...
```

### If RESEND_API_KEY is missing:
```
[Email] RESEND_API_KEY is not configured. Cannot send password reset email.
[Email] Password reset URL (for manual sharing): http://localhost:3000/agency/...
[Agency Auth] Password reset email NOT sent. RESEND_API_KEY may be missing.
```

### If there's an API error:
```
[Email] Failed to send password reset email. Status: 401
[Email] Error response: {"message": "Invalid API key"}
```

## Step 3: Verify Resend API Key

1. **Get your API key from Resend:**
   - Go to https://resend.com/api-keys
   - Create a new API key or use an existing one
   - Copy the key (starts with `re_`)

2. **Verify the key works:**
   - The key should have permission to send emails
   - Check your Resend dashboard for any errors or rate limits

3. **Check the "from" address:**
   - The `INVITE_EMAIL_FROM` environment variable should be a verified domain in Resend
   - Default is: `Finest Africa <admin@finestafrica.ai>`
   - Make sure this domain/email is verified in your Resend account

## Step 4: Common Issues and Solutions

### Issue 1: RESEND_API_KEY not set
**Solution:** Add `RESEND_API_KEY=re_your_key` to your `.env.local` file and restart the server.

### Issue 2: Invalid API Key
**Solution:** 
- Verify the key in Resend dashboard
- Make sure you copied the entire key (they're long)
- Check for any extra spaces or characters

### Issue 3: Domain not verified
**Solution:**
- In Resend dashboard, verify your sending domain
- Update `INVITE_EMAIL_FROM` to use a verified domain
- Or use Resend's test domain for development

### Issue 4: Email going to spam
**Solution:**
- Check spam/junk folder
- Verify SPF/DKIM records are set up correctly in Resend
- Use a verified domain for better deliverability

### Issue 5: Rate limiting
**Solution:**
- Check Resend dashboard for rate limit status
- Wait a few minutes and try again
- Upgrade your Resend plan if needed

## Step 5: Test Email Sending

You can test if your email configuration works by checking the server logs when:
1. Creating a new agency (should send password reset email)
2. Requesting a password reset via forgot password page

## Step 6: Development Mode

In development mode, if `RESEND_API_KEY` is not set, the reset URL will be logged to the console. You can:
1. Copy the URL from server logs
2. Share it manually with the user
3. Or set up `RESEND_API_KEY` for automated emails

## Quick Checklist

- [ ] `RESEND_API_KEY` is set in `.env.local` or environment variables
- [ ] Server was restarted after adding environment variable
- [ ] API key is valid and active in Resend dashboard
- [ ] Sending domain is verified in Resend
- [ ] Checked server logs for error messages
- [ ] Checked spam folder for emails
- [ ] Verified email address is correct

## Getting Help

If emails still aren't sending after checking all of the above:

1. **Check Resend Dashboard:**
   - Go to https://resend.com/emails
   - Look for failed email attempts
   - Check error messages

2. **Check Server Logs:**
   - Look for `[Email]` prefixed messages
   - Look for `[Agency Auth]` prefixed messages
   - Share relevant error messages when asking for help

3. **Test with a simple email:**
   - Try sending a test email directly from Resend dashboard
   - Verify your domain/API key works

