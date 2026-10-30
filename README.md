# Vaultify API

Vaultify is a personal information vault API for securely managing saved information in one place. It provides authentication, account management, and endpoints for creating and managing personal vault entries.

The API is built with Node.js, Express, TypeScript, PostgreSQL, and Prisma. It also includes email verification, password recovery, request validation, rate limiting, and encryption for sensitive vault values.

## Features

### Authentication and account management

- User registration and login
- JWT access-token and refresh-token authentication
- Email verification using OTP
- Forgot-password and password-reset flows
- Retrieve and update the authenticated user's profile
- Change password and soft delete account

### Personal vault

- Create, view, update, and soft-delete vault entries
- Organize entries by category and tags
- Search, filter, sort, and paginate entries
- Encrypt sensitive values before storing them in the database

### Validation and protection

- Request validation with Zod
- Password hashing with bcrypt
- Rate limiting with Upstash Redis
- AES-256-GCM encryption for sensitive vault values

## Technology Stack

| Technology     | Purpose                                 |
| -------------- | --------------------------------------- |
| Node.js        | JavaScript runtime                      |
| Express 5      | API server and routing                  |
| TypeScript     | Static typing                           |
| PostgreSQL     | Relational database                     |
| Prisma 7       | ORM and database access                 |
| JSON Web Token | Access and refresh token authentication |
| bcrypt         | Password hashing                        |
| AES-256-GCM    | Encryption for sensitive vault values   |
| Upstash Redis  | Rate limiting and temporary data        |
| Zod            | Request validation                      |
| Nodemailer     | Sending emails                          |
| EJS            | Email templates                         |
| tsup           | Production build                        |
| tsx            | TypeScript development runner           |

## Getting Started

### Prerequisites

Before running the project, make sure you have:

- Node.js and npm installed
- A PostgreSQL database
- An Upstash Redis database
- SMTP credentials for sending emails

### 1. Clone the repository

```bash
git clone https://github.com/Newton2n/vaultify-api.git
cd vaultify-api
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the project root and add the variables used by the application:

```env
# Application
PORT=5000
APP_URL=http://localhost:5000

# Database
DATABASE_URL="your_postgresql_connection_string"

# Password hashing
BCRYPT_SALT_ROUNDS=12

# JWT
JWT_ACCESS_SECRET="your_access_token_secret"
JWT_REFRESH_SECRET="your_refresh_token_secret"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Upstash Redis
UPSTASH_REDIS_REST_URL="your_upstash_redis_rest_url"
UPSTASH_REDIS_REST_TOKEN="your_upstash_redis_rest_token"

# SMTP
SMTP_USER="your_smtp_username"
SMTP_EMAIL_SENDER="your_sender_email"
SMTP_PASSWORD="your_smtp_password"

