# AI Capsule

AI Capsule is a full-stack web application for saving, reviewing and managing useful AI prompts.

The application uses a React frontend, Node.js and Express backend, SQLite database, GitHub OAuth authentication, and an application JWT issued by Express.

---

## Deployed Application

**Public URL:**  
https://ai-capsule-9ux4.onrender.com

**Cloud Platform:**  
Render

---

## Technology Stack

- React
- Vite
- Node.js
- Express
- SQLite
- GitHub OAuth
- JSON Web Tokens (JWT)
- Render

---

## Application Features

AI Capsule allows an authenticated user to:

- Create a prompt record
- View their saved prompt records
- Update an existing record
- Delete a record
- Store prompt metadata including:
  - Project name
  - Prompt title
  - Prompt version
  - Prompt text
  - Response summary
  - Category
  - Usefulness
  - Reviewed status
  - Improved status
  - Screenshot URL
  - Notes

Each record belongs to the authenticated user.

---

## Installation

Clone or extract the project and open the root project folder.

Install the backend dependencies:

```bash
npm install
```

Install the React frontend dependencies:

```bash
npm install --prefix client
```

On Windows PowerShell, I used `npm.cmd` instead of `npm`, for example:

```powershell
npm.cmd install
npm.cmd install --prefix client
```

---

## Running Locally

### Backend

From the root project folder, run:

```powershell
npm.cmd run server
```

The Express backend runs at:

```text
http://localhost:3000
```

The public health endpoint is:

```text
http://localhost:3000/api/health
```

and returns:

```json
{
  "status": "ok"
}
```

### Frontend

Open another terminal and run:

```powershell
cd client
npm.cmd run dev
```

The React development server runs at:

```text
http://localhost:5173
```

During development, Vite proxies API and authentication requests to the Express backend.

---

## Production Build

The React frontend can be built with:

```powershell
npm.cmd run build --prefix client
```

This creates the production frontend in:

```text
client/dist
```

Express serves this built React application in production, meaning the React frontend and Express backend use the same deployed URL.

---

## Required Routes

### Frontend Routes

| Route | Access | Purpose |
|---|---|---|
| `/` | Public | Displays the AI Capsule landing page |
| `/login` | Public | Starts GitHub OAuth authentication |
| `/dashboard` | Protected | Displays the authenticated user's capsule records |

### API Routes

| Route | Method | Access | Purpose |
|---|---|---|---|
| `/api/health` | GET | Public | Returns `{ "status": "ok" }` |
| `/api/capsules` | GET | Protected | Returns the authenticated user's records |
| `/api/capsules` | POST | Protected | Creates a new prompt record |
| `/api/capsules/:id` | PUT | Protected | Updates an existing prompt record |
| `/api/capsules/:id` | DELETE | Protected | Deletes an existing prompt record |
| `/api/auth/me` | GET | Protected | Returns information about the authenticated user |
| `/api/logout` | POST | Public | Clears the application session cookie |
| `/auth/github/callback` | GET | Public | Handles the GitHub OAuth callback |

---

## React and Express Communication

During local development, React runs through Vite on port `5173`, while Express runs on port `3000`.

Vite proxies requests such as:

```text
/api/*
/login
/auth/*
```

to the Express backend.

In production, the React frontend is built into `client/dist` and served directly by Express.

This means the deployed React frontend and Express API use the same Render domain.

I chose this architecture because it simplifies the application and avoids unnecessary cross-origin and cookie configuration.

---

## GitHub OAuth Authentication

GitHub OAuth is used as the external authentication provider.

The login process works as follows:

1. The user selects **Login with GitHub**.
2. Express redirects the user to GitHub's OAuth authorization page.
3. After authorization, GitHub redirects the user back to:

```text
/auth/github/callback
```

4. Express exchanges the authorization code for a GitHub access token.
5. Express uses the GitHub token to retrieve the authenticated user's GitHub user ID and username.
6. Express creates its own application JWT.
7. The application JWT contains the authenticated user's GitHub user ID.
8. The JWT is stored in a cookie named:

```text
token
```

The GitHub OAuth access token is not used as the application's login session token.

---

## Application JWT

After GitHub authentication succeeds, Express creates an application JWT.

The token contains information including:

```text
userId
username
```

The JWT is signed using the `JWT_SECRET` environment variable.

The JWT is stored in a cookie named `token`.

