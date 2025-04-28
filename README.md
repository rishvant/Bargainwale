# Bargainwale - Inventory Management Platform

Bargainwale is a comprehensive inventory management platform designed to streamline the operations of enterprises. It helps businesses manage their orders, bookings, sales, and purchases efficiently. The platform provides a user-friendly interface and robust backend services, ensuring secure and scalable operations.

## Features

- **Order Management**: Track and manage sales and purchase orders.
- **Inventory Tracking**: Efficient inventory management for stock control.
- **User Management**: Secure authentication and user access control.

## Tech Stack

- **Frontend**: React.js, Tailwind CSS, Redux
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: Clerk (for user management)
- **Deployment**: Vercel (Frontend), Heroku (Backend)

## Installation

### Prerequisites

Before you begin, make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v14 or higher)
- [MongoDB](https://www.mongodb.com/) or a MongoDB Atlas account for the database
- [Clerk Account](https://clerk.dev/) for authentication and user management
- [Git](https://git-scm.com/)

### Steps to Run Locally

1. Clone the repository:
   ```
   git clone https://github.com/rishvant/Bargainwale
   cd Bargainwale
   ```

2. Install Frontend Dependencies:
   ```
   cd client
   npm install
   ```

3. Install Backend Dependencies:
   ```
   cd server
   npm install
   ```

4. Set Up Environment Variables in .env inside server:

5. Run Frontend Server:
   ```
   npm run dev
   ```
   
6. Run Backend Server:
   ```
   node server.js
   ```
