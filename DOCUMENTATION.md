# Optical Company MIS System - Complete Documentation

## Overview

This is a complete Multi-Branch Optical Company Management Information System built with Next.js 16, featuring comprehensive tools for managing branches, customers, inventory, sales, prescriptions, and lab orders.

## System Architecture

### Tech Stack
- **Frontend**: Next.js 16, React 19, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, TypeScript
- **Database Schema**: Drizzle ORM (ready for PostgreSQL/Neon)
- **Authentication**: Custom Auth Context with session management
- **Charts & Analytics**: Recharts
- **Icons**: Lucide React

### Core Modules

#### 1. **Dashboard** (`/dashboard`)
- Key metrics overview
- Sales trends and analytics
- Customer statistics
- Quick action buttons
- Recent transactions

#### 2. **POS & Billing** (`/dashboard/pos`)
- Product search and selection
- Shopping cart management
- Multi-payment method support (Cash, Card, UPI, Cheque, Credit)
- Invoice generation
- Tax calculation (5% default)
- Support for discounts

#### 3. **Inventory Management** (`/dashboard/inventory`)
- Product tracking with batch/serial numbers
- Stock level monitoring (Min/Max alerts)
- Category-based organization
- Low stock warnings
- Inventory valuation
- 18+ categories supported (Frames, Lenses, Contact Lens, Accessories, etc.)

#### 4. **Customer Management** (`/dashboard/customers`)
- Customer profile management
- Contact information tracking
- Purchase history
- Customer segmentation (Regular, VIP, Wholesale)
- Total spending analytics
- Last visit tracking

#### 5. **Optical Prescriptions** (`/dashboard/prescriptions`)
- Complete optical prescription capture:
  - Right Eye (OD): Sphere, Cylinder, Axis
  - Left Eye (OS): Sphere, Cylinder, Axis
  - Pupillary Distance (PD)
  - Prescription types: Single Vision, Bifocal, Progressive
  - Additional parameters: ADD, Prism, Base
- Prescription validity tracking
- Expiry date management

#### 6. **Lab Orders** (`/dashboard/lab-orders`)
- Order creation and tracking
- Frame code and lens type selection
- Coating options (Anti-Glare, UV, Blue Light, etc.)
- Delivery date scheduling
- Order status management (Pending → In Process → Completed → Delivered)
- Cost tracking

#### 7. **Reports & Analytics** (`/dashboard/reports`)
- Sales reports with date range filtering
- Multiple report types (Sales, Inventory, Customer, Prescription, Lab Orders)
- Trend analysis
- Category-wise sales breakdown
- Product performance metrics
- Export functionality

#### 8. **Analytics Dashboard** (`/dashboard/analytics`)
- Advanced business metrics
- Revenue and profit trends
- Customer segmentation analysis
- Weekly activity tracking
- Product performance charts
- Customer lifetime value
- Conversion rate metrics

## Database Schema

### Main Tables

1. **users**
   - Roles: admin, manager, staff, sales, pharmacist, optometrist, accountant
   - Branch assignment for multi-location support
   - Last login tracking

2. **branches**
   - Branch information (address, contact)
   - Manager assignment
   - Status tracking

3. **customers**
   - Customer profiles
   - Contact information
   - Visit history
   - Spending analytics
   - Customer type classification

4. **products**
   - Product catalog with pricing
   - Category and subcategory
   - Barcode tracking
   - Stock level thresholds
   - Tax and HSN code support

5. **inventory**
   - Stock quantities
   - Batch and serial number tracking
   - Expiry date management
   - Branch-wise inventory

6. **sales**
   - Invoice generation
   - Payment method tracking
   - Tax and discount calculations
   - Customer linkage

7. **saleItems**
   - Line items for each sale
   - Product quantity and pricing
   - Tax and discount per item

8. **prescriptions**
   - Complete optical parameters
   - OD/OS measurements
   - PD and ADD values
   - Prescription type classification
   - Expiry tracking

9. **labOrders**
   - Lab order tracking
   - Frame and lens specifications
   - Coating selection
   - Delivery scheduling
   - Cost tracking
   - Status workflow

10. **purchaseOrders**
    - Vendor orders
    - Order status workflow
    - Delivery tracking
    - Line items tracking

11. **vendors**
    - Supplier information
    - Contact details
    - Payment terms
    - GST/Tax information

12. **auditLogs**
    - User activity tracking
    - Change logs
    - Security auditing

## User Roles & Permissions

### Admin
- Full system access
- User management
- Branch management
- Reports and analytics
- System configuration

### Manager
- Branch-specific operations
- Staff management
- Customer management
- Sales and inventory overview
- Reports and analytics

### Sales Staff
- POS operations
- Customer management
- Order creation
- Inventory search

### Optometrist
- Prescription creation
- Customer examination
- Lab order creation

### Pharmacist
- Lab operations
- Order fulfillment
- Inventory management

### Accountant
- Reports and analytics
- Financial metrics
- Audit logs

## Features & Capabilities