The cookie is configured as:

- HttpOnly
- Secure in production
- SameSite=Lax

The JWT is not stored in localStorage and is not sent through an Authorization Bearer header.

---

## JWT Authentication Middleware

JWT authentication middleware protects the required capsule routes:

```text
GET /api/capsules
POST /api/capsules
PUT /api/capsules/:id
DELETE /api/capsules/:id
```

For every protected request, the Express backend:

1. Reads the `token` cookie.
2. Verifies the JWT using `JWT_SECRET`.
3. Rejects the request if the token is missing or invalid.
4. Extracts the authenticated user's identity from the verified JWT.
5. Allows the request to continue only when authentication succeeds.

Requests with no valid JWT return:

```text
401 Unauthorized
```

---

## User Ownership

Every capsule record contains a `user_id`.

The frontend does not provide or choose the `user_id`.

Instead, the backend obtains the authenticated user from the verified JWT:

```javascript
req.user.userId
```

When a record is created, the authenticated user's GitHub user ID is stored as the record owner.

READ queries only return records belonging to the authenticated user.

UPDATE and DELETE also verify ownership.

For example, update and delete operations use conditions equivalent to:

```sql
WHERE id = ? AND user_id = ?
```

This prevents an authenticated user from modifying another user's prompt records.

---

## Database

The application uses SQLite.

The `capsules` table stores:

- `id`
- `user_id`
- `project_name`
- `prompt_title`
- `prompt_version`
- `prompt_text`
- `response_summary`
- `category`
- `usefulness`
- `reviewed`
- `improved`
- `screenshot_url`
- `notes`
- `created_at`

The database and table are automatically created when the backend starts if they do not already exist.

---

## Cloud Storage

The deployed application uses SQLite on Render's local filesystem.

Render's filesystem for this service is ephemeral.

This means the application works normally while the service is running, but stored SQLite data may be lost after a restart, rebuild or redeployment.

This limitation is acceptable for the submitted application, but a production application requiring permanent data storage should instead use a persistent database such as PostgreSQL.

---

## Environment Variables

The application uses the following environment variables:

```text
NODE_ENV
NODE_VERSION
GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET
GITHUB_CALLBACK_URL
JWT_SECRET
PORT
```

### NODE_ENV

Used to distinguish local development from production.

The Render deployment uses:

```text
production
```

### NODE_VERSION

Render is configured to use:

```text
22.22.0
```

### GITHUB_CLIENT_ID

The GitHub OAuth application's client ID.

### GITHUB_CLIENT_SECRET

The GitHub OAuth application's client secret.

### GITHUB_CALLBACK_URL

The deployed OAuth callback URL:

```text
https://ai-capsule-9ux4.onrender.com/auth/github/callback
```

### JWT_SECRET

Used by Express to sign and verify application JWTs.

### PORT

Used by Express for the server port.

Render supplies this value automatically in production.

No secret values are committed to the repository.

The local `.env` file is excluded through `.gitignore`.

---

## Required cURL Security Tests

The required cURL tests were performed against the deployed Render application.

### Test 1 - No Authentication

Command:

```bash
curl -i https://ai-capsule-9ux4.onrender.com/api/capsules
```

Result:

```text
401 Unauthorized
```

This confirms that the protected API cannot be accessed without authentication.

### Test 2 - Fake / Invalid JWT

Command:

```bash
curl -i -H "Cookie: token=fake-token-123" https://ai-capsule-9ux4.onrender.com/api/capsules
```

Result:

```text
401 Unauthorized
```

This confirms that the backend verifies the JWT rather than only checking whether a cookie named `token` exists.

---

## CRUD Verification

CRUD functionality was tested through the deployed application after completing GitHub OAuth authentication.

### CREATE

A new prompt record was created through the dashboard and stored using:

```text
POST /api/capsules
```

### READ

Saved prompt records were displayed through:

```text
GET /api/capsules
```

Only records belonging to the authenticated user are returned.

### UPDATE

An existing prompt record was edited through:

```text
PUT /api/capsules/:id
```

The updated information appeared correctly on the dashboard.

### DELETE

A prompt record was deleted through:

```text
DELETE /api/capsules/:id
```

The deleted record was removed from the dashboard.

---

## Cloud Deployment

The application is deployed as a Render Web Service.

### Public URL

