-- User Profiles
profiles (
  id,
  user_id,
  username,
  avatar_url,
  created_at
)

-- User's Game Library
user_games (
  id,
  user_id,
  game_id,  -- IGDB game ID
  purchased_at,
  price
)

-- Shopping Cart
cart_items (
  id,
  user_id,
  game_id,  -- IGDB game ID
  added_at
)
