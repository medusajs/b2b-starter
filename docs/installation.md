# Installation

## Prerequisites

- [x] Node JS (https://nodejs.org/en/download)
- [x] PNPM (https://pnpm.io/installation)
  - [x] npm install -g pnpm
- [ ] Redis
  - [ ] `Docker pull redis`
  - [ ] Container Name: `maxxam-b2b-cache`
  - [ ] Port: 6379
- [ ] PostgreSQL
  - [ ] `Docker pull postgres`
    - Container Name: `maxxam-b2b`
    - Volume Container Path: `/var/lib/postgresql`
    - POSTGRES_USER: `medusa`
    - POSTGRES_PASSWORD: `maxxam!T`
    - POSTGRES_DB: `maxxam`
    - Port: 5432
  - Docker DB
    - `psql -U admin -d maxxam`
- [ ] pnpm install
- [ ] cd maxxam-b2b
  - [ ] pnpm medusa db:migrate