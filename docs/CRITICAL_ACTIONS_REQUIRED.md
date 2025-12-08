# ⚠️ CRITICAL MANUAL ACTIONS REQUIRED

**Before running the application in production, you MUST complete these 3 actions:**

---

## 1. 🔐 SET MYSQL ROOT PASSWORD (CRITICAL)

**Current Status:** ❌ Database has NO PASSWORD  
**Risk Level:** 🔴 CRITICAL - Anyone can access your database

### Steps:

```bash
# Open MySQL
mysql -u root

# Set a strong password
ALTER USER 'root'@'localhost' IDENTIFIED BY 'YourStrongPassword123!@#';
FLUSH PRIVILEGES;
exit;
```

### Update .env file:

```env
DATABASE_PASSWORD=YourStrongPassword123!@#
DATABASE_URL=mysql://root:YourStrongPassword123!@#@localhost:3306/hologram
```

**Password Requirements:**
- Minimum 12 characters
- Mix of uppercase, lowercase, numbers, symbols
- Don't use: "password", "admin", "123456", school name

---

## 2. 🔑 REGENERATE GROQ API KEY (CRITICAL)

**Current Status:** ❌ API key may be exposed  
**Risk Level:** 🔴 CRITICAL - Unauthorized API usage

### Steps:

1. Visit: https://console.groq.com/keys
2. Log in to your Groq account
3. Click "Create API Key"
4. Copy the new key (starts with `gsk_`)
5. Delete your old API key from Groq console

### Update .env file:

```env
GROQ_API_KEY=gsk_your_new_api_key_here
```

**Important:** The old key in your .env may have been exposed. Always regenerate API keys if they appear in:
- Git commits
- Screenshots
- Documentation
- Shared files

---

## 3. 👤 CREATE SECURE ADMIN USER (CRITICAL)

**Current Status:** ❌ No admin user exists  
**Risk Level:** 🔴 CRITICAL - Cannot access admin panel

### Steps:

#### Step 1: Generate Password Hash
```bash
node scripts/generate-hash.js YourSecurePassword123!
```

This will output SQL like:
```sql
INSERT INTO admin_users (id, username, password, role, full_name, email, created_at) 
VALUES (UUID(), 'yourusername', '$2a$10$hash...', 'admin', 'Your Name', 'your@email.com', NOW());
```

#### Step 2: Insert into Database
```bash
mysql -u root -p hologram
# (enter your MySQL password from step 1)

# Paste the SQL command from step 1
# Example:
INSERT INTO admin_users (id, username, password, role, full_name, email, created_at) 
VALUES (UUID(), 'admin', '$2a$10$abcd...', 'admin', 'Administrator', 'admin@westmead.edu', NOW());

# Exit MySQL
exit;
```

**Admin User Requirements:**
- Username: 3-50 characters, alphanumeric only
- Password: 8+ characters, must have uppercase, lowercase, number
- Email: Valid email format
- Full Name: Your actual name

---

## ✅ VERIFICATION CHECKLIST

After completing all 3 steps:

- [ ] MySQL root password is set
- [ ] `.env` has DATABASE_PASSWORD filled
- [ ] DATABASE_URL includes password
- [ ] New Groq API key generated
- [ ] Old Groq API key deleted from console
- [ ] `.env` has new GROQ_API_KEY
- [ ] Admin user created in database
- [ ] Can log in to admin panel
- [ ] Test login with admin credentials

---

## 🧪 TEST YOUR SECURITY

### Test MySQL Password:
```bash
# This should REQUIRE password:
mysql -u root -p
```

### Test Admin Login:
1. Run: `npm run dev`
2. Go to: http://localhost:3000/admin
3. Log in with admin credentials
4. Should successfully reach admin dashboard

### Test API Key:
1. Ask a question in the chat
2. Should get AI response
3. Check server logs for no API errors

---

## 🚨 COMMON MISTAKES TO AVOID

❌ **DON'T:**
- Use weak passwords like "admin123" or "password"
- Keep the default/example passwords
- Share your `.env` file with anyone
- Commit `.env` to Git
- Use the same password for everything
- Screenshot your `.env` file

✅ **DO:**
- Use unique, strong passwords
- Store passwords in password manager
- Keep `.env` file local only
- Use different passwords for DB and admin
- Back up your `.env` securely
- Test everything after setup

---

## 📞 NEED HELP?

If you encounter issues:

1. **MySQL Connection Error:**
   - Check DATABASE_URL format: `mysql://username:password@host:port/database`
   - Verify MySQL is running: `services.msc` (Windows)
   - Test connection: `mysql -u root -p`

2. **Admin Login Fails:**
   - Verify user exists: `SELECT * FROM admin_users;`
   - Check password hash was generated correctly
   - Try regenerating hash with `generate-hash.js`

3. **API Key Error:**
   - Verify key starts with `gsk_`
   - Check for extra spaces in .env
   - Test key at https://console.groq.com/playground

---

## ⏱️ ESTIMATED TIME

- **Step 1 (MySQL):** 5 minutes
- **Step 2 (API Key):** 5 minutes  
- **Step 3 (Admin User):** 5 minutes
- **Testing:** 5 minutes

**Total:** ~20 minutes

---

## 🎓 FOR THESIS DEFENSE

Be prepared to explain:
- Why you removed default credentials
- How you secured the database
- Your password policy
- API key management strategy
- Security best practices followed

---

**⚠️ SECURITY WARNING:**  
**Your application will NOT work properly until all 3 actions are completed!**

**DO NOT SKIP THESE STEPS!**

