# Task Manager REST API

REST API built with Node.js, Express and MongoDB that powers a project and task management application. Projects are split into tasks assigned to team members, and every task has its own activities, comments, files and screenshots.

**Live demo (frontend):** <https://react-task-manager.davidebalice.dev/>

**Frontend repository:** <https://github.com/davidebalice/task-manager-frontend-react>

![Screenshot](https://www.aroundweb.it/screenshot/react-task1.jpg)

![Screenshot](https://www.aroundweb.it/screenshot/react-task2.jpg)

## Features

- JWT authentication (Bearer token or cookie) with admin/user roles
- Projects with cover image, members and client
- Tasks assigned to project members
- Activities per task with status; completing them updates task and project progress
- Comments, file attachments and screenshots for every task
- Users and clients management, profile and password update, profile photo upload
- Image resizing with Sharp and file uploads with Multer
- Email sending through SMTP (Brevo)
- Demo mode that blocks write operations

## Tech stack

- [Node.js](https://nodejs.org/) 20+
- [Express 5](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/) with [Mongoose 9](https://mongoosejs.com/)
- [JSON Web Token](https://github.com/auth0/node-jsonwebtoken), [bcrypt](https://github.com/kelektiv/node.bcrypt.js)
- [Multer](https://github.com/expressjs/multer), [Sharp](https://sharp.pixelplumbing.com/)
- [Nodemailer](https://nodemailer.com/)

## Getting started

### Requirements

- Node.js 20 or later
- A MongoDB database (local or Atlas)

### Installation

```bash
git clone https://github.com/davidebalice/node-task-manager-api.git
cd node-task-manager-api
npm install
```

### Configuration

Create a `config.env` file in the project root:

```ini
DATABASE=mongodb://127.0.0.1:27017/taskmanager
PORT=8000
NODE_ENV=development
FILE_PATH=/absolute/path/to/node-task-manager-api
JWT_SECRET=change-me
JWT_EXPIRES_IN=90d
JWT_COOKIE_EXPIRES_IN=90
DEMO_MODE=false
EMAIL_FROM=info@example.com
BREVO_HOST=smtp-relay.brevo.com
BREVO_PORT=587
BREVO_USERNAME=
BREVO_PASSWORD=
```

Sample data (JSON exports of every collection) is available in the `db/` folder and can be imported with `mongoimport` or MongoDB Compass.

### Available scripts

| Command       | Description                              |
| ------------- | ---------------------------------------- |
| `npm start`   | Start the API (default port 8000)        |
| `npm run dev` | Start the API with `node --watch`        |

## API endpoints

All endpoints are prefixed with `/api`. Except for `login` and `signup`, they require an `Authorization: Bearer <token>` header.

### Auth and profile

| Method | Endpoint                      | Description                         |
| ------ | ----------------------------- | ----------------------------------- |
| POST   | `/login`                      | Log in and receive a JWT            |
| GET    | `/logout`                     | Log out                             |
| POST   | `/signup`                     | Register a new user                 |
| POST   | `/get/user`                   | Get the user owning the token       |
| GET    | `/profile`                    | Get the current user profile        |
| POST   | `/profile/update`             | Update the current user profile     |
| POST   | `/profile/password`           | Change the current user password    |
| POST   | `/profile/photo`              | Upload the current user photo       |
| POST   | `/forgotPassword`             | Request a password reset email      |
| PATCH  | `/resetPassword/:token`       | Reset the password with a token     |
| GET    | `/dashboard`                  | Dashboard data                      |
| GET    | `/getdemomode`                | Check whether demo mode is active   |

### Projects

| Method | Endpoint                      | Description                         |
| ------ | ----------------------------- | ----------------------------------- |
| GET    | `/projects`                   | List projects (`key`, `page`)       |
| POST   | `/add/project`                | Create a project                    |
| GET    | `/project/:id`                | Project details with tasks          |
| GET    | `/edit/project/:id`           | Project data for editing            |
| POST   | `/edit/project/:id`           | Update a project                    |
| POST   | `/project/delete/:id`         | Delete a project                    |
| GET    | `/project/members/:id`        | Project members                     |
| POST   | `/add/member/project/`        | Add a member to a project           |
| POST   | `/remove/member/project/`     | Remove a member from a project      |
| POST   | `/project/photo/:id`          | Upload the project cover            |
| GET    | `/project/cover/:filename`    | Get a project cover image           |
| POST   | `/active/project/:id`         | Activate/deactivate a project       |

### Tasks and activities

| Method | Endpoint                      | Description                         |
| ------ | ----------------------------- | ----------------------------------- |
| GET    | `/tasks/:id`                  | Tasks of a project                  |
| GET    | `/task/:id`                   | Task details                        |
| POST   | `/add/task`                   | Create a task                       |
| GET    | `/edit/task/:id`              | Task data for editing               |
| POST   | `/edit/task/:id`              | Update a task                       |
| POST   | `/task/delete/:id`            | Delete a task                       |
| POST   | `/task/members/:id`           | Task members                        |
| POST   | `/add/member/task/`           | Add a member to a task              |
| POST   | `/remove/member/task/`        | Remove a member from a task         |
| POST   | `/add/activity/`              | Create an activity                  |
| POST   | `/update/activity/`           | Update an activity                  |
| POST   | `/activity/update-status`     | Change an activity status           |
| POST   | `/delete/activity/`           | Delete an activity                  |

### Comments, files and screenshots

| Method | Endpoint                      | Description                         |
| ------ | ----------------------------- | ----------------------------------- |
| GET    | `/comment/:id`                | Comments of a task                  |
| POST   | `/add/comment/`               | Add a comment                       |
| POST   | `/update/comment/`            | Update a comment                    |
| POST   | `/delete/comment/`            | Delete a comment                    |
| GET    | `/file/:id`                   | Files of a task                     |
| POST   | `/add/file/`                  | Upload a file (multipart)           |
| POST   | `/update/file/`               | Update a file                       |
| POST   | `/delete/file/`               | Delete a file                       |
| GET    | `/download/:filename`         | Download a file                     |
| GET    | `/screenshot/:id`             | Screenshots of a task               |
| POST   | `/add/screenshot/`            | Upload a screenshot (multipart)     |
| POST   | `/update/screenshot/`         | Update a screenshot                 |
| POST   | `/delete/screenshot/`         | Delete a screenshot                 |
| GET    | `/screenshot/img/:filename`   | Get a screenshot image              |

### Users and clients (admin)

| Method | Endpoint                      | Description                         |
| ------ | ----------------------------- | ----------------------------------- |
| GET    | `/users`                      | List users                          |
| POST   | `/add/user`                   | Create a user                       |
| GET    | `/user/:id`                   | Get a user                          |
| POST   | `/user/:id`                   | Update a user                       |
| POST   | `/user/delete/:id`            | Delete a user                       |
| GET    | `/user/photo/:id`             | Get user photo info                 |
| POST   | `/user/photo/:id`             | Upload a user photo                 |
| GET    | `/user/img/:filename`         | Get a user image                    |
| POST   | `/user/password/:id`          | Change a user password              |
| POST   | `/send/email/user`            | Send an email to a user             |
| GET    | `/clients`                    | List clients                        |
| POST   | `/add/client`                 | Create a client                     |
| GET    | `/client/:id`                 | Get a client                        |
| POST   | `/client/:id`                 | Update a client                     |
| POST   | `/client/delete/:id`          | Delete a client                     |
| POST   | `/client/photo/:id`           | Upload a client photo               |
| GET    | `/client/img/:filename`       | Get a client image                  |
| POST   | `/send/email/client`          | Send an email to a client           |

## Project structure

```
controllers/   request handlers
middlewares/   query helpers, errors, email, demo mode
models/        Mongoose schemas
routers/       Express routers
i18n/          translations
db/            sample data (JSON exports)
uploads/       uploaded images and files
index.js       app entry point
```

## Author

**Davide Balice** – [davidebalice.dev](https://www.davidebalice.dev)
