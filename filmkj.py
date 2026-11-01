import requests, sys, time, os

# ── TMDB ─────────────────────────────────────────────────────────────────────
TMDB_KEY  = "8d6d91941230817f7807d643736fc8bf"  # clé publique open demo
TMDB_BASE = "https://api.themoviedb.org/3"
IMG_BASE  = "https://image.tmdb.org/t/p/w500"
LANG      = "fr-FR"   # titres et descriptions en français

# ── LECTEURS (depuis server.js) ───────────────────────────────────────────────
def links(tmdb_id):
    i = tmdb_id
    return {
        "VF": {
            "Vidzy":           f"https://vidzy.org/movie/{i}/vf",
            "Pandora (Heiwa)": f"https://heiwastream.fr/embed/movie/{i}?lang=vf&autoplay=1",
            "Frembed":         f"https://frembed.cyou/api/film.php?id={i}",
            "Viper":           f"https://wwembed.wavewatch.cc/api/v1/streaming/ww-movie-{i}",
            "HD (Fluxora)":    f"https://fluxora.sbs/embed/zenix?tmdb={i}&type=movie&lang=vf",
        },
        "VOSTFR": {
            "VOSTFR 1 (Cinesrc)": f"https://cinesrc.st/embed/movie/{i}",
            "Vidzy VOSTFR":       f"https://vidzy.org/movie/{i}/vostfr",
            "Frembed (EN)":       f"https://frembed.cyou/api/film.php?id={i}&lang=en",
        }
    }

# ── FETCH ─────────────────────────────────────────────────────────────────────
def tmdb_get(path, params={}):
    params["api_key"] = TMDB_KEY
    params["language"] = LANG
    r = requests.get(TMDB_BASE + path, params=params, timeout=10)
    r.raise_for_status()
    return r.json()

def get_popular(pages=5):
    movies = []
    for p in range(1, pages + 1):
        data = tmdb_get("/movie/popular", {"page": p})
        movies.extend(data["results"])
        time.sleep(0.25)
    return movies

# ── FORMAT ────────────────────────────────────────────────────────────────────
def format_movie(m):
    tmdb_id  = m["id"]
    title    = m.get("title") or m.get("original_title") or "Sans titre"
    overview = (m.get("overview") or "Aucune description disponible.").strip()
    poster   = IMG_BASE + m["poster_path"] if m.get("poster_path") else "N/A"
    date     = m.get("release_date", "N/A")
    score    = m.get("vote_average", "N/A")
    genres   = ", ".join(str(g) for g in m.get("genre_ids", []))

    ls = links(tmdb_id)

    lines = []
    lines.append(f"Titre: {title}")
    lines.append(f"TMDB ID: {tmdb_id}")
    lines.append(f"Sortie: {date} | Note: {score}/10")
    lines.append(f"Description: {overview}")
    lines.append(f"Lien image: {poster}")
    lines.append("")
    lines.append("VF")
    for k, v in ls["VF"].items():
        lines.append(f"Lecteur {k}: {v}")
    lines.append("")
    lines.append("VOSTFR")
    for k, v in ls["VOSTFR"].items():
        lines.append(f"Lecteur {k}: {v}")
    lines.append("")

    return "\n".join(lines)

# ── MAIN ──────────────────────────────────────────────────────────────────────
def main():
    pages = int(sys.argv[1]) if len(sys.argv) > 1 else 5  # 5 pages = 100 films
    out   = sys.argv[2] if len(sys.argv) > 2 else "films.txt"

    print(f"[*] Récupération de {pages} page(s) depuis TMDB...")
    movies = get_popular(pages)
    print(f"[*] {len(movies)} films trouvés")

    blocks = []
    for i, m in enumerate(movies):
        print(f"\r[{i+1}/{len(movies)}] {m.get('title','?')[:40]:<40}", end="", flush=True)
        blocks.append(format_movie(m))

    with open(out, "w", encoding="utf-8") as f:
        f.write("\n".join(blocks))

    print(f"\n[✓] {out} — {len(movies)} films, {os.path.getsize(out)//1024} KB")

if __name__ == "__main__":
    main()
