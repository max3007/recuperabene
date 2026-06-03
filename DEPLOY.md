# Deploy di RecuperaBene

Due opzioni documentate:

- **Opzione A — Vercel + Turso** (*deploy attuale in produzione*): serverless, gratis,
  zero manutenzione. Vedi sotto.
- **Opzione B — AWS EC2 + Caddy**: una VM tutta tua. Vedi più in basso.

---

## Opzione A — Vercel + Turso (attuale)

L'app gira su **Vercel** (serverless) con il database su **Turso** (libSQL, SQLite-compatibile)
perché il filesystem di Vercel è effimero e non può ospitare un file SQLite persistente.

```
Internet ──HTTPS──> Vercel (middleware Basic Auth) ──> Route handlers ──> Turso (libSQL, eu-west-1)
```

**Adattamenti rispetto alla VM** (già nel codice):

- [lib/prisma.ts](lib/prisma.ts) usa l'adapter libSQL *web* quando `TURSO_DATABASE_URL` è
  presente; in locale resta il file SQLite via `DATABASE_URL`.
- [middleware.ts](middleware.ts) fa **Basic Auth** su tutte le route (sostituisce il Basic
  Auth di Caddy): **fail-closed** in produzione (se le credenziali mancano, blocca tutto).
- Gli endpoint AI (`/api/insights`, `/api/checkins/parse`) hanno un **rate limit** per IP
  ([lib/rate-limit.ts](lib/rate-limit.ts)): best-effort in memoria, difesa in profondità
  contro il burn di token (la protezione vera è il Basic Auth).
- Lo script `build` esegue `prisma generate && next build`.

### Setup (una tantum, via CLI)

```bash
# 1) DB su Turso
brew install tursodatabase/tap/turso
turso auth login
turso db create recuperabene
turso db shell recuperabene < prisma/migrations/20260603061555_init/migration.sql

# 2) progetto Vercel + variabili d'ambiente (Production)
pnpm dlx vercel login
pnpm dlx vercel link --yes --project recuperabene
TURSO_TOKEN=$(turso db tokens create recuperabene)
printf '%s' "$(turso db show recuperabene --url)" | pnpm dlx vercel env add TURSO_DATABASE_URL production
printf '%s' "$TURSO_TOKEN"                        | pnpm dlx vercel env add TURSO_AUTH_TOKEN production
printf '%s' "sk-ant-LA-TUA-CHIAVE"                | pnpm dlx vercel env add ANTHROPIC_API_KEY production
printf '%s' "max"                                 | pnpm dlx vercel env add BASIC_AUTH_USER production
printf '%s' "UNA-PASSWORD-ROBUSTA"                | pnpm dlx vercel env add BASIC_AUTH_PASSWORD production

# 3) deploy
pnpm dlx vercel --prod
```

Il progetto è collegato al repo GitHub: ogni `git push` su `main` triggera un deploy di
produzione. In alternativa, deploy manuale con `pnpm dlx vercel --prod`.

> ⚠️ Se cambi la migration/schema, **riapplica lo SQL a Turso** (`turso db shell ... < ...`):
> Prisma Migrate non parla direttamente con libSQL, quindi qui si applica il SQL a mano.

### Variabili d'ambiente (Vercel → Production)

| Var | Valore |
|---|---|
| `TURSO_DATABASE_URL` | `libsql://recuperabene-<org>.aws-eu-west-1.turso.io` |
| `TURSO_AUTH_TOKEN` | token da `turso db tokens create` (segreto) |
| `ANTHROPIC_API_KEY` | chiave Anthropic (segreto) |
| `BASIC_AUTH_USER` / `BASIC_AUTH_PASSWORD` | credenziali per aprire l'app |

---

# Opzione B — AWS EC2 + Caddy (uso personale)

Guida per mettere l'app online su una EC2 free-tier, accessibile **solo da te**
tramite password + HTTPS (Caddy). Architettura:

```
Internet ──HTTPS──> Caddy (443, Basic Auth) ──> Next.js (127.0.0.1:3000) ──> SQLite (file)
```

I file di supporto sono in [`deploy/`](deploy/): `Caddyfile`, `recuperabene.service`, `backup.sh`.

> ⚠️ **Costo**: la EC2 `t2.micro` è gratis **solo i primi 12 mesi** di un account nuovo
> (750 h/mese). Dopo, una `t3.micro` costa ~8-10 $/mese. Tienilo a mente.

---

## 1. Crea l'istanza EC2

Nella console AWS → EC2 → *Launch instance*:

- **AMI**: Ubuntu Server 24.04 LTS (free-tier eligible)
- **Tipo**: `t2.micro` (free tier)
- **Key pair**: creane una nuova e scarica il `.pem` (ti serve per SSH)
- **Network / Security group** — regole *inbound*:
  | Porta | Sorgente | Perché |
  |---|---|---|
  | 22 (SSH) | **solo il tuo IP** (My IP) | amministrazione |
  | 80 (HTTP) | Anywhere `0.0.0.0/0` | rinnovo certificato Let's Encrypt + redirect |
  | 443 (HTTPS) | Anywhere `0.0.0.0/0` | l'app (protetta da password) |

  **NON** aprire la 3000: l'app la usa solo in locale, ci parla Caddy.
