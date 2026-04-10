"""
run_pipeline.py
---------------
Social Media Recommendation Pipeline for Luna's Project / Lighthouse Sanctuary.

What it does:
  1. Loads social_media_posts.csv (historical seed data)
  2. Loads post_results_log.json (real-world post outcomes logged after publishing)
  3. Merges real results into the training data — real data outweighs seed data
  4. Recomputes aggregations and retrains the Gradient Boosting model
  5. Outputs recommendations.json with two strategies: maximize donations, maximize viewership

How the feedback loop works:
  - When Lighthouse posts and gets results, log them via log_post_result()
  - Each time run_pipeline() is called, real results are folded in with higher weight
  - Over time, recommendations shift to reflect what's actually working for Lighthouse
  - state.json tracks every run so you can see how recommendations change over time

To log a real post result, call:
  python run_pipeline.py --log
  (follows prompts) OR call log_post_result() directly from code.
"""

import pandas as pd
import numpy as np
import warnings
import os
import json
import argparse
from datetime import datetime

warnings.filterwarnings('ignore')

from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import cross_val_score, train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_absolute_error, r2_score

# ── Paths ──────────────────────────────────────────────────────────────────────
SCRIPT_DIR       = os.path.dirname(os.path.abspath(__file__))
DATA_PATH        = os.path.join(SCRIPT_DIR, '..', '..', 'Backend', 'Data', 'SeedData', 'social_media_posts.csv')
RESULTS_LOG      = os.path.join(SCRIPT_DIR, 'post_results_log.json')
STATE_FILE       = os.path.join(SCRIPT_DIR, 'state.json')
RECOMMENDATIONS  = os.path.join(SCRIPT_DIR, 'recommendations.json')
LAST_POST_FILE   = os.path.join(SCRIPT_DIR, 'last_post.json')

# Real results are given this multiplier in training so they outweigh seed data
REAL_DATA_WEIGHT = 5


# ── Feedback Log Helpers ───────────────────────────────────────────────────────