# Encryption
ENCRYPTION_KEY="your_64_character_hex_encoded_key"
```

Replace the example values with your actual credentials. These variable names match the application's configuration.

**Keep your environment variables private.** Do not commit your `.env` file or expose server-side secrets in frontend code.

The `ENCRYPTION_KEY` must be a 32-byte key represented as 64 hexadecimal characters for the AES-256-GCM implementation. Store it as a Secret environment variable in your deployment platform. Keep a secure backup separately from your database backups. If the key is lost, existing encrypted values cannot be decrypted. Do not replace the key without planning a key-rotation and data-migration process.

### 4. Generate the Prisma client

```bash
npx prisma generate
```

### 5. Run database migrations

For local development:

```bash
npx prisma migrate dev
```

For production deployment:

```bash
npx prisma migrate deploy
```

### 6. Start the development server

```bash
npm run dev
```

## Available Scripts

| Command         | Description                                     |
| --------------- | ----------------------------------------------- |
| `npm run dev`   | Start the development server with `tsx watch`   |
| `npm run build` | Build the application with tsup                 |
| `npm start`     | Start the compiled server from `dist/server.js` |

## API Reference

All endpoints use the `/api/v1` prefix.

### Base URL

**Production**

```text
https://vaultify-api-five.vercel.app/api/v1
```

**Local development**

```text
http://localhost:5000/api/v1
```

### Authentication

| Method | Endpoint                        | Description                              |
| ------ | ------------------------------- | ---------------------------------------- |
| `POST` | `/auth/register`                | Register a new user                      |
| `POST` | `/auth/login`                   | Log in                                   |
| `GET`  | `/auth/me`                      | Get the authenticated user's information |
| `POST` | `/auth/refresh-token`           | Refresh the access token                 |
| `POST` | `/auth/send-verification-email` | Send an email-verification OTP           |
| `POST` | `/auth/verify-email`            | Verify the email address                 |

### User Management

| Method   | Endpoint                 | Description                              |
| -------- | ------------------------ | ---------------------------------------- |
| `POST`   | `/users/forgot-password` | Request a password-reset OTP             |
| `POST`   | `/users/reset-password`  | Reset the password using the OTP         |
| `PATCH`  | `/users/me`              | Update the authenticated user's profile  |
| `PATCH`  | `/users/me/password`     | Change the authenticated user's password |
| `DELETE` | `/users/me`              | Delete the authenticated user's account  |

### Vault Entries

| Method   | Endpoint     | Description                          |
| -------- | ------------ | ------------------------------------ |
| `POST`   | `/vault`     | Create a vault entry                 |
| `GET`    | `/vault`     | Get the authenticated user's entries |
| `GET`    | `/vault/:id` | Get a vault entry by ID              |
| `PATCH`  | `/vault/:id` | Update a vault entry                 |
| `DELETE` | `/vault/:id` | Soft-delete a vault entry            |

Protected requests in the included Postman collection use a bearer access token:

```http
Authorization: Bearer <access_token>
```

### Vault entry categories

Vault entries can be organized using the following categories:

- `EMAIL`
- `PHONE`
- `LINK`
- `PROJECT`
- `NOTE`
- `RESOURCE`
- `OTHER`

Entries can also include a description, tags, and an `isSensitive` flag.

## Encryption

Vaultify uses AES-256-GCM to encrypt sensitive vault values before storing them in PostgreSQL. The encrypted payload includes the initialization vector (IV), authentication tag, and ciphertext, along with a version prefix.

AES-GCM provides confidentiality and integrity checking. When an authorized request retrieves a sensitive entry, the API decrypts its value before returning it.

This is server-side encryption, not end-to-end encryption. The API has access to the encryption key and can decrypt stored values. Protecting the key is therefore essential.

## Testing with Postman

You can import the Postman collection included with the project to test the API endpoints.

The collection uses the following variables:

| Variable          | Purpose                                                     |
| ----------------- | ----------------------------------------------------------- |
| `baseUrl`         | API base URL                                                |
| `accessToken`     | Access token for protected requests                         |
| `vaultEntryId`    | ID used for vault-entry detail, update, and delete requests |
| `userEmail`       | Email used in password-recovery requests                    |
| `verificationOtp` | Email-verification OTP                                      |
| `resetOtp`        | Password-reset OTP                                          |

The login request is configured to save the access token from a successful response when it matches the expected response structure. The create-entry request similarly attempts to save the returned entry ID.

Use your own test account and the OTPs sent through the email flow. Any sample email addresses or OTP values in the collection are placeholders.

## Security Considerations

- Store password hashes, not plaintext passwords.
- Keep database credentials, JWT secrets, Redis credentials, SMTP credentials, and the encryption key in environment secrets.
- Never commit `.env` files or expose backend secrets to the client.
- Use HTTPS in production.
- Back up the encryption key securely and separately from database backups.
- Apply appropriate rate limits to login, registration, verification, and password-reset endpoints.
- Validate incoming data before processing it.
- Avoid logging passwords, OTPs, tokens, encryption keys, or decrypted vault values.


