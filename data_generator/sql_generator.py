#!/usr/bin/env python3
"""
Generate dummy SQL data for the social-matching app *including* full `profiles` rows
with realistic preference fields and Colorado-bounded geolocation.

New in this revision
--------------------
* **--with-preferences / --no-preferences** - toggle generation of preference
  fields inside `profiles`.
* **Colorado-only coordinates** - `user_location` is filled with a PostGIS
  GEOGRAPHY point created via `ST_SetSRID(ST_MakePoint(lon, lat),4326)`.
* Adds extra CLI knobs for match-distance and age-range bounds.

Example
~~~~~~~
python generate_dummy_data.py \
    --num-users 20 \
    --min-posts 2 --max-posts 5 \
    --username-pattern "demo{index}" \
    --default-pic "https://placehold.co/128x128" \
    --with-preferences \
    --match-distance-min 5 --match-distance-max 1000 \
    --age-min-bound 18 --age-max-bound 60 \
    --out dummy_data.sql
"""
from __future__ import annotations

import argparse
import random
import textwrap
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Dict, Any, Sequence, Tuple
import pandas as pd
import os
import csv
import random

try:
    from faker import Faker
except ImportError:  # pragma: no cover
    print("[!] Install faker via 'pip install faker' for richer dummy data; falling back to simple content.")
    Faker = None  # type: ignore

SEED = 42  # global RNG seed for reproducibility

######################################################################
# Helper classes / functions
######################################################################

class Raw(str):
    """Marker for SQL snippets that must *not* be quoted by the inserter."""


def raw(sql: str) -> Raw:  # convenience
    return Raw(sql)


def esc(s: str) -> str:
    """Escape single quotes so they’re safe in SQL string literals."""
    return s.replace("'", "''")


def uniform_datetime(start: datetime, end: datetime) -> datetime:
    """Return a random datetime between *start* and *end* (uniform)."""
    delta = end - start
    return start + timedelta(seconds=random.randint(0, int(delta.total_seconds())))

def read_image_urls_from_csv(path: str) -> List[str]:
    urls = []
    with open(path, newline='', encoding='utf-8') as csvfile:
        reader = csv.reader(csvfile)
        next(reader, None)  # Skip header
        for row in reader:
            if len(row) > 1:
                urls.append(row[1])
    return urls

def merge_photo_csvs(filenames: list, output_path: str = "combined_photos.csv") -> pd.DataFrame:
    """
    Merges photo CSV files into one DataFrame with 'url' and 'category' columns.
    
    Each input CSV is expected to have a header row like: Index,ImageURL
    """

    merged_data = []

    for file in filenames:
        try:
            df = pd.read_csv(file)

            # Expect column name 'ImageURL', convert to 'url'
            if "ImageURL" not in df.columns:
                raise ValueError(f"{file} is missing 'ImageURL' column")

            df = df[["ImageURL"]].rename(columns={"ImageURL": "url"})

            category = os.path.basename(file).replace("_urls.csv", "").replace("_photos.csv", "").replace("_", " ")
            df["category"] = category
            merged_data.append(df)

        except Exception as e:
            print(f"Error processing {file}: {e}")

    if not merged_data:
        raise ValueError("No valid CSVs provided or processed.")

    combined_df = pd.concat(merged_data, ignore_index=True)
    combined_df.to_csv(output_path, index=False)
    print(f"Combined CSV saved to {output_path}")

    return combined_df

def dataframe_to_photo_dict(df: pd.DataFrame) -> Dict[str, List[Dict[str, str]]]:
    photo_dict = {}
    for _, row in df.iterrows():
        category = row["category"]
        url = row["url"]
        photo_dict.setdefault(category, []).append({"url": url})
    return photo_dict

def load_caption_dict(captions_csv_path: str) -> Dict[str, List[str]]:
    """
    Loads a combined captions CSV and returns a dictionary of category -> list of captions.

    Args:
        captions_csv_path (str): Path to the CSV file with 'category' and 'caption' columns.

    Returns:
        Dict[str, List[str]]: Dictionary of category to list of captions.
    """
    df = pd.read_csv(captions_csv_path)

    if 'category' not in df.columns or 'caption' not in df.columns:
        raise ValueError("CSV must contain 'category' and 'caption' columns.")

    caption_dict = {}
    for _, row in df.iterrows():
        category = row["category"]
        caption = row["caption"]
        caption_dict.setdefault(category, []).append(caption)

    return caption_dict


