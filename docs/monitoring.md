# Monitoring Demo - 3.12

Kratak vodič za demonstraciju monitoring infrastrukture.

## Pokretanje Prometheus + Grafana

Iz `youtubic-FTN-backend` direktorijuma pokreni:

```bash
docker compose up -d
```

**Portovi:**
- Grafana: http://localhost:3000 (admin/admin)
- Prometheus: http://localhost:9090

## Monitoring Linkovi u Aplikaciji

**Dostupno samo u DEVELOPMENT modu:**

1. **Monitoring dugmići** - U gornjem desnom uglu navbar-a (vidljivo samo kada si ulogovan):
   - "Grafana" - otvara Grafana dashboard u novom tabu
   - "Prometheus" - otvara Prometheus UI u novom tabu

2. **Load Test stranica** - Dostupna preko "Load Test" dugmeta u navbar-u:
   - Omogućava generisanje saobraćaja ka backendu
   - Prikazuje statistike: ukupno zahteva, uspešno, greške, avg i p95 latenciju

## Demo Scenario

### 1. Pokreni Backend i Monitoring

```bash
# Terminal 1: Backend
cd youtubic-FTN-backend
mvn spring-boot:run

# Terminal 2: Monitoring
cd youtubic-FTN-backend
docker compose up -d
```

### 2. Pokreni Frontend (DEV mod)

```bash
cd youtubic-FTN-frontend
npm run dev
```

### 3. Uloguj se u aplikaciju

Otvori aplikaciju u browser-u i uloguj se.

### 4. Pokreni Load Generator

1. Klikni na "Load Test" dugme u navbar-u
2. Postavi:
   - **Requests per second**: 200
   - **Duration**: 60 sekundi
   - **Endpoint Template**: GET /api/posts/public
3. Klikni "Start"

### 5. Posmatraj Metrike u Grafani

1. Klikni na "Grafana" dugme u navbar-u (otvara se u novom tabu)
2. Dashboard "Youtubic Backend Monitoring" se automatski učitava
3. Posmatraj sledeće metrike:
   - **HikariCP Connections** - Active vs Idle konekcije (treba da se vidi povećanje active konekcija)
   - **CPU Usage** - Process i System CPU (treba da se vidi povećanje pod opterećenjem)
   - **Active Users (24h)** - Broj aktivnih korisnika (treba da se vidi tvoj korisnik)

### 6. Zaustavi Load Test

Klikni "Stop" na Load Test stranici kada želiš da prekineš generisanje saobraćaja.

## Napomene

- Load Test stranica je dostupna samo u development modu (`import.meta.env.DEV`)
- Monitoring linkovi su vidljivi samo kada si ulogovan i u DEV modu
- Backend mora biti pokrenut na portu 8080
- Prometheus skrejpuje metrike sa 10 sekundi intervala
- Grafana dashboard se automatski refresh-uje svakih 10 sekundi

