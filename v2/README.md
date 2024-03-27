This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Installation

Create database with the following command
- Should be executed from the lunsj_ala_fornebu directory

```
node ./lib/database-seed.js YourAdminUsername YourAdminPassword
```

## Running project
To  run the development server ([http://localhost:3000](http://localhost:3000)):

```
npm run dev
```

## Security Concerns
- Passwords are stored in plain text
- Database file is in source control
- No extra handling for sanitization of inputs either to database(Injection) or frontend(XSS)
- Will try to eliminate some of these, though the most important is XSS
    - No trivial data stored here


