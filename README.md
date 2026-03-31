# Revley hiring challenge FT

This repo contains a sample subscription billing system (NestJS), a merchant portal (Next.js) where merchants can view store transactions, and a checkout page for customers (Next.js). Your goal is to implement a minimal complete solution so that customers can checkout, merchants can view transactions & subscriptions, and design architecture that can scale.

The objective is to simulate day-to-day work at Revley: interpreting loosely defined requirements, navigating an unfamiliar codebase, making meaningful changes, and verifying correctness.

- Timebox: ~4-6 hours.
- Use of AI tools is encouraged. Please mention which tools you used in the PR description.
- You are responsible for the quality/correctness of your submission. We prefer a small, high-quality change set over lots of code.

## Checkout
Standalone application where customers provide their billing information, optionally choose subscription, and checkout.

<img width="1338" height="743" alt="image" src="https://github.com/user-attachments/assets/777d3c6f-04d1-4f15-8605-5ff22698a5e8" />


## Merchant Portal
Dashboard for merchants to monitor store transactions, subscriptions, and configure settings & processors.

<img width="1181" height="510" alt="image" src="https://github.com/user-attachments/assets/03f9ab0b-d062-4b35-a7fd-6231bb998f2d" />


## Subscription Service
Backend REST API which handles checkouts, merchant portal queries, and payment processing. Swagger docs for testing APIs.

<img width="1803" height="825" alt="image" src="https://github.com/user-attachments/assets/8dc703dd-14ba-42b8-9572-4f1ead17730f" />


## Process

### Git
1. Clone this repo locally.
2. Create a new **private** GitHub repository under your own account (do not fork).
3. For each task in the **Challenge** section below:
    - Branch off main with properly named branch
    - Implement changes
    - Create a concise PR with:
        - Short description
        - Decisions/tradeoffs/assumptions
        - Testing steps
    - Squash-commit to main
4. Add shrish@revley.ai as a collaborator on your private repository.

### Running the services
Terminal session 1: backend
```bash
cd subscription-service
npm i
cp .env.example .env

npx supabase start  # will take some time
# copy SUPABASE_PK (publickey) and SUPABASE_SK (secretkey) from the output into .env
# (use `npx supabase status` to re-print if needed)

npm run start:dev   # will auto-reload on changes

# Navigate to http://localhost:3000/docs for swagger docs

# To run tests
npm run test
```

Terminal session 2: merchant portal
```bash
cd merchant
npm i
cp .env.example .env
# copy SUPABASE_PK from before 

npm run dev

# Navigate to http://localhost:3001/
# Use creds: `merchant1@example.com` and `password`
# All data on transactions & subscriptions pages are mocked
# Settings page has rough implementations for configuring integrations and choosing checkout payment processor
```

Terminal session 3: checkout
```bash
cd checkout
npm i
npm run dev

# Navigate to http://localhost:3002/
# Optionally toggle subscription, then checkout (need to hook up to backend)
```

### Challenge

Before starting the challenges, skim the codebase to understand existing patterns. Follow best practices for code quality and testing.

#### Implement checkout
When the customer goes to the checkout application and provides their billing information they should be able to click checkout. This should hit the `/checkout` endpoint on subscription-service backend.

The backend logic for checkout should be determining which payment processor to use (based on the merchant's configuration), validating the card, and performing a sale transaction. If there is a subscription then it needs to be scheduled using the mock eventbridge service.

Ensure sufficient information is stored in the database. You will need to extend the tables (ex. customers, payment_methods, transaction, subscription, ...) so plan carefully before implementing.

#### Support merchants viewing store activity
Merchant Portal has pages to see transactions and subscriptions but they're all mock data. Implement the backend endpoints and connect with the frontend.

Consider situations where there could be many transactions & subscriptions so be sure to follow best practices in your API implementation.

#### Support merchants configuring a % split accross processors for checkout
Merchant Portal settings page currently has a dropdown select for choosing which processor to use at checkout. We need to support the merchant being able to provide a % split so that checkout traffic can be routed to different processors.

Be sure to think through:
- How should the merchant specify this split (UI)
- How should we save this configuration (DB)
- How should the checkout logic change (/checkout)

#### Propose design for this system to handle higher scale
During high traffic events (ex. sales, holidays) it is likely that the system will hit payment processors' rate limits. Propose a design change so that your system can handle such events.

- Write a Markdown document outlining your system design
- Keep it concise and clear
- Feel free to include diagrams (ex. Mermaid, Excalidraw) to support your proposal

This is your opportunity to demonstrate engineering depth and stand apart from other candidates.

## Submission requirements (strict)
- Upload your solution to a **private** GitHub repository under your own account (do not fork).
- Add shrish@revley.ai as a collaborator on that private repository.
- Once complete, you should have several reviewable PRs with your changes as you address each task, and a clean git commit history
