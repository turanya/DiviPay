# DiviPay - Smart Expense Splitting App

DiviPay is a comprehensive expense splitting application that helps friends, roommates, and groups manage shared expenses effortlessly. Built with React TypeScript frontend and Node.js/Express backend, it features real-time expense tracking, intelligent debt settlement, and a modern responsive UI.

## 🚀 Features

- **Group Management**: Create and manage expense groups with multiple members
- **Smart Expense Splitting**: Add expenses and automatically split them among group members
- **Intelligent Settlement**: Advanced algorithm to minimize the number of transactions needed
- **Real-time Updates**: Live updates across all group members
- **User Authentication**: Secure JWT-based authentication system
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Cross-Group Settlements**: Calculate debts across multiple groups for simplified payments

## 🏗️ Architecture Overview

DiviPay follows a modern full-stack architecture:

```
DiviPay/
├── frontend/          # React TypeScript SPA
├── backend/           # Node.js Express API
└── README.md         # This file
```

### Tech Stack

**Frontend:**
- React 19.1.1 with TypeScript
- Vite for build tooling
- React Router for navigation
- Tailwind CSS for styling
- Custom component library

**Backend:**
- Node.js with Express.js
- MongoDB with Mongoose ODM
- JWT for authentication
- bcryptjs for password hashing
- CORS for cross-origin requests

## 📁 Detailed File Structure

### Backend (`/backend/`)

```
backend/
├── src/
│   ├── config/
│   │   └── database.js           # MongoDB connection configuration
│   ├── controllers/
│   │   ├── authController.js     # User authentication logic (login, register, profile)
│   │   ├── expenseController.js  # Expense CRUD operations and settlement calculations
│   │   └── groupController.js    # Group management and member operations
│   ├── middleware/
│   │   ├── auth.js              # JWT token verification middleware
│   │   └── validation.js        # Request validation rules using express-validator
│   ├── models/
│   │   ├── User.js              # User schema with authentication methods
│   │   ├── Group.js             # Group schema with member management
│   │   └── Expense.js           # Expense schema with split calculations
│   └── routes/
│       ├── authRoutes.js        # Authentication endpoints (/auth/*)
│       ├── expenseRoutes.js     # Expense and settlement endpoints (/expenses/*)
│       └── groupRoutes.js       # Group management endpoints (/groups/*)
├── .env                         # Environment variables (MongoDB URI, JWT secret)
├── package.json                 # Backend dependencies and scripts
└── server.js                    # Express server entry point
```

#### Key Backend Files Explained:

**`server.js`** - Main application entry point
- Initializes Express server
- Sets up middleware (CORS, JSON parsing, authentication)
- Connects to MongoDB
- Registers API routes
- Starts server on specified port

**`src/config/database.js`** - Database connection
- Establishes MongoDB connection using Mongoose
- Handles connection events and error logging
- Uses environment variables for connection string

**`src/models/User.js`** - User data model
- Defines user schema (name, email, password, groups)
- Implements password hashing with bcryptjs
- Provides password comparison methods
- Manages user-group relationships

**`src/models/Group.js`** - Group data model
- Defines group schema with member management
- Tracks group metadata (name, description, creation date)
- Manages member roles (admin/member)
- Handles group statistics and member count

**`src/models/Expense.js`** - Expense data model
- Stores expense details (amount, description, category)
- Manages split calculations between members
- Tracks payment status and settlement records
- Links expenses to groups and users

**`src/controllers/authController.js`** - Authentication logic
- User registration with validation
- Login with JWT token generation
- Profile management and updates
- Password change functionality

**`src/controllers/groupController.js`** - Group management
- Group creation with automatic member addition
- Member invitation and management
- Group details retrieval with member population
- Leave/remove member functionality

**`src/controllers/expenseController.js`** - Expense and settlement logic
- Expense creation and validation
- Group balance calculations
- Advanced settlement algorithm implementation
- Cross-group debt consolidation
- Settlement marking and tracking

**`src/middleware/auth.js`** - Authentication middleware
- JWT token verification
- User session management
- Protected route access control

**`src/middleware/validation.js`** - Request validation
- Input sanitization and validation rules
- Error message formatting
- Data type and format checking

### Frontend (`/frontend/`)

```
frontend/
├── components/
│   ├── AddExpenseModal.tsx      # Modal for adding new expenses
│   ├── Avatar.tsx               # User avatar component
│   ├── Button.tsx               # Reusable button component
│   ├── Card.tsx                 # Card container component
│   ├── Confetti.tsx             # Celebration animation component
│   ├── CreateGroupModal.tsx     # Modal for creating new groups
│   ├── Header.tsx               # Page header component
│   ├── MainLayout.tsx           # Main application layout wrapper
│   ├── ProfileModal.tsx         # User profile management modal
│   ├── Sidebar.tsx              # Navigation sidebar
│   ├── ExpenseCard.tsx          # Individual expense display card
│   └── GroupCard.tsx            # Group summary card component
├── lib/
│   └── api.ts                   # API client with all backend calls
├── pages/
│   ├── AddExpensePage.tsx       # Add expense form page
│   ├── Dashboard.tsx            # Main dashboard with overview
│   ├── GroupPage.tsx            # Individual group details page
│   ├── GroupsPage.tsx           # Groups listing page
│   ├── HistoryPage.tsx          # Expense history page
│   ├── LandingPage.tsx          # Public landing page
│   ├── LoginPage.tsx            # User login page
│   ├── RegisterPage.tsx         # User registration page
│   └── SettlementPage.tsx       # Settlement management page
├── App.tsx                      # Main application component with routing
├── main.tsx                     # React application entry point
├── types.ts                     # TypeScript type definitions
├── index.css                    # Global styles and Tailwind imports
├── vite.config.ts               # Vite build configuration
└── package.json                 # Frontend dependencies and scripts
```

