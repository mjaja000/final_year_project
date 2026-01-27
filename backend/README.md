# MatatuConnect API

## Overview
MatatuConnect is a digital platform designed to enhance the Kenyan informal transport sector (Matatus) by integrating passenger feedback, simulated M-Pesa payments, and real-time occupancy reporting. This API serves as the backend for the platform, built with Node.js, TypeScript, Express.js, and MongoDB.

## Tech Stack
- **Runtime**: Node.js
- **Language**: TypeScript (Strict Mode)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT
- **Validation**: Zod
- **Error Handling**: Global error middleware

## Project Folder Structure
The project follows a modular architecture using the Controller-Service-Repository pattern for maintainability and scalability.

```
final_year_project/
├── README.md
├── package.json
├── tsconfig.json
├── .env.example
└── src/
    ├── controllers/
    │   ├── authController.ts
    │   ├── feedbackController.ts
    │   ├── paymentController.ts
    │   └── occupancyController.ts
    ├── middlewares/
    │   ├── authMiddleware.ts
    │   ├── errorMiddleware.ts
    │   └── validationMiddleware.ts
    ├── models/
    │   ├── User.ts
    │   ├── Matatu.ts
    │   ├── Feedback.ts
    │   └── Transaction.ts
    ├── repositories/
    │   ├── userRepository.ts
    │   ├── matatuRepository.ts
    │   ├── feedbackRepository.ts
    │   └── transactionRepository.ts
    ├── routes/
    │   ├── authRoutes.ts
    │   ├── feedbackRoutes.ts
    │   ├── paymentRoutes.ts
    │   └── occupancyRoutes.ts
    ├── services/
    │   ├── authService.ts
    │   ├── feedbackService.ts
    │   ├── paymentService.ts
    │   └── occupancyService.ts
    ├── types/
    │   └── index.ts
    ├── utils/
    │   └── index.ts
    └── app.ts
```

## Environment Configuration
Create a `.env` file in the root directory based on the `.env.example` file. The following variables are required:

- `PORT`: The port number for the server (e.g., 3000)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT token generation
- `MPESA_CONSUMER_KEY`: M-Pesa API consumer key
- `MPESA_CONSUMER_SECRET`: M-Pesa API consumer secret
- `MPESA_SHORTCODE`: M-Pesa shortcode for the business
- `MPESA_PASSKEY`: M-Pesa passkey for STK push
- `MPESA_ENVIRONMENT`: Environment (sandbox or production)

## Database Schema Models

### User Model
```typescript
interface IUser {
  _id: ObjectId;
  name: string;
  email: string;
  password: string;
  role: 'Commuter' | 'Operator' | 'Admin';
  phoneNumber: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Matatu Model
```typescript
interface IMatatu {
  _id: ObjectId;
  plateNumber: string;
  route: string;
  currentOccupancy: number;
  maxOccupancy: number;
  operatorId: ObjectId; // Reference to User
  createdAt: Date;
  updatedAt: Date;
}
```

### Feedback Model
```typescript
interface IFeedback {
  _id: ObjectId;
  userId: ObjectId; // Reference to User
  matatuId: ObjectId; // Reference to Matatu
  rating: number; // 1-5
  comment: string;
  createdAt: Date;
}
```

### Transaction Model
```typescript
interface ITransaction {
  _id: ObjectId;
  userId: ObjectId; // Reference to User
  matatuId: ObjectId; // Reference to Matatu
  amount: number;
  mpesaCheckoutId: string;
  status: 'Pending' | 'Completed' | 'Failed';
  createdAt: Date;
  updatedAt: Date;
}
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user and return JWT token

### Feedback
- `POST /api/feedback` - Submit feedback for a matatu (Authenticated)
- `GET /api/feedback/:matatuId` - Get feedback for a specific matatu

### Payments
- `POST /api/payments/stkpush` - Initiate M-Pesa STK Push (Authenticated)
- `POST /api/payments/callback` - M-Pesa callback endpoint

### Occupancy
- `PUT /api/occupancy/:matatuId` - Update occupancy for a matatu (Operator/Admin only)
- `GET /api/occupancy/:matatuId` - Get current occupancy for a matatu

## Best Practices Implemented
- **Global Error Handling**: Centralized error handling middleware
- **Validation**: Zod schemas for input validation
- **Authentication**: JWT-based authentication with middleware
- **TypeScript Interfaces**: Strongly typed data structures
- **Modular Architecture**: Separation of concerns with controllers, services, and repositories
- **Security**: Password hashing, input sanitization, rate limiting (to be implemented)

## How to Run the Project

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- M-Pesa API credentials (for sandbox testing)

### Installation
1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and fill in the required variables
4. Start MongoDB service

### Development Workflow (Agile Methodology)
This project follows an Agile development approach with iterative sprints. Here's how to work on the project:

1. **Sprint Planning**: Review user stories and plan tasks for the sprint
2. **Development**:
   - Pull the latest changes: `git pull origin main`
   - Create a feature branch: `git checkout -b feature/your-feature-name`
   - Implement features following the folder structure
   - Write tests for new functionality
   - Commit changes: `git commit -m "Add feature description"`
3. **Testing**:
   - Run unit tests: `npm test`
   - Run integration tests
   - Manual testing of API endpoints
4. **Code Review**: Push branch and create pull request
5. **Deployment**: Merge to main after approval
6. **Sprint Review**: Demo completed features
7. **Retrospective**: Discuss improvements for next sprint

### Running the Application
- Development: `npm run dev`
- Production build: `npm run build`
- Production start: `npm start`

### Testing
- Run tests: `npm test`
- Run tests with coverage: `npm run test:coverage`

### Linting and Formatting
- Lint code: `npm run lint`
- Format code: `npm run format`

## Contributing
1. Follow the established folder structure
2. Use TypeScript strict mode
3. Implement proper error handling
4. Add validation for all inputs
5. Write comprehensive tests
6. Update documentation as needed

## License
This project is licensed under the MIT License.