def load_results_log():
    """Load post_results_log.json. Returns empty list if file doesn't exist."""
    if not os.path.exists(RESULTS_LOG):
        return []
    try:
        with open(RESULTS_LOG, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return []


def log_post_result(entry: dict):
    """
    Append a real post result to post_results_log.json.

    Required fields in entry:
      platform, post_type, day_of_week, post_hour (int),
      content_topic, sentiment_tone, media_type,
      has_call_to_action (bool), is_boosted (bool),
      features_resident_story (bool), num_hashtags (int),
      caption_length (int), boost_budget_php (float),
      actual_donation_value_php (float),  ← real donations received
      actual_engagement_rate (float),     ← real engagement rate
      notes (str, optional)
    """
    log = load_results_log()
    entry['logged_at'] = datetime.now().isoformat(timespec='seconds')
    entry['source'] = 'real'
    log.append(entry)
    with open(RESULTS_LOG, 'w', encoding='utf-8') as f:
        json.dump(log, f, indent=2)
    print(f"[pipeline] Logged real result for {entry.get('platform')} "
          f"{entry.get('post_type')} post on {entry.get('day_of_week')}")
    return entry


def load_state():
    if not os.path.exists(STATE_FILE):
        return {'runs': []}
    with open(STATE_FILE, 'r') as f:
        return json.load(f)


def save_state(state):
    with open(STATE_FILE, 'w') as f:
        json.dump(state, f, indent=2)


# ── Data Loading & Merging ─────────────────────────────────────────────────────

def load_and_merge_data():
    """
    Load seed data + real results log. Merge them, giving real results
    REAL_DATA_WEIGHT copies in training so they influence the model more.
    Returns a single DataFrame ready for analysis.
    """
    # Load seed data
    df = pd.read_csv(DATA_PATH)
    df['source'] = 'seed'
    df['weight'] = 1

    # Rename seed columns to match real result schema
    df = df.rename(columns={
        'estimated_donation_value_php': 'actual_donation_value_php',
        'engagement_rate': 'actual_engagement_rate',
    })

    # Load real results
    real_entries = load_results_log()
    real_count = len(real_entries)

    if real_entries:
        real_df = pd.DataFrame(real_entries)
        real_df['source'] = 'real'
        real_df['weight'] = REAL_DATA_WEIGHT

        # Align columns
        for col in df.columns:
            if col not in real_df.columns:
                real_df[col] = np.nan

        # Stack — duplicate real rows by weight so model trains on them more
        real_repeated = pd.concat([real_df] * REAL_DATA_WEIGHT, ignore_index=True)
        df = pd.concat([df, real_repeated], ignore_index=True)
        print(f"[pipeline] Merged {real_count} real post results "
              f"(weighted {REAL_DATA_WEIGHT}x) into {len(df)} training rows total")
    else:
        print(f"[pipeline] No real results yet — running on seed data only ({len(df)} rows)")
        print(f"[pipeline] Log real post results to post_results_log.json to improve recommendations")

    # Clean types
    df['actual_donation_value_php'] = pd.to_numeric(df['actual_donation_value_php'], errors='coerce')
    df['actual_engagement_rate']    = pd.to_numeric(df['actual_engagement_rate'], errors='coerce')
    df['follower_count_at_post']    = pd.to_numeric(df['follower_count_at_post'], errors='coerce')
    df['boost_budget_php']          = pd.to_numeric(df['boost_budget_php'], errors='coerce').fillna(0)
    df['is_boosted']                = df['is_boosted'].astype(str).str.lower().map(
                                        {'true': True, 'false': False, '1': True, '0': False}).fillna(False)
    df['has_call_to_action']        = df['has_call_to_action'].astype(str).str.lower().map(
                                        {'true': True, 'false': False}).fillna(False)
    df['features_resident_story']   = df['features_resident_story'].astype(str).str.lower().map(
                                        {'true': True, 'false': False}).fillna(False)
    df['created_at']                = pd.to_datetime(df['created_at'], errors='coerce')

    return df, real_count


# ── Aggregations ───────────────────────────────────────────────────────────────

def compute_stats(df):
    platform_stats = df.groupby('platform').agg(
        avg_donation=('actual_donation_value_php', 'mean'),
        avg_engagement=('actual_engagement_rate', 'mean'),
        post_count=('platform', 'count')
    ).round(2)

    type_stats = df.groupby('post_type').agg(
        avg_donation=('actual_donation_value_php', 'mean'),
        avg_engagement=('actual_engagement_rate', 'mean')
    ).round(2)

    day_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    day_stats = df.groupby('day_of_week').agg(
        avg_donation=('actual_donation_value_php', 'mean'),
        avg_engagement=('actual_engagement_rate', 'mean')
    ).reindex(day_order).round(2)

    hour_stats = df.groupby('post_hour').agg(
        avg_donation=('actual_donation_value_php', 'mean'),
        avg_engagement=('actual_engagement_rate', 'mean')
    ).round(2)

    topic_stats = df.groupby('content_topic').agg(
        avg_donation=('actual_donation_value_php', 'mean'),
        avg_engagement=('actual_engagement_rate', 'mean')
    ).round(2)

    tone_stats = df.groupby('sentiment_tone').agg(
        avg_donation=('actual_donation_value_php', 'mean'),
        avg_engagement=('actual_engagement_rate', 'mean')
    ).round(2)

    df['week'] = df['created_at'].dt.to_period('W')
    weekly_freq = df.groupby(['platform', 'week']).size().reset_index(name='posts_per_week')
    freq_stats = weekly_freq.groupby('platform')['posts_per_week'].mean().round(2).rename('avg_posts_per_week').to_frame()

    pivot_donation = df.pivot_table(
        values='actual_donation_value_php', index='platform', columns='post_hour', aggfunc='mean'
    )
    platform_best_hours = {}
    for p in pivot_donation.index:
        best_h = pivot_donation.loc[p].idxmax()
        if not pd.isna(pivot_donation.loc[p, best_h]):
            platform_best_hours[p] = int(best_h)

    return platform_stats, type_stats, day_stats, hour_stats, topic_stats, tone_stats, freq_stats, platform_best_hours


# ── ML Model ───────────────────────────────────────────────────────────────────

def train_model(df):
    feature_cols = [
        'platform', 'post_type', 'day_of_week', 'post_hour',
        'content_topic', 'sentiment_tone', 'media_type',
        'has_call_to_action', 'is_boosted', 'features_resident_story',
        'num_hashtags', 'caption_length', 'boost_budget_php'
    ]

    model_df = df[feature_cols + ['actual_donation_value_php']].dropna().copy()

    cat_cols = ['platform', 'post_type', 'day_of_week', 'content_topic', 'sentiment_tone', 'media_type']
    encoders = {}
    for col in cat_cols:
        le = LabelEncoder()
        model_df[col] = le.fit_transform(model_df[col].astype(str))
        encoders[col] = le

    for col in ['has_call_to_action', 'is_boosted', 'features_resident_story']:
        model_df[col] = model_df[col].astype(int)

    X = model_df[feature_cols]
    y = model_df['actual_donation_value_php']

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    gb = GradientBoostingRegressor(n_estimators=200, max_depth=4, learning_rate=0.05, random_state=42)
    gb.fit(X_train, y_train)

    y_pred  = gb.predict(X_test)
    mae     = mean_absolute_error(y_test, y_pred)
    r2      = r2_score(y_test, y_pred)
    cv_r2   = cross_val_score(gb, X, y, cv=5, scoring='r2').mean()

    importances = pd.Series(gb.feature_importances_, index=feature_cols).sort_values(ascending=False)

    return gb, encoders, feature_cols, mae, r2, cv_r2, importances, len(X_train)


# ── Recommendation Builder ─────────────────────────────────────────────────────

def get_top_n(series, n=3):
    return series.nlargest(n).index.tolist()


def build_rec_card(df, platform_stats, type_stats, day_stats, hour_stats,
                   topic_stats, tone_stats, freq_stats, platform_best_hours,
                   mae, r2, cv_r2, training_samples, real_count):

    top_donation_platform   = platform_stats['avg_donation'].idxmax()
    top_engagement_platform = platform_stats['avg_engagement'].idxmax()

    boost_lift = round(
        ((df[df['is_boosted'] == True]['actual_donation_value_php'].mean() -
          df[df['is_boosted'] == False]['actual_donation_value_php'].mean()) /
         df[df['is_boosted'] == False]['actual_donation_value_php'].mean()) * 100, 1
    )

    return {
        'generated_at': datetime.now().isoformat(timespec='seconds'),
        'real_results_logged': real_count,
        'data_note': (
            f'Based on {real_count} real post results + seed data.'
            if real_count > 0
            else 'Based on seed data only. Log real post results to improve accuracy.'
        ),
        'money_strategy': {
            'label': 'Maximize Donations',
            'primary_platform': top_donation_platform,
            'also_strong_on': get_top_n(platform_stats['avg_donation'])[1:],
            'post_type': type_stats['avg_donation'].idxmax(),
            'also_effective_types': get_top_n(type_stats['avg_donation'])[1:],
            'best_day': day_stats['avg_donation'].idxmax(),
            'best_time': f"{int(hour_stats['avg_donation'].idxmax()):02d}:00",
            'best_time_per_platform': {p: f'{h:02d}:00' for p, h in platform_best_hours.items()},
            'content_topic': topic_stats['avg_donation'].idxmax(),
            'top_topics': get_top_n(topic_stats['avg_donation']),
            'tone': tone_stats['avg_donation'].idxmax(),
            'checklist': {
                'feature_resident_story': True,
                'include_call_to_action': True,
                'boost_the_post': True,
            },
            'boost_lift_pct': boost_lift,
            'recommended_frequency': f"1 dedicated fundraising post per week on {top_donation_platform}",
        },
        'viewership_strategy': {
            'label': 'Grow Viewership & Followers',
            'primary_platform': top_engagement_platform,
            'also_strong_on': get_top_n(platform_stats['avg_engagement'])[1:],
            'post_type': type_stats['avg_engagement'].idxmax(),
            'best_day': day_stats['avg_engagement'].idxmax(),
            'best_time': f"{int(hour_stats['avg_engagement'].idxmax()):02d}:00",
            'content_topic': topic_stats['avg_engagement'].idxmax(),
            'top_topics': get_top_n(topic_stats['avg_engagement']),
            'tone': tone_stats['avg_engagement'].idxmax(),
            'recommended_frequency': f"1 post per week on {top_engagement_platform}, consistent schedule",
        },
        'combined_weekly_plan': {
            'description': '2 posts per week — one to convert, one to grow',
            f"{day_stats['avg_donation'].idxmax()}_money_post": {
                'platform': top_donation_platform,
                'goal': 'Donations',
                'post_type': type_stats['avg_donation'].idxmax(),
                'time': f"{int(hour_stats['avg_donation'].idxmax()):02d}:00",
                'tone': tone_stats['avg_donation'].idxmax(),
                'must_include': 'Resident story + donate CTA + boost',
            },
            f"{day_stats['avg_engagement'].idxmax()}_viewership_post": {
                'platform': top_engagement_platform,
                'goal': 'Viewership',
                'post_type': type_stats['avg_engagement'].idxmax(),
                'time': f"{int(hour_stats['avg_engagement'].idxmax()):02d}:00",
                'tone': tone_stats['avg_engagement'].idxmax(),
                'must_include': 'Resident story + hashtags + Reel if possible',
            },
        },
        'model_performance': {
            'algorithm': 'GradientBoostingRegressor',
            'test_mae_php': round(mae),
            'test_r2': round(r2, 3),
            'cv_r2_5fold': round(cv_r2, 3),
            'training_samples': training_samples,
            'note': (
                'Model accuracy improves as more real results are logged.'
                if real_count < 20
                else f'Model trained on {real_count} real results — predictions becoming reliable.'
            ),
        },
    }


# ── Interactive Logger ─────────────────────────────────────────────────────────

def interactive_log():
    """Prompt the user to log a real post result from the command line."""
    print('\n=== Log a Real Post Result ===')
    print('Enter the details of a post you published and its actual results.\n')

    platforms  = ['Facebook', 'Instagram', 'Twitter', 'WhatsApp', 'TikTok', 'LinkedIn', 'YouTube']
    post_types = ['ImpactStory', 'FundraisingAppeal', 'Campaign', 'EducationalContent', 'ThankYou', 'EventPromotion']
    topics     = ['Health', 'SafehouseLife', 'Reintegration', 'DonorImpact', 'CampaignLaunch', 'AwarenessRaising', 'Education', 'Gratitude', 'EventRecap']
    tones      = ['Urgent', 'Emotional', 'Hopeful', 'Celebratory', 'Grateful', 'Informative']
    days       = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    media      = ['Photo', 'Video', 'Reel', 'Carousel', 'Text']

    def pick(label, options):
        for i, o in enumerate(options, 1):
            print(f'  {i}. {o}')
        while True:
            try:
                v = int(input(f'{label} (1-{len(options)}): '))
                if 1 <= v <= len(options):
                    return options[v - 1]
            except ValueError:
                pass
            print('  Invalid — try again.')

    def ask_float(label):
        while True:
            try:
                return float(input(f'{label}: '))
            except ValueError:
                print('  Enter a number.')

    def ask_bool(label):
        v = input(f'{label} (y/n): ').strip().lower()
        return v == 'y'

    platform              = pick('Platform', platforms)
    post_type             = pick('Post type', post_types)
    day_of_week           = pick('Day posted', days)
    post_hour             = int(ask_float('Hour posted (0-23)'))
    content_topic         = pick('Content topic', topics)
    sentiment_tone        = pick('Tone', tones)
    media_type            = pick('Media type', media)
    has_cta               = ask_bool('Had a call to action?')
    is_boosted            = ask_bool('Was it boosted/paid?')
    boost_budget          = ask_float('Boost budget in PHP (0 if not boosted)') if is_boosted else 0.0
    features_story        = ask_bool('Featured a resident story?')
    num_hashtags          = int(ask_float('Number of hashtags'))
    caption_length        = int(ask_float('Caption length (characters)'))
    actual_donation       = ask_float('Actual donations received (PHP) — 0 if unknown')
    actual_engagement     = ask_float('Actual engagement rate (e.g. 0.045 for 4.5%) — 0 if unknown')
    notes                 = input('Notes (optional): ').strip()

    entry = {
        'platform':                  platform,
        'post_type':                 post_type,
        'day_of_week':               day_of_week,
        'post_hour':                 post_hour,
        'content_topic':             content_topic,
        'sentiment_tone':            sentiment_tone,
        'media_type':                media_type,
        'has_call_to_action':        has_cta,
        'is_boosted':                is_boosted,
        'boost_budget_php':          boost_budget,
        'features_resident_story':   features_story,
        'num_hashtags':              num_hashtags,
        'caption_length':            caption_length,
        'actual_donation_value_php': actual_donation,
        'actual_engagement_rate':    actual_engagement,
        'notes':                     notes,
    }

    log_post_result(entry)
    print('\nResult logged. Re-run without --log to update recommendations.')


# ── Main ───────────────────────────────────────────────────────────────────────

def run_pipeline():
    print(f'[pipeline] Starting — {datetime.now().isoformat(timespec="seconds")}')

    df, real_count = load_and_merge_data()

    platform_stats, type_stats, day_stats, hour_stats, \
        topic_stats, tone_stats, freq_stats, platform_best_hours = compute_stats(df)

    gb, encoders, feature_cols, mae, r2, cv_r2, importances, n_train = train_model(df)

    rec_card = build_rec_card(
        df, platform_stats, type_stats, day_stats, hour_stats,
        topic_stats, tone_stats, freq_stats, platform_best_hours,
        mae, r2, cv_r2, n_train, real_count
    )

    with open(RECOMMENDATIONS, 'w') as f:
        json.dump(rec_card, f, indent=2)

    # Save run to state
    state = load_state()
    state.setdefault('runs', []).append({
        'timestamp':       rec_card['generated_at'],
        'real_results':    real_count,
        'top_money_platform':     rec_card['money_strategy']['primary_platform'],
        'top_viewership_platform': rec_card['viewership_strategy']['primary_platform'],
        'model_r2':        round(r2, 3),
        'model_mae_php':   round(mae),
    })
    state['last_run'] = rec_card['generated_at']
    save_state(state)

    print(f'\n[pipeline] Done — {real_count} real results in log')
    print(f'[pipeline] Money strategy      : {rec_card["money_strategy"]["primary_platform"]} | {rec_card["money_strategy"]["post_type"]} | {rec_card["money_strategy"]["best_day"]} {rec_card["money_strategy"]["best_time"]}')
    print(f'[pipeline] Viewership strategy : {rec_card["viewership_strategy"]["primary_platform"]} | {rec_card["viewership_strategy"]["post_type"]} | {rec_card["viewership_strategy"]["best_day"]} {rec_card["viewership_strategy"]["best_time"]}')
    print(f'\nTop features driving donation value:')
    print(importances.head(5).to_string())
    print(f'\nSaved to {RECOMMENDATIONS}')

    return rec_card


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Social Media Recommender Pipeline')
    parser.add_argument('--log', action='store_true', help='Log a real post result before running')
    args = parser.parse_args()

    if args.log:
        interactive_log()

    run_pipeline()