######################################################################
# Builders
######################################################################

def build_users(num: int, pattern: str, faker) -> List[Dict[str, Any]]:
    users = []
    for i in range(1, num + 1):
        username = pattern.format(index=i)
        email = faker.email() if faker else f"{username}@example.com"
        users.append(
            {
                "id": i,
                "username": username,
                "email": email,
                "password_hash": "$2a$10$bxFZMt4M6IjHAKj6peP.wu6ps2TBA2RCoCoJCE..z/8oNJXJKJvTa",  # word 'dev'
                "created_at": faker.date_time_between(start_date="-2y", end_date="now") if faker else datetime.now(),
            }
        )
    return users

def build_posts(
    users: Sequence[Dict[str, Any]],
    caption_dict: Dict[str, List[str]],
    photo_dict: Dict[str, List[Dict[str, str]]],
    min_p: int,
    max_p: int,
    start: datetime,
    end: datetime,
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    posts: List[Dict[str, Any]] = []
    photos: List[Dict[str, Any]] = []

    post_id = 1
    photo_id = 1

    # Only categories that exist in both caption and photo dictionaries
    categories = list(set(caption_dict.keys()) & set(photo_dict.keys()))

    for user in users:
        for _ in range(random.randint(min_p, max_p)):
            category = random.choice(categories)
            caption = random.choice(caption_dict[category])
            photo_data = random.choice(photo_dict[category])
            created_at = uniform_datetime(start, end)

            # Create the photo record
            photo = {
                "id": photo_id,
                "url": photo_data["url"],
                "description": caption,
                "uploaded_at": created_at,
            }
            photos.append(photo)

            # Create the post record
            post = {
                "id": post_id,
                "user_id": user["id"],
                "photo_id": photo_id,
                "title": caption,
                "body": "",  # Optional: use caption again or leave empty
                "created_at": created_at,
            }
            posts.append(post)

            post_id += 1
            photo_id += 1

    return posts, photos

def build_friendships(
    users: Sequence[Dict[str, Any]], min_f: int, max_f: int
) -> List[Tuple[int, int]]:
    friendships: set[Tuple[int, int]] = set()
    ids = [u["id"] for u in users]
    for uid in ids:
        possible = list(set(ids) - {uid})
        for fid in random.sample(possible, k=min(max_f, max(min_f, len(possible))))[: random.randint(min_f, max_f)]:
            friendships.add(tuple(sorted((uid, fid))))
    return sorted(friendships)

######################################################################
# User Interests
######################################################################

INTERESTS = [
    "Art", "Animation", "Astrology", "Baking", "Board Games", "Books", "Cars",
    "Climbing", "Coffee", "Comedy", "Cooking", "Cycling", "Dancing", "Design", "DIY",
    "Drawing", "Fashion", "Fitness", "Food", "Gaming", "Gardening", "Hiking", "History",
    "Investing", "Languages", "Movies", "Music", "Outdoors", "Painting", "Pets",
    "Philosophy", "Photography", "Poetry", "Podcasts", "Politics", "Programming",
    "Reading", "Running", "Science", "Shopping", "Singing", "Skincare", "Spirituality",
    "Sports", "Streaming", "Technology", "Theater", "Travel", "Video Editing",
    "Volunteering", "Walking", "Writing", "Yoga"
]

def build_interests() -> List[Dict[str, Any]]:
    return [{"id": i + 1, "name": name} for i, name in enumerate(INTERESTS)]

def build_user_interests(users: List[Dict[str, Any]], interests: List[Dict[str, Any]], n: int = 8) -> List[Dict[str, int]]:
    user_interests = []
    interest_ids = [i["id"] for i in interests]

    for user in users:
        chosen = random.sample(interest_ids, n)
        for interest_id in chosen:
            user_interests.append({
                "user_id": user["id"],
                "interest_id": interest_id
            })

    return user_interests

######################################################################
# Colorado helpers
######################################################################

# Rough bounding box for Colorado (lat 37-41, lon -109--102)
CO_LAT_RANGE = (37.0, 41.0)
CO_LON_RANGE = (-109.05, -102.05)
CO_CITIES = [
    "Denver", "Colorado Springs", "Fort Collins", "Boulder", "Pueblo", "Aurora",
    "Greeley", "Grand Junction", "Durango", "Aspen", "Vail", "Loveland",
]


def random_co_point() -> Tuple[float, float]:
    lat = random.uniform(*CO_LAT_RANGE)
    lon = random.uniform(*CO_LON_RANGE)
    return lon, lat  # note: (lon, lat) order for PostGIS POINT

######################################################################
# Profiles (with optional preferences)
######################################################################

def build_profiles(
    users: Sequence[Dict[str, Any]],
    default_pic: str,
    faker,
    with_prefs: bool,
    match_dist_bounds: Tuple[int, int],
    age_bounds: Tuple[int, int],
    profile_pics: Sequence[str] = None,
) -> List[Dict[str, Any]]:
    profiles: List[Dict[str, Any]] = []
    genders = ["male", "female", "nonbinary", "other"]
    for u in users:
        birthday = faker.date_of_birth(minimum_age=18, maximum_age=100) if faker else datetime(1990, 1, 1).date()
        base = {
            "user_id": u["id"],
            "display_name": faker.name() if faker else u["username"].title(),
            "biography": faker.text(max_nb_chars=140) if faker else "",
            "birthday": birthday.strftime("%Y-%m-%d"),
            "profile_picture_url": random.choice(profile_pics) if profile_pics else default_pic,
        }
        if not with_prefs:
            profiles.append(base)
            continue

        # location and prefs
        lon, lat = random_co_point()
        age_min = random.randint(18, 30)
        age_max = random.randint(max(age_min + 2, 25), age_bounds[1])
        base.update(
            {
                "spotify_song_id": None,
                "user_location_text": random.choice(CO_CITIES),
                "user_location": raw(f"ST_SetSRID(ST_MakePoint({lon:.6f}, {lat:.6f}),4326)::GEOGRAPHY"),
                "match_distance_miles": random.randint(*match_dist_bounds),
                "gender": random.choice(genders),
                "preferred_gender": random.choice(genders + [None]),
                "preferred_age_min": age_min,
                "preferred_age_max": age_max,
            }
        )
        profiles.append(base)
    return profiles

######################################################################
# Build Matches between users
######################################################################

def build_matches(users: List[Dict[str, Any]], min_matches=1, max_matches=3, start=None, end=None) -> List[Dict[str, Any]]:
    matches = set()
    matched_rows = []

    user_ids = [u["id"] for u in users]

    for user_id in user_ids:
        num_matches = random.randint(min_matches, max_matches)
        possible_matches = set(user_ids) - {user_id}
        chosen = random.sample(list(possible_matches), min(num_matches, len(possible_matches)))

        for match_id in chosen:
            # Enforce (A, B) = (B, A) symmetry check to avoid duplicates
            match_key = tuple(sorted((user_id, match_id)))
            if match_key not in matches:
                matches.add(match_key)
                matched_at = uniform_datetime(start, end)
                matched_rows.append({
                    "user_id": match_key[0],
                    "matched_user_id": match_key[1],
                    "matched_at": matched_at
                })

    return matched_rows

######################################################################
# SQL generator
######################################################################

def sql_insert(table: str, rows: List[Dict[str, Any]]) -> str:
    if not rows:
        return ""
    columns = list(rows[0].keys())
    lines = [f"INSERT INTO {table} ({', '.join(columns)}) VALUES"]
    bulk: List[str] = []
    for r in rows:
        vals: List[str] = []
        for c in columns:
            v = r[c]
            if v is None:
                vals.append("NULL")
            elif isinstance(v, Raw):
                vals.append(str(v))
            elif isinstance(v, datetime):
                vals.append(f"'{v.strftime('%Y-%m-%d %H:%M:%S')}'")
            else:
                vals.append(f"'{esc(str(v))}'") if isinstance(v, str) else vals.append(str(v))
        bulk.append("(" + ", ".join(vals) + ")")
    lines.append(",\n".join(bulk) + ";\n")
    return "\n".join(lines)

######################################################################
# Main CLI
######################################################################



# === Configuration Section ===
NUM_USERS = 20
MIN_POSTS = 2
MAX_POSTS = 5
MIN_FRIENDS = 3
MAX_FRIENDS = 10
WITH_PREFERENCES = True
MATCH_DISTANCE_MIN = 5
MATCH_DISTANCE_MAX = 1000
AGE_MIN_BOUND = 18
AGE_MAX_BOUND = 100
USERNAME_PATTERN = "user{index}"
DEFAULT_PIC = "data:image/jpeg;base64,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"
START_DATE = "2025-04-20"
END_DATE = datetime.now().strftime("%Y-%m-%d")
SEED = 1337
OUTPUT_PATH = "dummy_data.sql"
CAPTIONS_CSV = "all_captions_combined.csv"

PHOTO_FILES = [
    "csv/bar_urls.csv",
    "csv/coding_urls.csv",
    "csv/dance_class_urls.csv",
    "csv/dinner_urls.csv",
    "csv/hiking_urls.csv",
    "csv/movies_urls.csv",
    "csv/painting_urls.csv",
    "csv/pottery_class_urls.csv",
    "csv/swimming_urls.csv"
]

def main2():
    random.seed(SEED)
    faker = Faker()
    faker.seed_instance(SEED)

    # === Build data ===
    users = build_users(NUM_USERS, USERNAME_PATTERN, faker)

    combined_photos_df = merge_photo_csvs(PHOTO_FILES, "csv/combined_photos.csv")
    photo_dict = dataframe_to_photo_dict(combined_photos_df)
    caption_dict = load_caption_dict(CAPTIONS_CSV)

    posts, photos = build_posts(
        users,
        caption_dict,
        photo_dict,
        MIN_POSTS,
        MAX_POSTS,
        datetime.fromisoformat(START_DATE),
        datetime.fromisoformat(END_DATE),
    )

    friendships = build_friendships(users, MIN_FRIENDS, MAX_FRIENDS)

    profile_pics = read_image_urls_from_csv("photos/cat/image_urls.csv")
    profiles = build_profiles(
        users,
        DEFAULT_PIC,
        faker,
        WITH_PREFERENCES,
        (MATCH_DISTANCE_MIN, MATCH_DISTANCE_MAX),
        (AGE_MIN_BOUND, AGE_MAX_BOUND),
        profile_pics
    )

    interests = build_interests()
    user_interests = build_user_interests(users, interests, n=8)

    # === Build SQL output ===
    sql_parts = [
        "-- === USERS ===",
        sql_insert("users", users),
        "-- === PROFILES ===",
        sql_insert("profiles", profiles),
        "-- === USER_INTERESTS ===",
        sql_insert("user_interests", user_interests),
        "-- === PHOTOS ===",
        sql_insert("photos", photos),
        "-- === POSTS ===",
        sql_insert("posts", posts),
        "-- === FRIENDS ===",
    ]
    friend_rows = [{"user_id": a, "friend_id": b} for a, b in friendships]
    sql_parts.append(sql_insert("friends", friend_rows))

    matches = build_matches(users, min_matches=1, max_matches=3, start=datetime.fromisoformat(START_DATE), end=datetime.fromisoformat(END_DATE))

    sql_parts += [
        "-- === MATCHES ===",
        sql_insert("matches", matches),
        "-- === RESET ID SEQUENCES ===",
        "SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));"
    ]

    header = textwrap.dedent(
        f"""-- ------------------------------------------------------------
        -- Dummy data generated on {datetime.now().isoformat(timespec='seconds')}
        -- Seed: {SEED}
        -- ------------------------------------------------------------\n\n"""
    )

    Path(OUTPUT_PATH).write_text(header + "\n".join(sql_parts), encoding="utf-8")
    print(f"[+] Wrote {OUTPUT_PATH} with dummy data.")


if __name__ == "__main__":
    main2()

# old main function for reference
'''
def main():
    parser = argparse.ArgumentParser(description="Generate dummy SQL for the social‑matching app, including profiles with optional preferences.")
    # Core sizes
    parser.add_argument("--num-users", type=int, default=50)
    parser.add_argument("--min-posts", type=int, default=2)
    parser.add_argument("--max-posts", type=int, default=5)
    parser.add_argument("--min-friends", type=int, default=3)
    parser.add_argument("--max-friends", type=int, default=10)

    # Profiles / prefs
    parser.add_argument("--with-preferences", dest="prefs", action="store_true", help="Include preference fields in profiles (default)")
    parser.add_argument("--no-preferences", dest="prefs", action="store_false", help="Skip preference generation")
    parser.set_defaults(prefs=True)
    parser.add_argument("--match-distance-min", type=int, default=5)
    parser.add_argument("--match-distance-max", type=int, default=1000)
    parser.add_argument("--age-min-bound", type=int, default=18)
    parser.add_argument("--age-max-bound", type=int, default=100)

    # Misc styling
    parser.add_argument("--username-pattern", default="user{index}")
    parser.add_argument("--default-pic", default=DEFAULT_PROFILE_PIC, help="Default profile picture URL")
    parser.add_argument("--start-date", default="2023-01-01", help="Earliest post date (YYYY-MM-DD)")
    parser.add_argument("--end-date", default=datetime.now().strftime("%Y-%m-%d"), help="Latest post date (YYYY-MM-DD)")
    parser.add_argument("--seed", type=int, default=SEED)
    parser.add_argument("--out", default="dummy_data.sql", help="Output SQL file path")

    args = parser.parse_args()

    random.seed(args.seed)
    faker = Faker() if Faker else None
    if faker:
        faker.seed_instance(args.seed)

    users = build_users(args.num_users, args.username_pattern, faker)

    photo_files = [
        "photos/bar_urls.csv",
        "photos/coding_urls.csv",
        "photos/dance_class_urls.csv",
        "photos/dinner_urls.csv",
        "photos/hiking_urls.csv",
        "photos/movies_urls.csv",
        "photos/painting_urls.csv",
        "photos/pottery_urls.csv",
        "photos/swimming_urls.csv"
    ]
    combined_photos_df = merge_photo_csvs(photo_files, "photos/combined_photos.csv")
    photo_dict = dataframe_to_photo_dict(combined_photos_df)

    caption_dict = load_caption_dict("all_captions_combined.csv")
    est_posts = args.num_users * args.max_posts

    posts, photos = build_posts(
        users,
        caption_dict,
        photo_dict,
        args.min_posts,
        args.max_posts,
        datetime.fromisoformat(args.start_date),
        datetime.fromisoformat(args.end_date),
    )

    friendships = build_friendships(users, args.min_friends, args.max_friends)

    profile_pics = read_image_urls_from_csv("photos/cat/image_urls.csv")
    profiles = build_profiles(
        users,
        DEFAULT_PROFILE_PIC,
        faker,
        args.prefs,
        (args.match_distance_min, args.match_distance_max),
        (args.age_min_bound, args.age_max_bound),
        profile_pics
    )

    # Stitch all SQL together
    sql_parts = [
        "-- === USERS ===",
        sql_insert("users", users),
        "-- === PROFILES ===",
        sql_insert("profiles", profiles),
        "-- === PHOTOS ===",
        sql_insert("photos", photos),
        "-- === POSTS ===",
        sql_insert("posts", posts),
        "-- === FRIENDS ===",
    ]
    friend_rows = [{"user_id": a, "friend_id": b} for a, b in friendships]
    sql_parts.append(sql_insert("friends", friend_rows))

    header = textwrap.dedent(
        f"""-- ------------------------------------------------------------
        -- Dummy data generated on {datetime.now().isoformat(timespec='seconds')}
        -- Seed: {args.seed}
        -- ------------------------------------------------------------\n\n"""
    )

    Path(args.out).write_text(header + "\n".join(sql_parts), encoding="utf-8")
    print(f"[+] Wrote {args.out} with dummy data.")
'''