# QUICK FIX GUIDE - Critical Issues
## Complete These Steps Before Thesis Defense

---

## ⏱️ 15-MINUTE CRITICAL FIXES

### 1. Secure Your Database (5 minutes)

```powershell
# Open MySQL command line
mysql -u root

# Run these commands in MySQL:
ALTER USER 'root'@'localhost' IDENTIFIED BY 'WestmeadSecure2024!@#';
FLUSH PRIVILEGES;
exit;
```

Then update your `.env` file:
```env
DATABASE_PASSWORD=WestmeadSecure2024!@#
DATABASE_URL=mysql://root:WestmeadSecure2024!@#@localhost:3306/hologram
```

---

### 2. Generate New API Key (3 minutes)

1. Go to https://console.groq.com/keys
2. Click "Create API Key"
3. Copy the new key
4. Update `.env`:
```env
GROQ_API_KEY=your_new_key_here
```
5. Delete the old key from Groq dashboard

---

### 3. Generate Secure Session Secret (2 minutes)

```powershell
# Run this in PowerShell:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the output and update `.env`:
```env
SESSION_SECRET=the_generated_hex_string
```

---

### 4. Remove Default Admin from Seed (5 minutes)

Edit `migrations/0002_seed_data.sql` and comment out the admin line:

```sql
-- DO NOT USE DEFAULT ADMIN IN PRODUCTION
-- INSERT INTO admin_users (id, username, password, role, full_name, email) VALUES 
-- ('admin-uuid-12345', 'admin', '$2b$10$ptFUWfS1r4OoynMyJ3gykelE/KsAjkX5YyG1MVjFzqXYDE1.tZa8a', 'admin', 'System Administrator', 'admin@westmead.edu.ph')
-- ON DUPLICATE KEY UPDATE password=VALUES(password);
```

Create your admin manually in MySQL:
```sql
-- Use a unique username and strong password
INSERT INTO admin_users (id, username, password, role, full_name, email) 
VALUES (
  UUID(), 
  'your_username', 
  '$2b$10$YOUR_BCRYPT_HASH_HERE',  -- Generate this with scripts/generate-hash.js
  'admin', 
  'Your Name', 
  'your.email@westmead.edu.ph'
);
```

---

## ⏱️ 30-MINUTE ESSENTIAL FIXES

### 5. Add Rate Limiting (15 minutes)

Install the package:
```powershell
npm install express-rate-limit
```

Add to `server/routes.ts` at the top:
```typescript
import rateLimit from 'express-rate-limit';

// Add these rate limiters before the routes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute
  message: { error: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});
