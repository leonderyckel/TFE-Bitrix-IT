# IT Support Ticket Management Platform

A comprehensive web platform for managing IT support tickets and automating invoicing. Built with the MERN stack (MongoDB, Express, React, Node.js).

## Features

- **Ticket Management**: Create, track, and manage support tickets
- **User Authentication**: Secure login for clients and administrators
- **Role-Based Access Control**: Different permissions for clients, technicians, and admins
- **Real-Time Updates**: Instant notifications using Socket.io and MQTT
- **Automated Invoicing**: Integration with Sage API for invoice generation
- **Remote Assistance**: Secure system access for technicians
- **Credential Management**: Secure storage of client credentials

## Tech Stack

- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Frontend**: React
- **Real-time Communication**: Socket.io, MQTT
- **Authentication**: JWT
- **API Integration**: Sage API

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- MQTT Broker
- Sage API credentials

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd it-support-platform
```

2. Install dependencies:
```bash
npm install
cd client
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/it-support
JWT_SECRET=your_jwt_secret_key_here
CLIENT_URL=http://localhost:3000
SAGE_API_KEY=your_sage_api_key_here
MQTT_BROKER_URL=mqtt://localhost:1883
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_email_password
```

4. Start the development server:
```bash
# Start backend
npm run dev

# Start frontend (in a new terminal)
npm run client
```

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login user
- GET `/api/auth/me` - Get current user

### Tickets
- POST `/api/tickets` - Create new ticket
- GET `/api/tickets` - Get all tickets
- GET `/api/tickets/:id` - Get single ticket
- PUT `/api/tickets/:id` - Update ticket
- POST `/api/tickets/:id/comments` - Add comment to ticket
- POST `/api/tickets/:id/assign` - Assign technician to ticket

### Users
- PUT `/api/users/credentials` - Update user credentials

## Security

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Secure credential storage
- CORS protection
- Input validation

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 