- Storage: il default (8 GB) va bene.

Dopo l'avvio, assegna un **Elastic IP** (EC2 → Elastic IPs → Allocate → Associate
all'istanza). Serve perché l'IP pubblico non cambi quando fermi/riavvii l'istanza.

---

## 2. Dominio gratuito con DuckDNS

HTTPS richiede un dominio. [DuckDNS](https://www.duckdns.org) è gratis:

1. Accedi (con Google/GitHub), scegli un sottodominio, es. `recuperabene-tuonome`.
2. Nel campo *current ip* metti l'**Elastic IP** della EC2 e premi *update ip*.
3. Il tuo dominio sarà `recuperabene-tuonome.duckdns.org`.

---

## 3. Connettiti via SSH

```bash
chmod 400 ~/Downloads/tua-key.pem
ssh -i ~/Downloads/tua-key.pem ubuntu@TUO-ELASTIC-IP
```

I comandi successivi si eseguono **sulla EC2**.

---

## 4. Swap (importante su 1 GB di RAM)

La `t2.micro` ha 1 GB di RAM e il build di Next.js può esaurirla. Aggiungi 2 GB di swap:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## 5. Installa runtime e strumenti

```bash
sudo apt update
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs git sqlite3
sudo corepack enable           # abilita pnpm
node -v && pnpm -v
```

---

## 6. Clona e configura l'app

```bash
cd ~
git clone https://github.com/max3007/recuperabene.git
cd recuperabene

# File .env — SENZA virgolette (lo legge systemd, che non fa parsing di shell)
cat > .env <<'EOF'
DATABASE_URL=file:./prod.db
ANTHROPIC_API_KEY=sk-ant-LA-TUA-CHIAVE
EOF
chmod 600 .env
```

> Il DB di produzione è `prisma/prod.db` (separato da `dev.db`, ed è gitignorato).
> **Non** si esegue il seed: al primo accesso farai il setup con i tuoi dati reali.

---

## 7. Installa, migra, builda

```bash
pnpm install
pnpm exec prisma migrate deploy   # crea lo schema in prod.db (niente seed)
pnpm build
```

---

## 8. Avvia l'app come servizio (systemd)

```bash
sudo cp deploy/recuperabene.service /etc/systemd/system/recuperabene.service
sudo systemctl daemon-reload
sudo systemctl enable --now recuperabene
systemctl status recuperabene --no-pager     # deve risultare "active (running)"
curl -sI http://127.0.0.1:3000 | head -1      # atteso: HTTP/1.1 200 o 307
```

---

## 9. Caddy: HTTPS + password

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
  | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
  | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install -y caddy
```

Genera l'hash della password (scegli tu la password quando te la chiede):

```bash
caddy hash-password
# copia l'output, es: $2a$14$Xy....
```

Metti il Caddyfile (parti da quello del repo e personalizzalo):

```bash
sudo cp deploy/Caddyfile /etc/caddy/Caddyfile
sudo nano /etc/caddy/Caddyfile
#  - sostituisci  recuperabene-TUO.duckdns.org  col tuo dominio
#  - sostituisci  REPLACE_WITH_BCRYPT_HASH  con l'hash generato sopra
#  - se vuoi, cambia "max" con il tuo username

sudo systemctl reload caddy
```

Caddy ora ottiene il certificato Let's Encrypt da solo (serve che le porte 80/443
siano aperte e il dominio punti all'IP — vedi passi 1 e 2).

---

## 10. Prova

Apri `https://recuperabene-tuonome.duckdns.org` → il browser chiede user/password →
inserisci quelle scelte al passo 9 → arrivi al **setup** e inserisci i tuoi dati reali.

---

## 11. Backup automatico del database

```bash
chmod +x deploy/backup.sh
crontab -e
# aggiungi questa riga (backup ogni notte alle 3):
0 3 * * * /home/ubuntu/recuperabene/deploy/backup.sh
```

I backup finiscono in `~/backups/` (ultimi 14). Per portarli fuori dalla macchina,
vedi la riga `aws s3 sync` commentata in [`deploy/backup.sh`](deploy/backup.sh).

---

## Aggiornare l'app in futuro

```bash
cd ~/recuperabene
git pull
pnpm install
pnpm exec prisma migrate deploy
pnpm build
sudo systemctl restart recuperabene
```

## Comandi utili

```bash
sudo journalctl -u recuperabene -f     # log dell'app
sudo journalctl -u caddy -f            # log di Caddy (utile per problemi di certificato)
sudo systemctl restart recuperabene    # riavvia l'app
```

## Note di sicurezza

- L'app **non** ha auth applicativa: la protezione è **al perimetro** (Basic Auth di Caddy).
  Va bene per uso strettamente personale. Non condividere l'URL/credenziali.
- Tieni la 3000 chiusa nel security group: deve restare raggiungibile solo da `127.0.0.1`.
- La `ANTHROPIC_API_KEY` vive solo in `.env` sulla EC2 (permessi `600`), mai nel repo.
- Ruota la chiave Anthropic se sospetti una fuga; revoca quella vecchia dalla console.
