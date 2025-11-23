# Hologram School Assistant - MySQL Version

A real-time AI-powered holographic assistant for Westmead International School, converted from PostgreSQL to MySQL with real-time admin dashboard updates.

## Features

- **AI Holographic Assistant**: Interactive AI chatbot with Groq API integration
- **Real-time Admin Dashboard**: Live updates for queries without page refresh
- **MySQL Database**: Migrated from PostgreSQL to MySQL for broader compatibility
- **Authentication System**: Secure admin login with bcrypt password hashing
- **FAQ Management**: Admin interface for managing frequently asked questions
- **User Management**: Admin can create and manage user accounts
- **WebSocket Integration**: Real-time updates for admin dashboard
- **Responsive Design**: Modern UI with Tailwind CSS and shadcn/ui components

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Express.js, Node.js
- **Database**: MySQL with Drizzle ORM
- **Authentication**: express-session with express-mysql-session
- **AI Integration**: Groq API for chat responses
- **Real-time**: WebSocket server for live updates

## Setup Instructions

### 1. Clone and Install Dependencies

\`\`\`bash
git clone https://github.com/skawngur05/hologramsql.git
cd hologramsql
npm install
\`\`\`

### 2. Database Setup

Make sure you have MySQL server running on your system.

Create a MySQL database:
\`\`\`sql
CREATE DATABASE hologram;
\`\`\`

### 3. Environment Configuration

Copy the environment template:
\`\`\`bash
cp .env.example .env
\`\`\`

Edit `.env` with your configuration:
\`\`\`env
# Database configuration
DATABASE_URL=mysql://username:password@localhost:3306/hologram

# Alternative database configuration (for express-mysql-session)
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=root
DATABASE_PASSWORD=your_strong_password_here
DATABASE_NAME=hologram

# Groq API configuration (get your key from https://console.groq.com/keys)
GROQ_API_KEY=your_groq_api_key_here

# Server configuration
PORT=3000
NODE_ENV=development

# Session secret (MUST be cryptographically random - generate using below command)
# Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
SESSION_SECRET=your_generated_random_secret_here
\`\`\`

**🔒 IMPORTANT SECURITY NOTES:**
- **NEVER** commit your actual `.env` file to version control (it's already in `.gitignore`)
- **SET A STRONG DATABASE PASSWORD** - Never use an empty password
- **GENERATE A RANDOM SESSION SECRET** - Use the command provided above
- **REGENERATE API KEYS** - If you accidentally expose them

### 4. Run Database Migrations

Run the database setup script to create tables and seed initial data:
\`\`\`bash
npm run db:setup
\`\`\`

This will:
- Create the required database tables
- Add sample FAQ entries

**⚠️ ADMIN USER CREATION:**
Default admin credentials have been removed for security. Create your admin user manually:

\`\`\`bash
# Generate a password hash
node scripts/generate-hash.js YourSecurePassword123

# Then in MySQL, insert your admin user:
# mysql -u root -p hologram
# INSERT INTO admin_users (id, username, password, role, full_name, email) 
# VALUES (UUID(), 'yourusername', 'PASTE_BCRYPT_HASH_HERE', 'admin', 'Your Name', 'your.email@westmead.edu.ph');
\`\`\`

### 5. Start the Development Server

\`\`\`bash
npm run dev
\`\`\`

The application will be available at \`http://localhost:3000\`

## Usage

### For Visitors
- Navigate to the hologram interface
- Ask questions about the school
- Get AI-powered responses with text-to-speech

### For Administrators
1. Go to `/admin` and login with your created admin credentials

2. Access the admin dashboard to:
   - View real-time query analytics
   - Manage FAQs
   - Create/manage admin users
   - Monitor user interactions with live updates

3. **Change your password immediately** after first login for security

## Real-time Features

The admin dashboard now includes:
- **Live Query Updates**: New user queries appear automatically without refresh
- **Connection Status**: Visual indicator showing WebSocket connection status
- **Real-time Statistics**: Query counts and metrics update in real-time

## API Endpoints

### Public Endpoints
- \`POST /api/chat\` - Submit questions to the AI assistant
- \`GET /api/faqs/active\` - Get active FAQs for context

### Admin Endpoints (Requires Authentication)
- \`POST /api/auth/login\` - Admin login
- \`POST /api/auth/logout\` - Admin logout
- \`GET /api/auth/me\` - Get current user info
- \`GET /api/admin/queries\` - Get all queries with real-time updates
- \`GET /api/admin/faqs\` - FAQ management
- \`GET /api/admin/users\` - User management

### WebSocket Endpoints
- \`ws://localhost:3000/ws\` - WebSocket connection for real-time updates

## Migration from PostgreSQL

This version has been completely migrated from PostgreSQL to MySQL:

### Key Changes Made:
1. **Dependencies**: Replaced \`@neondatabase/serverless\` and \`connect-pg-simple\` with \`mysql2\` and \`express-mysql-session\`
2. **Schema**: Updated from \`pgTable\` to \`mysqlTable\` with proper VARCHAR length specifications
3. **ORM Operations**: Removed \`.returning()\` calls and added manual ID generation with \`crypto.randomUUID()\`
4. **Session Store**: Migrated to MySQL-compatible session storage
5. **Environment**: Added support for both connection URL and individual connection parameters

### Database Schema:
- **admin_users**: User authentication and authorization
- **queries**: User interactions and AI responses  
- **faqs**: Frequently asked questions management
- **sessions**: Session storage (created automatically)

## Security Features

This application implements multiple layers of security:

### ✅ Implemented Security Measures
- **Rate Limiting**: Prevents brute force attacks and API abuse
  - Login: 5 attempts per 15 minutes
  - Chat API: 20 requests per minute
  - Admin APIs: 60 requests per minute
- **Input Validation**: All inputs validated with Zod schemas
  - Maximum field lengths enforced
  - Type checking and sanitization
  - SQL injection prevention via Drizzle ORM
- **Password Security**: Bcrypt hashing with 10 rounds
- **Session Management**: Secure session-based authentication
  - HTTP-only cookies in production
  - Cryptographically random session secrets
  - 30-day session expiration
- **CORS Protection**: Configured allowed origins
- **Security Headers**: Helmet middleware for HTTP headers
- **Connection Pooling**: Database connection limits prevent exhaustion
- **Error Handling**: React Error Boundary for graceful error recovery
- **WebSocket Security**: Message size limits and validation

### 🔒 Security Best Practices
1. **Never commit `.env` files** to version control
2. **Use strong passwords** (minimum 8 characters with uppercase, lowercase, and numbers)
3. **Regenerate API keys** if accidentally exposed
4. **Keep dependencies updated** regularly
5. **Use HTTPS** in production environments
6. **Monitor logs** for suspicious activity
7. **Regular database backups**
8. **Principle of least privilege** for database users

### ⚠️ Before Production Deployment
- [ ] Set strong MySQL root password
- [ ] Generate new Groq API key
- [ ] Generate cryptographic SESSION_SECRET
- [ ] Create admin user with strong credentials
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall rules
- [ ] Set up database backups
- [ ] Configure proper ALLOWED_ORIGINS for CORS
- [ ] Review and test all security measures

## Production Deployment

1. Set \`NODE_ENV=production\` in your environment
2. Use a cryptographically random \`SESSION_SECRET\`
3. Configure proper MySQL credentials with strong password
4. Set up HTTPS/SSL certificates
5. Configure \`ALLOWED_ORIGINS\` for CORS
6. Build the application: \`npm run build\`
7. Start the production server: \`npm start\`
8. Monitor logs and set up alerts

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details