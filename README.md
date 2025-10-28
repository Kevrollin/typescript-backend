# FundHub TypeScript Backend

A modern, type-safe Express.js backend built with TypeScript for the FundHub crowdfunding platform.

## Features

- **TypeScript**: Full type safety and modern JavaScript features
- **Express.js**: Fast, minimalist web framework
- **PostgreSQL**: Robust relational database with Sequelize ORM
- **JWT Authentication**: Secure user authentication and authorization
- **Stellar Integration**: Blockchain payments and wallet management
- **Rate Limiting**: Built-in rate limiting middleware
- **CORS Support**: Cross-origin resource sharing configuration
- **Security**: Helmet.js for security headers
- **Logging**: Morgan for HTTP request logging
- **Validation**: Express-validator for request validation
- **Swagger**: API documentation with Swagger UI

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- npm or yarn

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Set up database**
   ```bash
   # Create database
   createdb fundhub
   ```

4. **Start the server**
   ```bash
   # Development mode with auto-reload
   npm run dev
   
   # Production mode
   npm run build
   npm start
   ```

The API will be available at http://localhost:8000

## Project Structure

```
typescript-backend/
├── src/
│   ├── config/          # Configuration files
│   │   ├── index.ts     # Main config
│   │   └── database.ts  # Database setup
│   ├── models/          # Sequelize models
│   │   ├── User.ts
│   │   ├── Student.ts
│   │   ├── Project.ts
│   │   ├── Donation.ts
│   │   └── index.ts     # Model relationships
│   ├── routes/          # API routes
│   │   └── auth.ts
│   ├── controllers/     # Route controllers
│   │   └── AuthController.ts
│   ├── middleware/      # Custom middleware
│   │   └── auth.ts      # JWT authentication
│   ├── utils/           # Utility functions
│   │   └── jwt.ts       # JWT helpers
│   ├── types/           # TypeScript type definitions
│   │   └── index.ts
│   ├── app.ts           # Express app setup
│   └── server.ts        # Server entry point
├── api/                 # Vercel serverless functions
│   └── index.ts
├── dist/                # Compiled JavaScript (generated)
├── package.json
├── tsconfig.json
├── vercel.json
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/student-register` - Student registration
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile

### Health & Testing
- `GET /health` - Health check endpoint
- `GET /test` - Test endpoint
- `GET /` - API information

## Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm run build:watch` - Build with watch mode
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run type-check` - Type check without building
- `npm test` - Run tests

### Type Checking

The project uses strict TypeScript configuration with:
- Strict mode enabled
- No implicit any
- No unused locals/parameters
- Exact optional property types
- Unchecked indexed access

### Code Style

- ESLint with TypeScript rules
- Prettier for code formatting
- Consistent naming conventions
- Comprehensive error handling

## Deployment

### Vercel Deployment

The project is configured for Vercel serverless deployment:

1. **Build Configuration**: TypeScript is compiled to JavaScript
2. **Serverless Function**: `/api/index.ts` serves as the entry point
3. **Environment Variables**: Configure in Vercel dashboard
4. **Database**: Use Vercel Postgres or external PostgreSQL

### Environment Variables

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `SECRET_KEY` - JWT secret key
- `NODE_ENV` - Environment (development/production)

## Database Schema

The application uses the following main entities:
- **Users**: User accounts and authentication
- **Students**: Student-specific information and verification
- **Projects**: Crowdfunding projects
- **Donations**: Donation transactions
- **Wallets**: Stellar wallet integration

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- Security headers with Helmet
- Input validation
- SQL injection protection via Sequelize

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run linting and type checking
6. Submit a pull request

## License

MIT License - see LICENSE file for details
