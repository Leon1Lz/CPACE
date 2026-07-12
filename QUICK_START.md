# 🚀 CPACE Learning Portal - Quick Start Guide

## ⚡ 5-Minute Setup

### 1. Open Terminal & Navigate
```bash
cd c:/Users/Leonil/Desktop/CPACE
```

### 2. Start Development Monitor
```bash
# Check development status
npm run monitor

# Start all services
npm run monitor:start
```

### 3. Access Your Application
- **Landing Page**: http://localhost:3000
- **Login**: http://localhost:3000/login
- **Register**: http://localhost:3000/register
- **Database**: http://localhost:5555 (Prisma Studio)

## 🎯 Essential Commands

### Development
```bash
npm run dev              # Start development server
npm run monitor          # Live monitoring dashboard
npm run monitor:start    # Start all services
npm run monitor:status   # Quick status check
```

### Database
```bash
npm run db:generate      # Generate Prisma client
npm run db:push         # Apply schema changes
npm run db:studio       # Open database GUI
npm run db:reset        # Reset database
```

### Code Quality
```bash
npm run lint            # Check code quality
npm run lint:fix        # Fix linting issues
npm run type-check      # Check TypeScript types
npm run format          # Format code
```

## 📱 Development Workflow

### Daily Development
1. **Start**: `npm run monitor:start`
2. **Code**: Make changes with hot reload
3. **Test**: Visit http://localhost:3000
4. **Database**: Use Prisma Studio at http://localhost:5555

### Adding New Features
1. **Create Component**: Add to `components/` folder
2. **Add Route**: Create page in `app/` folder
3. **Update Database**: Modify `prisma/schema.prisma`
4. **Apply Changes**: `npm run db:push`

### Testing Authentication
1. **Register**: Create account at http://localhost:3000/register
2. **Login**: Sign in at http://localhost:3000/login
3. **Dashboard**: Access role-based dashboard

## 🔧 Common Issues & Solutions

### Database Not Connected
```bash
# Start database server
npx prisma dev

# Apply schema
npm run db:push
```

### Port Already in Use
```bash
# Find and kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use different port
npm run dev -- -p 3001
```

### Build Errors
```bash
# Clear cache and rebuild
npm run clean
npm run build
```

## 🎨 Design System

### Colors
- **Primary**: `cpace-600` (#006B3F) - Main green
- **Secondary**: `accent-500` (#f59e0b) - Gold accents
- **Neutral**: `neutral-600` (#525252) - Text gray

### Components
- **Header**: Professional navigation with logo
- **Hero**: Green gradient with grid pattern
- **Cards**: Program cards with shadows
- **Forms**: Split-screen authentication

## 📊 Project Structure

```
CPACE/
├── app/                    # Next.js pages
│   ├── (auth)/            # Login/Register pages
│   ├── (landing)/         # Landing page
│   └── api/               # API endpoints
├── components/            # React components
│   ├── auth/             # Authentication forms
│   ├── layout/           # Header, Hero sections
│   └── ui/               # shadcn/ui components
├── lib/                  # Utilities
│   ├── auth.ts          # NextAuth config
│   └── prisma.ts        # Database client
└── prisma/              # Database schema
```

## 🚀 Next Steps

1. **Explore**: Test all pages and features
2. **Customize**: Update colors, content, images
3. **Build Features**: Add course creation, assessments
4. **Deploy**: Prepare for production

## 📞 Need Help?

- **Development Guide**: See `DEVELOPMENT.md`
- **Monitor**: Use `npm run monitor` for live status
- **Database**: Use Prisma Studio for data management

---

**Happy Coding! 🎉**