#### Key Frontend Files Explained:

**`App.tsx`** - Main application component
- Implements React Router for navigation
- Manages global application state (user, groups, authentication)
- Handles group creation and management
- Provides authentication context to child components

**`main.tsx`** - Application entry point
- Renders React app into DOM
- Sets up React Router browser routing
- Imports global styles

**`types.ts`** - TypeScript definitions
- Defines interfaces for User, Group, Expense entities
- Type definitions for API responses
- Component prop type definitions

**`lib/api.ts`** - API client library
- Centralized HTTP client for backend communication
- Authentication token management
- API endpoint definitions for auth, groups, expenses
- Error handling and response formatting

**Components:**

**`MainLayout.tsx`** - Application shell
- Provides consistent layout structure
- Manages sidebar navigation
- Handles responsive design breakpoints

**`Sidebar.tsx`** - Navigation component
- Route navigation with active state
- User profile access
- Responsive mobile menu

**`CreateGroupModal.tsx`** - Group creation interface
- Multi-member input with name and email
- Form validation and submission
- Responsive modal design

**`AddExpenseModal.tsx`** - Expense creation interface
- Expense form with amount, description, category
- Member selection for expense splitting
- Real-time split calculation display

**Pages:**

**`Dashboard.tsx`** - Main overview page
- Recent expenses summary
- Group statistics and totals
- Quick action buttons

**`GroupPage.tsx`** - Individual group management
- Group member list with roles
- Expense history for the group
- Group balance calculations
- Add expense functionality

**`SettlementPage.tsx`** - Debt settlement interface
- Cross-group settlement calculations
- Mark settlements as paid functionality
- Settlement history tracking

**`AddExpensePage.tsx`** - Expense creation page
- Full expense creation form
- Group and member selection
- Split calculation and preview

## 🛠️ Setup and Installation

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas)
- Git

### Backend Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/turanya/DiviPay.git
   cd DiviPay/backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Configuration:**
   Create a `.env` file in the backend directory:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/divipay
   # Or for MongoDB Atlas:
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/divipay
   JWT_SECRET=your-super-secret-jwt-key-here
   NODE_ENV=development
   ```

4. **Start the backend server:**
   ```bash
   # Development mode with auto-reload
   npm run dev
   
   # Production mode
   npm start
   ```

   The backend will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd ../frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

   The frontend will run on `http://localhost:5173`

4. **Build for production:**
   ```bash
   npm run build
   ```

## 🔧 API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - User registration
- `POST /login` - User login
- `GET /profile` - Get user profile
- `PUT /profile` - Update user profile
- `PUT /change-password` - Change password

### Groups (`/api/groups`)
- `GET /` - Get user's groups
- `POST /` - Create new group
- `GET /:groupId` - Get group details
- `POST /:groupId/join` - Join group
- `POST /:groupId/leave` - Leave group
- `DELETE /:groupId/members/:memberId` - Remove member

### Expenses (`/api/expenses`)
- `GET /` - Get all expenses
- `POST /` - Create new expense
- `GET /group/:groupId` - Get group expenses
- `GET /group/:groupId/balance` - Get group balance
- `GET /settlements` - Get settlement calculations
- `POST /settle` - Mark settlement as paid

## 🧮 Settlement Algorithm

DiviPay implements an advanced debt settlement algorithm that:

1. **Calculates net balances** across all groups for each user
2. **Minimizes transactions** by finding optimal payment paths
3. **Handles complex scenarios** with multiple debtors and creditors
4. **Supports cross-group settlements** for users in multiple groups
5. **Tracks settlement history** to prevent double payments

The algorithm uses a graph-based approach to find the minimum number of transactions needed to settle all debts.

## 🎨 UI/UX Features

- **Dark Theme**: Modern dark interface with accent colors
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Loading States**: Smooth loading indicators and skeleton screens
- **Error Handling**: User-friendly error messages and retry options
- **Animations**: Subtle transitions and celebration effects
- **Accessibility**: Keyboard navigation and screen reader support

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs for secure password storage
- **Input Validation**: Comprehensive server-side validation
- **CORS Protection**: Configured cross-origin resource sharing
- **Environment Variables**: Sensitive data stored in environment files

## 🚀 Deployment

### Backend Deployment
1. Set up MongoDB Atlas or cloud MongoDB instance
2. Configure environment variables for production
3. Deploy to services like Heroku, Railway, or DigitalOcean
4. Update CORS settings for production frontend URL

### Frontend Deployment
1. Build the production bundle: `npm run build`
2. Deploy to Netlify, Vercel, or similar static hosting
3. Configure environment variables for production API URL

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 🐛 Known Issues & Future Enhancements

### Current Limitations:
- New members receive temporary passwords and need manual activation
- No email notifications for settlements or group invitations
- Limited expense categories (could be user-customizable)

### Planned Features:
- Email notifications and invitations
- Expense receipt uploads
- Recurring expense support
- Mobile app development
- Advanced reporting and analytics
- Multi-currency support

## 📞 Support

For issues and questions:
1. Check existing GitHub issues
2. Create a new issue with detailed description
3. Include steps to reproduce any bugs
4. Provide environment details (OS, Node version, etc.)

---

**Built with ❤️ for making expense splitting simple and fair.**