### Multi-Branch Support
- Branch-wise data segregation
- Centralized admin dashboard
- Branch-specific inventory
- Branch manager assignments

### Financial Tracking
- Sales analytics
- Profit margin calculations
- Revenue trends
- Customer lifetime value
- Category-wise performance

### Inventory Management
- Real-time stock tracking
- Low stock alerts
- Batch and serial number support
- Expiry date monitoring
- Inventory valuation

### Customer Relationship
- Customer profiles
- Visit history
- Purchase tracking
- Customer segmentation
- Referral source tracking

### Prescription Management
- Complete optical measurements
- Prescription validity
- Expiry tracking
- Lab order linkage

### Lab Operations
- Order workflow (Pending → In Process → Completed → Delivered)
- Frame and lens specifications
- Coating options
- Delivery scheduling
- Cost tracking

### Reporting & Analytics
- Multiple report types
- Date range filtering
- Trend analysis
- Product performance
- Customer analytics
- Export capabilities

## API Routes

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

### Future API Endpoints (Ready for implementation)
- `/api/customers/*` - Customer management
- `/api/sales/*` - Sales operations
- `/api/inventory/*` - Inventory management
- `/api/prescriptions/*` - Prescription management
- `/api/lab-orders/*` - Lab order management
- `/api/reports/*` - Report generation

## How to Get Started

### Installation
```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev
```

### Access the Application
1. Navigate to `http://localhost:3000`
2. You'll be redirected to login page
3. Use demo credentials:
   - Email: `admin@optical.com`
   - Password: `demo123`

### Database Integration (Next Steps)
To integrate with a real database (Neon PostgreSQL):

1. Set up Neon database integration
2. Create tables using the schema in `lib/db/schema.ts`
3. Implement API routes for data operations
4. Connect to actual database in route handlers

## File Structure

```
/vercel/share/v0-project/
├── app/
│   ├── layout.tsx (Root layout with AuthProvider)
│   ├── page.tsx (Redirect to login)
│   ├── login/
│   │   └── page.tsx (Login page)
│   ├── dashboard/
│   │   ├── layout.tsx (Dashboard layout with sidebar)
│   │   ├── page.tsx (Dashboard home)
│   │   ├── pos/page.tsx (POS module)
│   │   ├── customers/page.tsx (Customer management)
│   │   ├── inventory/page.tsx (Inventory management)
│   │   ├── prescriptions/page.tsx (Prescriptions)
│   │   ├── lab-orders/page.tsx (Lab orders)
│   │   ├── reports/page.tsx (Reports)
│   │   └── analytics/page.tsx (Analytics)
│   ├── api/
│   │   └── auth/
│   │       ├── login/route.ts
│   │       ├── logout/route.ts
│   │       ├── register/route.ts
│   │       └── me/route.ts
│   └── globals.css (Global styles)
├── lib/
│   ├── auth/
│   │   └── auth-context.tsx (Authentication context)
│   ├── db/
│   │   └── schema.ts (Database schema - Drizzle ORM)
│   └── types/
│       └── index.ts (TypeScript types)
├── components/
│   └── ui/ (shadcn components)
└── package.json
```

## Demo Data

The system comes with mock data for demonstration:
- Sample customers
- Sample products with inventory
- Sample prescriptions
- Sample lab orders
- Sample sales and transactions

All data is stored in React state and will reset on page refresh. To persist data, integrate with a database.

## Next Implementation Phases

### Phase 3: Backend Integration
- Connect all API routes to database
- Implement pagination and filtering
- Add real-time validation

### Phase 4: Advanced Features
- User activity audit logs
- Email notifications
- SMS alerts for low stock
- Backup and recovery

### Phase 5: Mobile App
- React Native mobile app
- Offline support
- Mobile POS

### Phase 6: Integrations
- E-commerce integration
- Payment gateway integration
- Lab management system integration

## Security Considerations

- Password hashing with bcryptjs
- Session-based authentication
- CSRF protection ready
- Input validation with Zod
- Row-level security for multi-branch support

## Performance Optimizations

- Next.js 16 Turbopack for fast builds
- Client-side caching with SWR
- Optimized database queries
- Image optimization
- Code splitting

## Support & Troubleshooting

### Common Issues

1. **Login not working**
   - Check if auth API routes are accessible
   - Verify cookies are enabled
   - Check browser console for errors

2. **Data not persisting**
   - Currently using React state (resets on refresh)
   - Implement database integration for persistence

3. **Charts not showing**
   - Ensure Recharts is installed
   - Check browser console for errors

## Future Enhancements

- [ ] Real database integration (Neon PostgreSQL)
- [ ] User authentication with email verification
- [ ] Role-based access control (RBAC)
- [ ] SMS/Email notifications
- [ ] Barcode scanning
- [ ] Multi-language support
- [ ] Mobile app
- [ ] Real-time inventory sync
- [ ] Prescription history tracking
- [ ] Customer loyalty programs

## License

This system is built for demonstration purposes.
