# Firefly ( DNSv3 )

Firefly (DNSv3) is a reverse proxy server with a web-gui, a bit like nginx

Notes:
- Written to be used with bun
- Does not run with node
- PNPM was used as a package manager
- Creating user accounts requires node as bun won't run the script for some reason

```bash
# Install dependencies
pnpm install
```

```bash
# Run
bun index.js
```

```bash
# Creating user accounts
node addUser.js <username>
```

# Building yourself

The client side interface is bundled with browserify
```bash
# Bundling with browserify
browserify ./assets/js/main.js -o ./assets/js/bundle.js
```

The rest is run with bun as shown above