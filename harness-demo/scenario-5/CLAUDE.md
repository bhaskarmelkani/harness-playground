# ACME Dashboard API

## Finding code: ask System 1 first

Several files in this repo look alike. Before you grep or open files to find
where something lives, run:

```bash
node tools/system1.mjs rank "<what you are looking for>"
```

It gathers candidate files with a quick search and asks a fast decision model
(Cloudflare Clef-flash) which one the request is about. Open the top file. Look
further only if its probability is below 0.5.

## Architecture

| Directory    | Purpose                                              |
|--------------|------------------------------------------------------|
| `routes/`    | HTTP handlers                                        |
| `middleware/`| Express middleware                                   |
| `services/`  | Business logic                                       |
| `models/`    | Data access                                          |
| `config/`    | App and environment configuration                    |
| `utils/`     | Shared utilities                                     |
| `tools/`     | Developer helper scripts                             |
