# Custom URL Shortener Application

A URL shortening service where users can register, login, shorten URLs, and view analytics of their URLs.

## Features
- User Registration and Login
- JWT-based Authentication
- Role-Based Authorization (User/Admin)
- URL Shortening
- Click Analytics
- MVC Architecture

## Tech Stack
- Node.js
- Express.js
- MongoDB (Mongoose)
- EJS Templates
- JWT

## Installation


Installation
Follow the steps below to set up the project locally.

1. Clone the Repository
bash
Copy
Edit
git clone https://github.com/samiran78/Custom-URL-Shortener-Application
2. Install Dependencies
Navigate to the project folder and install all the required dependencies:

bash
Copy
Edit
cd custom-url-shortener-using-node.js-and-mongodb
npm install
3. Configure Environment Variables
Create a .env file in the root of your project and add the following configurations:

plaintext
Copy
Edit
PORT=8000                      # Port to run the application
MONGO_URI=mongodb://localhost:27017/custom_url_shortener  # MongoDB connection string
JWT_SECRET=your_jwt_secret_key  # Secret key for JWT authentication
Replace your_jwt_secret_key with a strong secret key for JWT. Make sure MongoDB is running on your local machine.

4. Start the Application
Use the following command to start the application with nodemon (for auto-reloading):

npm start
The server will run on http://localhost:8000.


API Endpoints
URL Shortening
POST /url: Shorten a URL (requires authentication)

Request body: { "originalUrl": "https://example.com" }

Response: { "shortUrl": "http://localhost:8000/url/:shortID" }

Redirect to Original URL
GET /url/:shortID: Redirect to the original URL corresponding to the shortened ID.

This will also increment the click count and track the timestamp.

User Authentication
POST /user/register: Register a new user.

POST /user/login: Log in an existing user, returns a JWT.

Project Structure
bash
Copy
Edit
.
├── configDB
│   └── configDB.js          # MongoDB connection configuration
├── controllers
│   ├── userController.js    # Handle user registration and login with jwt authentication 
│   ├── logicURLSs.js     # Handle URL shortening and analytics and how its converted into short link
│   
├── models
│   ├── User.js              # Mongoose User model
│   └── URL.js               # Mongoose URL model
├── routes
│   ├── staticroutes.js      # Home and static routes (EJS)
│   ├── urlrouters.js        # Routes for URL shortening
│   └── userRoutes.js        # Routes for user authentication
├── views
│   ├── home.ejs            # Homepage view (EJS)
│   └── login.ejs            # Login page view (EJS)
        signUp.ejs           #check for propar users existence
├── middlewares
│   └── AuthenticationLogic.js # JWT-based authentication and access control
├── server.js                # Main application entry point
├── package.json             # Project metadata and dependencies



Middleware
Authentication Check: Protect routes with JWT authentication. Use the checkforAuthentication middleware to verify if the user is logged in.

Restricted Access: restrictedTologin ensures that only users with specific roles (e.g., "NORMAL") can access certain routes.

Development Notes
MongoDB: The application uses MongoDB to store user data and URL information. Ensure MongoDB is running before starting the app.

EJS Templates: Views are rendered using EJS. Static pages (like the homepage) are available via the / route.

Contributing
Feel free to fork this repository, create issues, or submit pull requests. Contributions are welcome to enhance the functionality or improve the codebase!