```text
https://ai-capsule-9ux4.onrender.com
```

### Build Command

The Render build command is:

```bash
npm ci && npm rebuild sqlite3 --build-from-source=sqlite3 && npm ci --include=dev --prefix client && npm run build --prefix client
```

### Start Command

The Render start command is:

```bash
npm start
```

The React frontend is built during deployment and then served by the Express backend.

The deployed application therefore provides the React frontend, Express API, OAuth flow, JWT authentication and SQLite database through one public HTTPS service.

---

## Deployment Problem Identified and Corrected

During deployment, the application initially failed to start because of the native `sqlite3` dependency.

The Render logs reported an error similar to:

```text
GLIBC_2.38 not found
```

The installed SQLite native binary was not compatible with the GLIBC version available in the Render runtime.

The problem was corrected by rebuilding SQLite from source during deployment:

```bash
npm rebuild sqlite3 --build-from-source=sqlite3
```

After rebuilding the native SQLite dependency for Render's environment, the backend successfully started and connected to the SQLite database.

A separate deployment issue also occurred because Vite was not initially installed during the production build.

Because `NODE_ENV` was set to `production`, development dependencies were omitted.

This was corrected by explicitly installing the frontend development dependencies during the build:

```bash
npm ci --include=dev --prefix client
```

After these corrections, the React production build and Express backend deployed successfully.

---

## Implementation Decision

One implementation decision I made was to serve the React frontend and Express backend from the same deployed application.

Instead of deploying React and Express as separate services, React is built into:

```text
client/dist
```

and Express serves the resulting production files.

This gives the application one public origin:

```text
https://ai-capsule-9ux4.onrender.com
```

I chose this approach because it simplifies deployment and allows the JWT cookie to work between the frontend and backend without additional CORS or cross-origin cookie configuration.

---

## AI-Assisted Development

ChatGPT was used as an AI-assisted development tool during this assignment.

I used ChatGPT for:

- Project setup guidance
- React component development
- Express route development
- SQLite database integration
- CRUD implementation
- GitHub OAuth integration
- JWT authentication middleware
- Cloud deployment configuration
- Testing
- Debugging
- README preparation

I reviewed and tested AI-assisted code and configuration rather than assuming that generated output was correct.

### Problem Found and Corrected

One issue discovered during deployment involved AI-assisted SQLite deployment configuration.

The initial Render deployment used a native SQLite binary that was incompatible with Render's GLIBC environment.

The Render logs reported:

```text
GLIBC_2.38 not found
```

I reviewed the deployment logs and corrected the problem by rebuilding the `sqlite3` dependency from source as part of the Render build command.

Another issue involved Vite not being available during the production build because frontend development dependencies were omitted when `NODE_ENV=production`.

This was corrected by explicitly installing the frontend development dependencies before running the Vite build.

### OAuth and JWT Verification

GitHub OAuth was verified by logging into the deployed application using GitHub and confirming that the user was redirected to the protected dashboard.

The Express-issued JWT was verified indirectly through successful authenticated CRUD requests.

JWT protection was also tested using the required cURL commands.

A request with no JWT returned:

```text
401 Unauthorized
```

and a request containing:

```text
token=fake-token-123
```

also returned:

```text
401 Unauthorized
```

This verified that the backend checks the validity of the JWT.

### CRUD and User Ownership Verification

CREATE, READ, UPDATE and DELETE operations were tested through the deployed application.

User ownership is enforced by obtaining the authenticated user's GitHub ID from the verified JWT rather than accepting a `user_id` from the browser.

READ queries select records belonging to that user, while UPDATE and DELETE include both the record ID and authenticated user ID in their database conditions.

### Decision I Can Explain Independently

I chose to deploy the React frontend and Express backend together because the application is small and does not require separate frontend and backend infrastructure.

Serving both from the same origin simplified authentication because the Secure, HttpOnly JWT cookie can be used directly by requests to the Express API.

This also reduced the amount of CORS and cross-origin cookie configuration required.

---

## Known Limitation

The primary limitation of the submitted application is its use of SQLite on Render's ephemeral filesystem.

Capsule records may be lost when the Render service restarts, rebuilds or redeploys.

The application still demonstrates the required CRUD, OAuth, JWT, API protection and cloud deployment behaviour.

For a production application where prompt records must persist permanently, I would replace the deployed SQLite database with persistent PostgreSQL storage.