# Merchant Portal

In this Next.js Shadcn application merchants will be able to login and view how their store is doing. Here they will be able to see the following pages:
- transactions table (see mock data for fields)
- subscriptions table (see mock data for fields)
- store settings page
    - integrations
        - stripe, NMI, shopify
        - each a card with indicator for active or not
        - selecting will trigger panel where user can enter credentials and enable/disable
    - choose processor to use at checkout (dropdown select stripe, NMI)

Currently this will all be client-side mocked as follows:

Users (username, password)
- merchant1, password
- merchant2, password

Transactions (customer, amount, type, most recent state, processor, last updated date)
- John Doe, 34.99, sale, captured, stripe, march-13-2026
- Jane Doe, 34.99, sale, captured, stripe, march-22-2026
- Jane Doe, 34.99, sale, failed, stripe, march-22-2026
- Bob Lee, 134.99, recurring, auth, NMI, march-13-2026
...10 more like this

Subscriptions (customer, amount, status, processor, next billing date)
- Bob Lee, 134.99, active, NMI, april-13-2026
- Jack Clyne, 34.99, inactive, STRIPE, april-13-2026
...5 more like this
