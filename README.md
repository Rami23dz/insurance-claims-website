# Insurance Claims Processing Website

This application automates the process of analyzing reports from "gérant cite" and generating insurance claim declarations and "dépôt de plainte" documents.

## Features

- Upload and process reports in Arabic and French
- Extract key information using OCR and text analysis
- Generate professional declaration documents
- Create "dépôt de plainte" documents for theft and vandalism cases
- User authentication with admin and regular user roles
- Document management and tracking
- Responsive design for all devices

## Technology Stack

- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Authentication**: JWT
- **Text Extraction**: Tesseract.js, PDF-parse
- **Document Generation**: Handlebars, PDFKit

## Installation

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Setup

1. Clone the repository
```
git clone https://github.com/yourusername/insurance-claims-website.git
cd insurance-claims-website
```

2. Install dependencies
```
npm install
cd frontend
npm install
cd ..
```

3. Create a `.env` file in the root directory with the following variables:
```
NODE_ENV=development
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

4. Start the development server
```
npm run dev
```

## Deployment

### Production Build

1. Create a production build of the frontend
```
npm run build
```

2. Set up environment variables for production in `.env.production`

3. Start the production server
```
npm start
```

### Deployment Platforms

The application can be deployed to various platforms:

- **Heroku**: Use the provided `heroku-postbuild` script
- **Vercel/Netlify**: Deploy the frontend separately
- **AWS/GCP/Azure**: Deploy using Docker containers

## Usage

### User Types

- **Regular Users**: Can upload documents, view their own documents, and generate declarations
- **Administrators**: Can manage users, view all documents, and access system settings

### Document Processing Workflow

1. Upload a report from "gérant cite" (PDF, image, or Word document)
2. Select the language (Arabic or French) and incident type
3. The system extracts text and analyzes the content
4. Based on the incident type, appropriate documents are generated
5. Download the generated declaration and "dépôt de plainte" documents

## API Documentation

### Authentication Endpoints

- `POST /api/auth/register`: Register a new user
- `POST /api/auth/login`: Login and get JWT token
- `GET /api/auth/me`: Get current user information

### User Management Endpoints

- `GET /api/users`: Get all users (admin only)
- `POST /api/users`: Create a new user (admin only)
- `PUT /api/users/:id`: Update a user (admin only)
- `DELETE /api/users/:id`: Delete a user (admin only)

### Document Endpoints

- `POST /api/documents/upload`: Upload a new document
- `GET /api/documents`: Get all documents for current user (or all for admin)
- `GET /api/documents/:id`: Get a document by ID
- `POST /api/documents/:id/process`: Process a document
- `GET /api/documents/download/:id`: Download a document
- `DELETE /api/documents/:id`: Delete a document

## Testing

Run the test suite with:
```
npm test
```

This will execute both integration tests and API tests.

## License

This project is licensed under the ISC License.
