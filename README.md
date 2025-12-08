# 🤖 WIS AI - Where Ideas Spark

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6.3-blue.svg)

**An AI-powered holographic assistant for Westmead International School**

[Features](#-features) • [Quick Start](#-quick-start) • [Tech Stack](#-tech-stack) • [Documentation](#-documentation) • [License](#-license)

</div>

---

## 📖 About

WIS AI is an intelligent holographic assistant designed for Westmead International School, providing real-time AI-powered responses to student and faculty queries about campus information, academics, events, and school services. Built as a thesis project, this system demonstrates modern web technologies, AI integration, and secure data management practices.

### Key Highlights

- 🤖 **AI-Powered Responses** - Groq API integration for natural language understanding
- 📊 **Real-time Admin Dashboard** - WebSocket-powered live updates
- 🔒 **Enterprise Security** - CSRF protection, rate limiting, session management
- 📱 **Responsive Design** - Modern UI with Tailwind CSS and shadcn/ui
- 🗄️ **Automated Data Retention** - GDPR-compliant privacy management
- ⚡ **High Performance** - Optimized with React Query and Vite

---

## ✨ Features

### For Users
- 💬 Interactive AI chat interface with holographic avatar
- 🎯 Quick action buttons for common queries
- 📝 Contextual responses about campus, academics, and events
- 🔊 Text-to-speech support (optional)

### For Administrators
- 📊 Real-time analytics dashboard
- 👥 User management system
- ❓ FAQ management
- 📈 Query tracking with response time metrics
- 🔄 Live dashboard updates via WebSocket
- 👍 Feedback analysis (positive/negative ratings)

### Security Features
- 🔐 Bcrypt password hashing
- 🛡️ CSRF token protection
- 🚦 Rate limiting (login, API endpoints)
- 🔒 Session-based authentication
- 📅 Automated data cleanup (7d queries, 30d analytics, 90d feedback)
- 🔍 Winston logger with sensitive data sanitization

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- MySQL 8.0+ (XAMPP or standalone)
- Groq API key ([Get one free](https://console.groq.com))

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/wis-ai-hologram.git
cd wis-ai-hologram
```

2. **Install dependencies**
```bash
npm install
cd client && npm install && cd ..
```

3. **Configure environment variables**
```bash
# Copy example file
cp .env.example .env

# Edit .env with your credentials
DATABASE_URL=mysql://root:your_password@localhost:3306/hologram
GROQ_API_KEY=your_groq_api_key_here
SESSION_SECRET=your_random_64_byte_secret
NODE_ENV=development
PORT=5001
```

4. **Set up the database**
```bash
# Create database
mysql -u root -p -e "CREATE DATABASE hologram;"

# Run migrations
npm run db:setup

# Set up automated data retention
node setup-mysql-events.cjs
```

5. **Start development servers**
```bash
npm run dev
```

The application will be available at:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5001

### Default Admin Credentials

After running migrations, you can log in with:
```
Username: WISAI2025
Password: Whereideassparks2025!
Admin Panel: http://localhost:3000/admin
```

⚠️ **Change these credentials immediately in production!**

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite 5
- **Styling:** Tailwind CSS 3
- **UI Components:** shadcn/ui (Radix UI primitives)
- **Routing:** Wouter
- **State Management:** TanStack React Query
- **Animation:** Framer Motion

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js 4
- **Database:** MySQL 8 with Drizzle ORM
- **Authentication:** express-session with MySQL store
- **Security:** Helmet, CORS, CSRF (csurf), rate-limit
- **Logging:** Winston with log rotation
- **WebSocket:** ws library for real-time updates

### AI Integration
- **Provider:** Groq Cloud API
- **Model:** Llama 3.1 (configurable)
- **Features:** Streaming responses, context management

---

## 📁 Project Structure

```
wis-ai-hologram/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/         # Route pages
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utilities
│   └── public/            # Static assets
├── server/                # Express backend
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # API routes
│   ├── auth.ts           # Authentication
│   ├── grok.ts           # AI integration
│   └── db.ts             # Database connection
├── shared/               # Shared schemas (Zod)
├── migrations/           # Database migrations
├── scripts/              # Utility scripts
├── docs/                 # Documentation
└── .env                  # Environment variables (not committed)
```

---

## 📚 Documentation

Comprehensive documentation is available in the `docs/` folder:

- **[SECURITY.md](./SECURITY.md)** - Complete security guide and compliance info
- **[docs/ADMIN_QUICK_REFERENCE.md](./docs/ADMIN_QUICK_REFERENCE.md)** - Admin panel guide
- **[docs/COMPREHENSIVE_SECURITY_AUDIT_DEC2025.md](./docs/COMPREHENSIVE_SECURITY_AUDIT_DEC2025.md)** - Full security audit report
- **[docs/DEVICE_TRANSFER_GUIDE.md](./docs/DEVICE_TRANSFER_GUIDE.md)** - Deployment checklist

---

## 🔧 Available Scripts

### Development
```bash
npm run dev              # Start both frontend and backend
npm run dev:client       # Start frontend only
npm run dev:server       # Start backend only
```

### Database
```bash
npm run db:setup         # Run migrations and seed data
npm run db:push          # Push schema changes to database
npm run db:migrate       # Run specific migration
```

### Production Build
```bash
npm run build            # Build both frontend and backend
npm run build:client     # Build frontend only
npm run build:server     # Build backend only
npm start                # Start production server
```

### Utilities
```bash
npm run check            # Type check with TypeScript
node scripts/count-queries.js     # Count database queries
node scripts/delete-queries.js    # Clean old queries manually
```

---

## 🚢 Deployment

### Production Checklist

1. **Environment Variables**
   - [ ] Set `NODE_ENV=production`
   - [ ] Use strong random `SESSION_SECRET`
   - [ ] Configure `ALLOWED_ORIGINS` for CORS
   - [ ] Rotate all credentials from development

2. **Database**
   - [ ] Set up production MySQL instance
   - [ ] Enable MySQL Event Scheduler for data retention
   - [ ] Configure automated backups

3. **Security**
   - [ ] Enable HTTPS
   - [ ] Verify CSP headers are active
   - [ ] Test rate limiting
   - [ ] Review SECURITY.md checklist

4. **Build & Deploy**
```bash
npm run build
npm start
```

### Recommended Hosting

- **Frontend:** Vercel, Netlify, Cloudflare Pages
- **Backend:** Railway, Render, AWS EC2, DigitalOcean
- **Database:** PlanetScale, AWS RDS, DigitalOcean MySQL

---

## 🔒 Security

This project implements enterprise-grade security practices:

- ✅ **A- Security Grade** (92/100 in security audit)
- ✅ OWASP Top 10 compliance (8/10)
- ✅ GDPR-ready data retention policies
- ✅ Rate limiting on all endpoints
- ✅ CSRF protection on state-changing requests
- ✅ Automated log sanitization

See [SECURITY.md](./SECURITY.md) for complete details.

### Reporting Security Issues

If you discover a security vulnerability, please report it responsibly.

---

## 🤝 Contributing

This is a thesis project, but suggestions and feedback are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## 👨‍💻 Author

**Thesis Project**  
Westmead International School  
Academic Year 2024-2025

---

## 🙏 Acknowledgments

- **Groq** - For providing the AI API
- **shadcn/ui** - For the beautiful UI components
- **Drizzle ORM** - For the excellent database toolkit
- **Westmead International School** - For the opportunity and support

---

## 📞 Support

- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/wis-ai-hologram/issues)
- 📖 Documentation: [docs/](./docs/)

---

<div align="center">

**Built with ❤️ for Westmead International School**

⭐ Star this repo if you find it helpful!

</div>