```

Update the routes:
```typescript
// Change this line:
app.post("/api/auth/login", async (req, res) => {

// To this:
app.post("/api/auth/login", loginLimiter, async (req, res) => {

// Change this line:
app.post("/api/chat", async (req, res) => {

// To this:
app.post("/api/chat", chatLimiter, async (req, res) => {
```

---

### 6. Add Input Validation (15 minutes)

Update `shared/schema.ts`:
```typescript
// Replace the insertQuerySchema:
export const insertQuerySchema = createInsertSchema(queries).omit({
  id: true,
  createdAt: true,
}).extend({
  question: z.string().min(1, "Question cannot be empty").max(1000, "Question too long").trim(),
  answer: z.string().min(1).max(5000).trim(),
  userType: z.enum(['visitor', 'student', 'parent']).default('visitor'),
  category: z.string().max(50).nullable().optional(),
  responseTime: z.number().int().positive().optional(),
});

// Replace the insertFaqSchema:
export const insertFaqSchema = createInsertSchema(faqs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  question: z.string().min(10, "Question too short").max(500, "Question too long").trim(),
  answer: z.string().min(20, "Answer too short").max(2000, "Answer too long").trim(),
  category: z.enum(['admissions', 'academic', 'campus', 'scholarships', 'general']),
  priority: z.number().int().min(0).max(100).default(0),
  isActive: z.boolean().default(true),
});

// Replace the insertAdminUserSchema:
export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({
  id: true,
  createdAt: true,
}).extend({
  username: z.string().min(3, "Username too short").max(50).trim().toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
  role: z.enum(['admin', 'professor']).default('admin'),
  fullName: z.string().min(3).max(100).trim(),
  email: z.string().email("Invalid email format").max(255).trim().toLowerCase(),
});
```

---

## ⏱️ 1-HOUR IMPROVEMENTS

### 7. Add Database Connection Limits (5 minutes)

Update `server/db.ts`:
```typescript
export const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  connectionLimit: 10,
  queueLimit: 0,
  waitForConnections: true,
  maxIdle: 10,
  idleTimeout: 60000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});
```

---

### 8. Add CORS Configuration (10 minutes)

Install package:
```powershell
npm install cors
npm install -D @types/cors
```

Add to `server/index.ts`:
```typescript
import cors from 'cors';

// Add after app.use(express.urlencoded...):
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com'] 
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

---

### 9. Add React Error Boundary (15 minutes)

Create `client/src/components/ErrorBoundary.tsx`:
```tsx
import React, { Component, ErrorInfo, ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="text-destructive">Something went wrong</CardTitle>
              <CardDescription>The application encountered an error</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {this.state.error?.message || 'Unknown error occurred'}
              </p>
              <Button 
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Reload Application
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
```

Update `client/src/main.tsx`:
```tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';

root.render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
        <Toaster />
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);
```

---

### 10. Fix README Documentation (5 minutes)

Update `README.md` line 64:
```markdown
# Change from:
# OpenAI API configuration
OPENAI_API_KEY=your_groq_api_key_here

# To:
# Groq API configuration (get your key from https://console.groq.com/keys)
GROQ_API_KEY=your_groq_api_key_here
```

---

### 11. Add API Documentation (25 minutes)

Create `API_DOCUMENTATION.md`:
```markdown
# API Documentation

## Authentication Endpoints

### POST /api/auth/login
Login with username and password
- **Body:** `{ username: string, password: string }`
- **Response:** `{ user: { id, username, role, fullName, email } }`
- **Errors:** 400 (missing fields), 401 (invalid credentials)

### POST /api/auth/logout
Logout current session
- **Response:** `{ success: true }`

### GET /api/auth/me
Get current user info (requires authentication)
- **Response:** `{ user: { id, username, role, fullName, email } }`
- **Errors:** 401 (not authenticated), 404 (user not found)

## Chat Endpoint

### POST /api/chat
Send a question to the AI assistant
- **Body:** `{ question: string, userType?: 'visitor' | 'student' | 'parent' }`
- **Response:** `{ answer: string, speechText: string, category: string, queryId: string }`
- **Rate Limit:** 20 requests per minute
- **Errors:** 400 (missing question), 500 (AI error)

## Admin Endpoints (require authentication)

### GET /api/admin/queries
Get all user queries
- **Response:** `Query[]`

### GET /api/admin/faqs
Get all FAQs
- **Response:** `Faq[]`

### POST /api/admin/faqs
Create new FAQ
- **Body:** `{ question, answer, category, priority?, isActive? }`
- **Response:** `Faq`

### PATCH /api/admin/faqs/:id
Update FAQ
- **Body:** Partial FAQ fields
- **Response:** `Faq`

### DELETE /api/admin/faqs/:id
Delete FAQ
- **Response:** `{ success: true }`

### GET /api/admin/users (requires admin role)
Get all users
- **Response:** `User[]` (without passwords)

### POST /api/admin/users (requires admin role)
Create new user
- **Body:** `{ username, password, role, fullName, email }`
- **Response:** `User` (without password)

### DELETE /api/admin/users/:id (requires admin role)
Delete user
- **Response:** `{ success: true }`
```

---

## ✅ VERIFICATION CHECKLIST

After completing all fixes, verify:

- [ ] MySQL root user has a password
- [ ] .env has new Groq API key
- [ ] .env has cryptographically random SESSION_SECRET
- [ ] Default admin removed from seed file
- [ ] Rate limiting works (test by spamming login)
- [ ] Long inputs are rejected with proper error messages
- [ ] App still runs: `npm run dev`
- [ ] Can login to admin panel
- [ ] Chat still works
- [ ] Error boundary catches errors (test by throwing error in code)
- [ ] README is accurate
- [ ] .env.example exists

---

## 🎓 FOR THESIS DEFENSE

### Be Ready to Demonstrate:
1. Show `.env.example` - "I don't expose real credentials"
2. Show rate limiting - "Try to spam login, it blocks after 5 attempts"
3. Show input validation - "Try to send a 10,000 character message, it rejects it"
4. Show error handling - "Even if something breaks, users see a helpful message"
5. Explain security measures - "I use bcrypt for passwords, session-based auth, parameterized queries via ORM"

### Practice Answers:
**Q: "Is this secure for production?"**
A: "Yes, with these fixes: rate limiting prevents abuse, input validation prevents malicious data, environment variables protect secrets, bcrypt protects passwords, and Drizzle ORM prevents SQL injection."

**Q: "What if the database goes down?"**
A: "The app shows error messages to users and logs errors. In production, I would add health checks and automatic retries with exponential backoff."

**Q: "How do you handle concurrent users?"**
A: "MySQL connection pooling handles 10 concurrent connections efficiently. Rate limiting prevents any single user from overwhelming the system. For scale beyond 100 concurrent users, I would add caching and load balancing."

---

## 📞 EMERGENCY CONTACT

If something breaks after these fixes:
1. Check `npm run dev` output for errors
2. Check browser console for errors
3. Verify .env has all required variables
4. Restart MySQL service
5. Clear browser cookies
6. Re-run migrations: `npm run db:setup`

**Time to Complete All Fixes: ~2 hours**

Good luck! 🍀
