# Setup Service Role Key - Required for Fallback

## 🔑 **Critical: Add Service Role Key**

The API now has a **fallback mechanism** that manually creates profiles if the trigger fails. This requires the **Service Role Key**.

### **Step 1: Get Your Service Role Key**

1. Go to **Supabase Dashboard**
2. Navigate to **Settings** → **API**
3. Find **`service_role`** key (NOT the anon key)
4. Copy it (it starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### **Step 2: Add to Environment Variables**

#### **For Local Development:**

Add to `.env.local`:

```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-service-role-key-here
```

#### **For Production (Vercel):**

1. Go to **Vercel Dashboard**
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add:
   - **Name**: `SUPABASE_SERVICE_ROLE_KEY`
   - **Value**: Your service role key
   - **Environment**: Production, Preview, Development (all)
5. **Redeploy** your application

### **Step 3: Verify**

After adding the key, restart your dev server:

```bash
npm run dev
```

Or redeploy to production.

---

## ✅ **What This Fixes**

The fallback mechanism:
1. ✅ Waits for trigger to create profile (2 seconds)
2. ✅ If trigger fails, **manually creates profile** using service role
3. ✅ Bypasses RLS completely (service role has full access)
4. ✅ Marks invitation as accepted
5. ✅ Returns success

---

## 🔒 **Security Note**

⚠️ **NEVER expose the service role key in client-side code!**

- ✅ Safe in API routes (server-side only)
- ✅ Safe in environment variables
- ❌ NEVER in `NEXT_PUBLIC_*` variables
- ❌ NEVER in browser code

---

## 🧪 **Test After Setup**

1. Add the service role key to your environment
2. Restart/redeploy
3. Try creating account again
4. Check server logs - you should see:
   ```
   [API] Profile created manually: { id: ..., email: ..., role: 'admin' }
   ```

---

**After adding the service role key, the fallback will work even if triggers fail!** 🚀

