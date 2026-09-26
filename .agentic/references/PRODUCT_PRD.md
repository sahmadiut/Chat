# Complete Product & Technical Plan
## Anonymous Messaging & Anonymous Chat Telegram Bot

**Document Type:** Product Requirements Document (PRD) + Technical Specification  
**Platform:** Telegram Bot  
**User Interface:** Telegram messages, Reply Keyboards, Inline Keyboards, media messages and standard bot commands  
**Web Interface:** None  
**Admin Interface:** Telegram Bot only  
**Primary Systems:** Anonymous Inbox, Anonymous Matchmaking Chat, Profiles, Coins, Referrals, Moderation, Administration and Data Archive

---

# 1. Product Vision

The project is a Telegram bot that combines two separate anonymous communication systems:

1. **Personal Anonymous Messaging**
2. **Anonymous Matchmaking Chat**

Every user can receive a unique personal anonymous link.

Anyone who opens that link can send an anonymous message to the owner without seeing the owner's matchmaking profile or Telegram identity.

Separately, registered users can create a custom chat profile and use a matchmaking system to find:

- Female users
- Male users
- Random users

Once two people are matched, they communicate through the bot.

Their real Telegram identities are not exposed to each other.

The service internally stores user identities, chat sessions, messages, anonymous inbox messages, profile information, moderation records and other necessary system data.

Authorized administrators can access these internal records.

The entire product operates through Telegram.

There is no user-facing website, Mini App or web dashboard.

---

# 2. Core Privacy Model

The platform must distinguish between:

### Anonymous to Other Users

Users do not automatically see another person's:

- Telegram ID
- Telegram username
- Telegram first name
- Telegram last name
- Telegram account profile
- Internal user ID
- Exact location
- Administrative data

### Identified Internally

The backend internally knows which registered Telegram user performed an action whenever Telegram provides that identity to the bot.

This allows moderation, abuse investigation, blocking, reports and administrative oversight.

### Administrator Access

The Main Administrator can access both:

**Telegram/Internal Identity**

and:

**Custom Chat Identity**

This is an essential architecture rule.

---

# 3. Important Privacy Disclosure

The word "anonymous" means:

> Anonymous to other users.

It must not be described as:

> Completely anonymous from the service.

During onboarding, users should be informed that conversations and activity may be retained by the service for moderation, security, administration and other disclosed purposes.

Likewise:

**Secure Chat** must not be described as end-to-end encrypted.

**Delete from Telegram** must not imply that the administrative database copy is also destroyed.

---

# 4. Main Product Modules

The project consists of the following major modules:

1. User Registration
2. Telegram Identity Management
3. Custom Chat Profiles
4. Anonymous Personal Links
5. Anonymous Inbox
6. Anonymous Replies
7. Matchmaking
8. Live Anonymous Chat
9. Chat Sessions
10. Message Deletion
11. Secure / Protected Chat
12. User Location
13. Bot Last Activity
14. Coins
15. Rewards
16. Referrals
17. Blocking
18. Reporting
19. Moderation
20. Main Admin Panel
21. Secondary Admin Roles
22. User/Chat Export
23. Statistics
24. Broadcasts
25. Audit Logs
26. System Configuration
27. Anti-Spam and Anti-Abuse

---

# 5. User Roles

## 5.1 Normal User

Can:

- Receive anonymous messages
- Send anonymous messages
- Reply anonymously
- Create/edit a chat profile
- Search for users
- Enter anonymous chat
- Enable Protected Chat
- Delete individual chat messages
- Delete a specific chat session
- End chats
- Block users
- Report users
- Earn and spend coins
- Invite friends
- Configure privacy settings

---

## 5.2 Main Administrator

Has full authorized administrative access.

Can access:

- Telegram identity
- Custom user profile
- Current and historical profile information
- User location if voluntarily shared
- Last bot activity
- Anonymous messages sent
- Anonymous messages received
- Anonymous reply threads
- Matchmaking history
- Every chat session
- Chat messages
- Telegram deletion status
- Protected Chat status
- Reports
- Blocks
- Coin history
- Referrals
- Admin notes
- Moderation history
- User exports
- Chat exports
- Statistics
- System settings

All sensitive administrative actions should be audited.

---

## 5.3 Moderator / Secondary Administrator

Optional.

Permissions should be granular.

For example, a moderator may be allowed to:

- Search users
- Review reports
- View reported conversations
- Warn users
- Temporarily restrict users

while being unable to:

- View exact locations
- Export all user data
- Modify administrators
- Change system configuration
- Access full audit logs

---

# 6. Main User Menu

Recommended persistent Reply Keyboard:

**Row 1**

`💌 Anonymous Messages`

`💬 Anonymous Chat`

**Row 2**

`👤 My Profile`

`🪙 Coins`

**Row 3**

`🔗 My Anonymous Link`

`👥 Invite Friends`

**Row 4**

`⚙️ Settings`

`❓ Help`

The wording must be configurable and localization-ready.

---

# 7. Registration

When a user starts the bot normally:

`/start`

the backend creates an internal account.

Store:

- Internal user ID
- Telegram user ID
- Telegram username
- Telegram first name
- Telegram last name
- Telegram language code
- Telegram Premium flag where available
- Registration timestamp
- Last activity
- Registration source
- Referral source
- Anonymous-link source if applicable
- Account status
- Terms acceptance

The Bot API User object exposes fields such as user ID, first/last name, username and language code, but not a normal Bot API `last_seen` timestamp. Therefore this project should calculate its own last activity from interactions with the bot.

---

# 8. Terms and Privacy Acceptance

Before using the full service, users should accept:

- Terms of Service
- Privacy Notice
- Community Rules

Store:

`terms_version`

`privacy_version`

`terms_accepted_at`

`privacy_accepted_at`

Suggested disclosure:

> Your identity is hidden from other users. Messages and activity may be retained by the service for moderation, security and administrative purposes.

---

# 9. Telegram Identity

Every registered account has an **Internal Telegram Profile**.

Example:

`Internal User ID: 48192`

`Telegram ID: 123456789`

`Username: @username`

`First Name: John`

`Last Name: Smith`

This is never automatically shown to anonymous users.

---

# 10. Telegram Identity History

Whenever a user interacts with the bot, the system should compare their currently provided Telegram identity information with the stored snapshot.

If something changes, such as:

- Username
- First name
- Last name

the system can maintain an identity history.

Table:

`user_identity_history`

Example:

`@alex2025`

changed to:

`@alex2026`

Authorized administrators can see the historical values.

---

# 11. Telegram Profile Photos

The backend can optionally maintain references to Telegram profile pictures visible to the bot.

Telegram's Bot API provides `getUserProfilePhotos` for retrieving a user's profile pictures.

This is separate from the user's custom anonymous-chat photo.

Therefore an admin may have:

**Telegram Account Photo**

and:

**Anonymous Chat Profile Photo**

shown separately.

---

# 12. Custom Chat Profile

Users create a separate profile specifically for matchmaking.

Recommended fields:

- Display name
- Gender
- Age
- City
- Bio
- Profile photo
- Location
- Interests
- Chat intent
- Profile completion percentage
- Last profile update

Telegram identity and custom profile identity must never be merged into a single object.

---

# 13. Three Profile Views

Every profile has three presentation modes.

## 13.1 Owner View

Shown to the profile owner.

Example:

> 👤 My Profile
>
> Name: Alex
> Age: 24
> Gender: Male
> City: Berlin
> Bio: Music, movies and travel.
>
> Completion: 85%

Buttons:

`✏️ Name`

`🎂 Age`

`⚧ Gender`

`🏙 City`

`📝 Bio`

`📷 Photo`

`📍 Location`

`🎯 Interests`

`👁 Preview`

---

# 14. Public Matchmaking Profile View

This is what another user sees.

Example:

> 👤 Alex, 24
>
> 📍 Berlin
>
> 🎯 Music • Travel • Movies
>
> 📝 Looking for interesting conversations.

It may include:

- Custom display name
- Custom profile photo
- Age
- Gender
- City
- Bio
- Interests
- Approximate bot activity

It must not include:

- Telegram username
- Telegram user ID
- Telegram real name
- Internal ID
- Exact GPS coordinates

---

# 15. Administrator Profile View

Administrator sees two clearly separated sections.

### Telegram Identity

- Internal ID
- Telegram ID
- Username
- First name
- Last name
- Telegram profile photo
- Registration date
- Last bot activity

### User-Created Profile

- Display name
- Gender
- Age
- City
- Custom photo
- Bio
- Interests
- Location information
- Profile history

This prevents confusion between the user's real Telegram profile and their anonymous identity.

---

# 16. Anonymous Personal Link

Every user receives a unique anonymous link.

Telegram supports private-bot deep links using a `start` parameter, for example `https://t.me/bot_username?start=value`. Telegram currently allows start parameters up to 64 characters using the documented character set.

Example conceptually:

`https://t.me/MyBot?start=a_K8z91LmP`

The token must be random and must not directly reveal:

- Telegram ID
- Internal database ID

---

# 17. Anonymous Link Database

Table:

`anonymous_links`

Recommended fields:

`id`

`owner_user_id`

`token`

`status`

`created_at`

`revoked_at`

`total_opens`

`total_messages`

Users may eventually support multiple links.

Example:

- Main link
- Instagram link
- Telegram channel link
- Campaign link

---

# 18. Anonymous Link Mode

When somebody opens User A's anonymous link, they enter:

`ANONYMOUS_LINK_COMPOSE_MODE`

The system must NOT display User A's matchmaking profile.

This is a strict product requirement.

No:

- Display name
- Photo
- Age
- Gender
- City
- Bio
- Interests

should automatically appear.

Anonymous Link Mode and Matchmaking Profile Mode are independent.

---

# 19. Anonymous Message Flow

Example:

1. User A obtains their link.
2. User A shares it.
3. User B opens it.
4. Telegram opens the bot using the link token.
5. Backend resolves the token to User A.
6. Bot asks User B to write a message.
7. User B sends content.
8. Backend stores sender identity internally.
9. User A receives an anonymous message.
10. User A does not see User B's Telegram identity.

---

# 20. Anonymous Message Types

Configurable supported content:

- Text
- Photo
- Voice
- Video
- Video note
- Audio
- Sticker
- GIF/animation
- Document

Contacts and precise locations should preferably be disabled in anonymous communication by default because they can accidentally expose identity.

---

# 21. Anonymous Message Data

Recommended fields:

`id`

`anonymous_link_id`

`sender_user_id`

`recipient_user_id`

`message_type`

`text`

`caption`

`telegram_file_id`

`telegram_file_unique_id`

`sender_source_message_id`

`recipient_delivery_message_id`

`created_at`

`read_at`

`reply_status`

`report_status`

`hidden_by_recipient_at`

---

# 22. Anonymous Inbox

Button:

`💌 Anonymous Messages`

Example:

> 💌 Anonymous Inbox
>
> Unread: 8
> Total: 94

Buttons:

`📩 Unread`

`📚 All`

`↩️ Replied`

`🚫 Blocked`

`⬅️ Back`

Use pagination.

---

# 23. Receiving an Anonymous Message

Example:

> 💌 New Anonymous Message
>
> "Your profile is interesting."

Inline buttons:

`↩️ Reply`

`🗑 Delete`

`🚫 Block Sender`

`⚠️ Report`

The sender's identity remains hidden.

---

# 24. Anonymous Replies

Selecting:

`↩️ Reply`

puts the recipient into:

`ANONYMOUS_REPLY_MODE`

The reply is sent anonymously to the original sender.

The backend creates an anonymous thread.

Table:

`anonymous_threads`

This allows:

- Original anonymous message
- Recipient reply
- Sender reply again
- Continued anonymous conversation

without creating a matchmaking profile connection.

---

# 25. Anonymous Inbox Deletion

Deletion from the Anonymous Inbox is separate from Live Chat deletion.

If the user deletes an anonymous inbox message:

- Remove/delete the visible Telegram delivery where technically possible
- Hide it from the user's inbox
- Keep the backend archive
- Preserve sender/recipient identity internally
- Record the deletion action

This does not automatically delete every Telegram message the anonymous sender may have sent to the bot.

---

# 26. Anonymous Sender Blocking

The recipient can select:

`🚫 Block Sender`

The recipient does not learn who the sender is.

Internally store:

`blocker_user_id`

`blocked_user_id`

`source = ANONYMOUS_INBOX`

Future anonymous messages from this sender to the same recipient should be prevented.

---

# 27. Anonymous Chat Main Menu

Button:

`💬 Anonymous Chat`

Example:

> 💬 Find Someone
>
> Who would you like to chat with?

Buttons:

`👩 Find a Girl`

`👨 Find a Boy`

`🎲 Random`

`⚙️ Match Settings`

`⬅️ Back`

---

# 28. Matchmaking Eligibility

Before entering matchmaking, check:

- Account active
- Not banned
- Matchmaking enabled
- Required profile information complete
- No active chat
- Not already queued
- Coin balance if selected mode requires coins
- Age eligibility
- Rate-limit eligibility

---

# 29. Matchmaking Queue

Possible queue request:

`user_id`

`requested_gender`

`age_min`

`age_max`

`city_filter`

`distance_filter`

`photo_required`

`created_at`

`priority`

`coin_reservation`

Redis is recommended for active queue state.

PostgreSQL remains the permanent record.

---

# 30. Matchmaking Rules

The engine must never match:

- A user with themselves
- Users who blocked each other
- Banned users
- Unavailable users
- Users already in active exclusive chats

It should also consider:

- Gender preference
- Age preference
- City/distance where enabled
- Previous match history
- Queue waiting time
- Recent activity
- Risk/reputation score

---

# 31. Repeat Matching

Two users may match more than once.

This is allowed unless:

- One has blocked the other
- A configured cooldown prevents it

Recommended configuration:

`REPEAT_MATCH_COOLDOWN`

Examples:

- 1 hour
- 24 hours
- 7 days

The system may deprioritize previous partners instead of permanently excluding them.

---

# 32. Critical Chat Architecture

Three concepts must remain separate:

### User Pair

Represents the relationship between two internal users.

Used for:

- Previous match detection
- Block status
- Match count
- Last match
- Cooldown

### Chat Session

Represents one specific connection between two users.

### Chat Message

Represents one message belonging to exactly one Chat Session.

---

# 33. Every Match Creates a New Session

This is a strict requirement.

Example:

User A and User B match on September 5.

Create:

`Session #1001`

They disconnect.

They match again on September 7.

Create:

`Session #1468`

They match again later.

Create:

`Session #2104`

Never reopen `#1001`.

Each session remains independent.

---

# 34. Chat Session Fields

Recommended:

`id`

`user_a_id`

`user_b_id`

`status`

`match_type`

`requested_filters`

`started_at`

`ended_at`

`ended_by_user_id`

`end_reason`

`secure_mode`

`secure_mode_enabled_at`

`message_count`

`user_a_profile_snapshot_id`

`user_b_profile_snapshot_id`

`telegram_delete_status`

`created_at`

---

# 35. Session Statuses

Possible values:

`CREATED`

`ACTIVE`

`ENDED`

`FORCE_ENDED`

`EXPIRED`

A deleted Telegram conversation does not mean the database session is deleted.

---

# 36. Profile Snapshots Per Session

When a match starts, save the current public profile of both participants.

Example:

`chat_profile_snapshots`

Why?

User A may appear as:

`Alex, 24, Berlin`

during Session #1001.

Two months later they may change to:

`Sam, 25, Hamburg`.

The administrator reviewing the old session should be able to see:

**Profile at the time of chat**

and:

**Current profile**

---

# 37. Live Chat Relay

After matching:

> ✅ Match Found!
>
> You are now connected anonymously.

User A sends a message to the bot.

Backend:

1. Identifies User A's active session.
2. Stores the message.
3. Determines User B.
4. Sends/copies the content to User B.
5. Stores User B's Telegram delivery message ID.

Neither user directly receives the other's Telegram account.

---

# 38. Live Chat Supported Content

Configurable:

- Text
- Photo
- Voice
- Video
- Video note
- Sticker
- GIF
- Audio
- Documents

Potential identity-leaking content such as:

- Telegram contacts
- Exact GPS locations

should be disabled by default or require explicit warnings.

---

# 39. Active Chat Keyboard

Recommended:

`👤 Profile`

`🔒 Protected Chat`

`🗑 Chat Options`

`⛔ End Chat`

Additional inline actions:

`🚫 Block`

`⚠️ Report`

Menu/control messages must never accidentally be forwarded to the partner.

---

# 40. Chat Message Mapping

This is one of the most important database requirements.

Every message must store enough Telegram message IDs to later delete the message from both participants' Telegram histories.

Example:

Database message:

`chat_message_id = 7001`

Original message in User A's private bot chat:

`sender_chat_id = 111`

`sender_message_id = 402`

Relayed message shown to User B:

`recipient_chat_id = 222`

`recipient_message_id = 817`

The database message connects both copies.

---

# 41. Chat Message Table

Recommended:

`id`

`chat_session_id`

`sender_user_id`

`recipient_user_id`

`message_type`

`text`

`caption`

`telegram_file_id`

`telegram_file_unique_id`

`sender_chat_id`

`sender_message_id`

`recipient_chat_id`

`recipient_message_id`

`secure_delivery`

`created_at`

`sender_copy_deleted_at`

`recipient_copy_deleted_at`

`deletion_status`

`moderation_status`

---

# 42. Session Telegram Message Registry

In addition to normal chat messages, system messages belonging to a session may need to be tracked.

For example:

- Match found
- Partner profile message
- Secure Chat enabled message
- Chat ended notice

Recommended table:

`session_telegram_messages`

Fields:

`session_id`

`user_id`

`telegram_chat_id`

`telegram_message_id`

`message_role`

This makes session deletion more complete.

---

# 43. End Chat

Button:

`⛔ End Chat`

Confirmation:

> End this conversation?

Buttons:

`✅ End Chat`

`❌ Continue`

On confirmation:

`status = ENDED`

`ended_at = now`

`ended_by_user_id = X`

`end_reason = USER_ENDED`

Both users are released from the active-chat state.

---

# 44. After Chat Ends

Recommended screen:

> Chat ended.

Buttons:

`🔎 Find Another`

`🗑 Delete This Chat`

`🚫 Block User`

`⚠️ Report User`

`👤 View Profile`

`🏠 Main Menu`

The ended session remains in history.

---

# 45. Delete Individual Message

Inside an active/recent chat, a user can choose:

`🗑 Delete Message`

Intended behavior:

1. Identify exact `chat_message_id`.
2. Verify requester belongs to that session.
3. Find sender-side Telegram message.
4. Find recipient-side Telegram message.
5. Attempt deletion from both Telegram private chats.
6. Keep the backend record.
7. Record deletion results.

Telegram currently permits bots to delete incoming messages in private chats and their outgoing messages, subject to Telegram's documented deletion restrictions.

---

# 46. Delete Message for Both Users

User-facing action can be:

`🗑 Delete for Both`

Confirmation:

> Delete this message from both sides?

Buttons:

`✅ Delete`

`❌ Cancel`

On success:

> ✅ Message deleted from the Telegram conversation.

The internal database record remains archived.

---

# 47. Delete Entire Chat Session

Button:

`🗑 Delete This Chat`

This applies only to the selected:

`chat_session_id`

It does NOT mean:

"delete everything between these two users forever."

Example:

User A and User B have:

- Session #1001
- Session #1468
- Session #2104

Deleting `#1468` targets only messages mapped to `#1468`.

Sessions `#1001` and `#2104` remain untouched.

---

# 48. Telegram 48-Hour Deletion Limitation

Telegram's Bot API currently documents that a normal message can only be deleted if it was sent less than 48 hours ago.

Therefore, before full chat deletion, display:

> ⚠️ Telegram only allows the bot to delete messages that are still within Telegram's deletion time limit. Older messages may remain visible.

This limitation must be clearly communicated.

---

# 49. Telegram 100-Message Batch Limit

Telegram's `deleteMessages` method currently accepts between 1 and 100 message IDs in one request and follows the same deletion limitations as `deleteMessage`.

This is only an implementation detail.

Example:

Chat contains 347 eligible messages.

Process:

- Batch 1: 100
- Batch 2: 100
- Batch 3: 100
- Batch 4: 47

Continue until all relevant message IDs are attempted.

---

# 50. Full Session Deletion Algorithm

`User selects Delete This Chat`

→ resolve exact session

→ verify membership

→ lock deletion operation

→ load all Telegram message mappings belonging to session

→ separate messages by Telegram chat ID

→ remove invalid/duplicate IDs

→ split into batches of up to 100

→ call Telegram deletion for User A batches

→ call Telegram deletion for User B batches

→ retry appropriate transient errors

→ store per-message/per-batch results

→ update session deletion status

→ preserve database archive

→ notify requester of result

---

# 51. Session Deletion Results

Recommended statuses:

`NOT_REQUESTED`

`PROCESSING`

`FULLY_DELETED_FROM_TELEGRAM`

`PARTIALLY_DELETED_FROM_TELEGRAM`

`FAILED`

Example full success:

> ✅ This chat was deleted from both Telegram histories.

Example partial result:

> ✅ Available messages were deleted.
>
> ⚠️ Some older messages could not be removed because of Telegram's deletion limit.

---

# 52. Database Retention After Deletion

Never execute:

`DELETE FROM chat_messages`

merely because the user deleted their Telegram conversation.

Preserve:

- Session
- Messages
- Media references
- Participants
- Profile snapshots
- Reports
- Secure mode
- Deletion actions
- Telegram deletion results
- Moderation information

Authorized administrators can still review the archive.

---

# 53. Deletion Audit Table

Recommended:

`chat_deletion_events`

Fields:

`id`

`session_id`

`message_id nullable`

`requested_by_user_id`

`deletion_type`

`requested_at`

`user_a_result`

`user_b_result`

`completed_at`

`error_details`

Types:

`SINGLE_MESSAGE`

`FULL_SESSION`

`ADMIN_TELEGRAM_DELETE`

---

# 54. Difference Between End and Delete

These are separate operations.

### End Chat

Stops communication.

Old Telegram messages remain.

### Delete Chat

Attempts to remove Telegram-visible messages belonging to that specific session.

Database archive remains.

### Block User

Prevents future matching/communication according to block rules.

A user may perform all three.

---

# 55. Protected Chat

Inside an active session:

`🔒 Protected Chat`

The bot should use Telegram's protected-content functionality for newly relayed messages.

Telegram's Bot API provides `protect_content`, documented as protecting sent/copied/forwarded content from normal forwarding and saving.

Recommended user wording:

> 🔒 Protected Chat enabled.
>
> New messages will use Telegram content protection to restrict normal forwarding and saving.

---

# 56. Protected Chat Is Not End-to-End Encryption

Do not call this:

`End-to-End Encrypted`

because:

- User sends message to bot
- Backend receives it
- Backend stores it
- Backend relays it

The server therefore processes the content.

Correct name:

`Protected Chat`

or:

`Secure Mode`

---

# 57. Protected Chat Activation

Recommended flow:

User A selects:

`🔒 Enable Protected Chat`

User B receives:

> Your partner wants to enable Protected Chat.

Buttons:

`✅ Accept`

`❌ Decline`

If accepted:

`session.secure_mode = true`

Only future delivered messages need protected-content delivery.

If desired, product policy may alternatively allow unilateral activation, but mutual consent provides a clearer UX.

---

# 58. Protected Chat Scope

Secure/Protected mode belongs to the current session only.

Example:

Session #1001:

`secure_mode = true`

Users disconnect.

They match again:

Session #1468:

`secure_mode = false`

They must enable it again.

---

# 59. Location

Location is optional.

Telegram Reply Keyboard buttons can request the user's current location in private chats; Telegram sends the location when the user presses that button.

Example:

`📍 Share My Location`

Before requesting:

> Sharing location is optional. It may be used for your profile or matchmaking preferences.

---

# 60. Location Data

Recommended fields:

`user_id`

`latitude`

`longitude`

`accuracy/radius if available`

`shared_at`

`updated_at`

`consent_version`

`source`

---

# 61. Location Visibility

Three visibility levels:

### Administrator

May see exact stored coordinates when authorized.

### Profile Owner

Can see/manage their own saved location.

### Other Users

Should normally see only:

- City
- Approximate area
- Approximate distance

Never exact coordinates by default.

---

# 62. City

Users can:

- Enter city manually
- Optionally derive city from shared location

City and exact coordinates are separate fields.

A user does not need to share GPS location merely to enter a city.

---

# 63. Bot Last Activity

The system calculates:

`last_activity_at`

from the latest qualifying bot action.

Examples:

- Message sent
- Button pressed
- Match search started
- Profile edited
- Anonymous message sent
- Anonymous reply
- Chat message
- Menu opened

This represents:

**Last Activity in This Bot**

not Telegram account last-seen.

---

# 64. Last Activity Display

Owner/admin:

Exact timestamp.

Other users:

Privacy-friendly values such as:

- Online now
- Active recently
- Active today
- Active yesterday
- Active this week

Configurable privacy option:

`Show activity status: ON/OFF`

---

# 65. Coin System

Internal currency:

`🪙 Coins`

Every user has:

- Current balance
- Transaction history
- Lifetime earned
- Lifetime spent

Do not rely only on one mutable balance field.

Use a ledger.

---

# 66. Starting Coins

Configurable:

`STARTING_COINS`

Example:

`30`

On first legitimate registration:

`WELCOME_BONUS +30`

It can only be claimed once.

---

# 67. Profile Completion Rewards

Example:

Display name:

`+2`

Gender:

`+2`

Age:

`+2`

City:

`+3`

Bio:

`+3`

Photo:

`+5`

Optional location:

`+5`

Each reward is one-time.

Changing/removing/re-adding a field must not repeatedly generate rewards.

---

# 68. Reward Claims

Table:

`reward_claims`

Example:

`user_id`

`reward_type`

`claimed_at`

This prevents reward farming.

---

# 69. Referral System

Each user receives a referral token.

Example conceptually:

`https://t.me/Bot?start=ref_XYZ123`

Store:

- Referrer
- Referred user
- Registration time
- Qualification status
- Reward status

---

# 70. Referral Reward

Example:

Referrer:

`+10 coins`

New user:

`+5 coins`

Reward should be granted only after a qualification rule.

Examples:

- Accept Terms
- Complete basic profile
- Remain active
- Send first legitimate message

This reduces fake-account referral farming.

---

# 71. Coins Menu

Example:

> 🪙 Your Coins
>
> Balance: 84
>
> Lifetime Earned: 140
> Lifetime Spent: 56

Buttons:

`📜 Transaction History`

`🎁 Rewards`

`👥 Invite Friends`

`⬅️ Back`

---

# 72. Coin Ledger

Table:

`coin_transactions`

Fields:

`id`

`user_id`

`type`

`amount`

`balance_before`

`balance_after`

`related_entity_type`

`related_entity_id`

`metadata`

`created_at`

Types:

`WELCOME_BONUS`

`PROFILE_REWARD`

`REFERRAL_REWARD`

`DAILY_REWARD`

`MATCH_FEE`

`FILTER_FEE`

`ADMIN_CREDIT`

`ADMIN_DEBIT`

`REFUND`

`PROMOTION`

---

# 73. Possible Coin Costs

Configurable future monetization:

- Search specifically for female users
- Search specifically for male users
- Advanced age filter
- City filter
- Distance filter
- Priority matchmaking
- Profile boost
- Reconnect request

Basic product usability should still remain possible without excessive coin requirements.

---

# 74. Blocking in Matchmaking

Button:

`🚫 Block User`

Store:

`blocker_id`

`blocked_id`

`session_id`

`created_at`

`reason_optional`

Once blocked:

- Do not match the pair again
- Prevent direct anonymous-thread continuation if policy requires
- Hide unnecessary profile access

---

# 75. Reports

Users can report:

- Anonymous message
- Anonymous sender
- Chat participant
- Specific chat message
- Custom profile

Possible reasons:

- Spam
- Harassment
- Threat
- Scam
- Sexual content
- Fake profile
- Underage concern
- Hate/abuse
- Other

---

# 76. Report Table

`reports`

Fields:

`id`

`reporter_user_id`

`reported_user_id`

`source_type`

`session_id nullable`

`message_id nullable`

`anonymous_message_id nullable`

`reason`

`comment`

`status`

`assigned_admin_id`

`created_at`

`resolved_at`

`resolution`

---

# 77. Report Session Precision

Reports must point to the exact Chat Session.

If the same two people matched ten times, the administrator needs to know which one generated the complaint.

Never identify reports only by the pair of user IDs.

---

# 78. Moderation

Possible user statuses:

`ACTIVE`

`LIMITED`

`TEMP_BANNED`

`PERM_BANNED`

`DEACTIVATED`

Possible restrictions:

- Matchmaking disabled
- Anonymous sending disabled
- Media sending disabled
- Gender filter disabled
- Temporary cooldown
- Entire bot disabled

---

# 79. Warning System

Admins can issue warnings.

Store:

`warning_id`

`user_id`

`admin_id`

`reason`

`created_at`

`related_report_id`

`severity`

Repeated warnings can trigger automatic restrictions.

---

# 80. Anti-Spam

Recommended protections:

- Anonymous message rate limit
- Chat message flood control
- Match-search cooldown
- Duplicate message detection
- Referral fraud checks
- New-account media limits
- Report-based risk score
- Block-based risk score
- Temporary cooldowns
- Suspicious activity detection

---

# 81. Main Administrator Menu

Accessible only by authorized admin IDs.

Suggested Reply Keyboard:

`👥 Users`

`🔎 Search User`

`💬 Chats`

`💌 Anonymous Messages`

`⚠️ Reports`

`🚫 Moderation`

`🪙 Economy`

`📊 Statistics`

`📣 Broadcast`

`📤 Exports`

`⚙️ System`

`🧾 Audit Logs`

---

# 82. Admin User Search

Search by:

- Internal user ID
- Telegram ID
- Telegram username
- Custom profile name
- Anonymous token
- Referral token

Search results should clearly show which identifier matched.

---

# 83. Admin User Page

Example:

> 👤 USER #48291
>
> TELEGRAM
> ID: ...
> Username: ...
> Name: ...
>
> CUSTOM PROFILE
> Name: Alex
> Age: 24
> Gender: Male
> City: Berlin
>
> ACTIVITY
> Registered: ...
> Last Bot Activity: ...
>
> ECONOMY
> Coins: 84
>
> MODERATION
> Reports: 2
> Status: Active

Buttons:

`💬 Chats`

`💌 Anonymous`

`📍 Location`

`👤 Profiles`

`🪙 Coins`

`👥 Referrals`

`⚠️ Reports`

`🚫 Restrict`

`📝 Notes`

`📤 Export`

---

# 84. Admin Chat History

For a selected user:

> 💬 Chat Sessions
>
> #2104 — Sep 15 — 18 messages
>
> #1468 — Sep 7 — 129 messages
>
> #1001 — Sep 5 — 47 messages

Opening one shows that exact session only.

---

# 85. Admin Session Viewer

Display:

- Session ID
- User A
- User B
- Telegram identities
- Public profile snapshots
- Match type
- Start time
- End time
- End reason
- Protected Chat status
- Message count
- Deletion status
- Reports

Then paginate messages.

---

# 86. Admin Message Viewer

For each archived message:

- Sender
- Recipient
- Original content
- Media
- Timestamp
- Session ID
- Telegram delivery IDs
- Protected-delivery state
- Telegram deletion state
- Report status

Even if Telegram copies were deleted, the archived record remains available to authorized administrators.

---

# 87. Admin Anonymous Inbox Viewer

Admin can inspect:

- All anonymous messages received by user
- All anonymous messages sent by user
- Sender internal identity
- Recipient internal identity
- Link used
- Replies
- Media
- Reports
- Deletion state

Regular users cannot access those identities.

---

# 88. Admin Pair View

Optional useful screen:

> USER PAIR
>
> User #481 ↔ User #972
>
> First Match: ...
> Last Match: ...
> Sessions: 7
> Total Messages: 391
> Blocked: No
> Reports: 1

Buttons:

`📚 All Sessions`

`⚠️ Reports`

`🚫 Pair Block`

---

# 89. User Export

Main Admin can select:

`📤 Export User`

Recommended export package:

`user.json`

`telegram_identity_history.csv`

`profile.json`

`profile_history.csv`

`locations.csv`

`anonymous_messages.csv`

`anonymous_threads.csv`

`chat_sessions.csv`

`chat_messages.csv`

`coin_transactions.csv`

`referrals.csv`

`reports.csv`

`moderation.csv`

`admin_notes.csv`

---

# 90. Individual Session Export

Admin can:

`📤 Export This Session`

Include:

- Session metadata
- User identities
- Profile snapshots
- Full message transcript
- Media references
- Deleted-message indicators
- Secure-mode changes
- Reports
- End information

Possible formats:

- JSON
- TXT
- CSV
- ZIP package

---

# 91. Export All Chats Between Two Users

Optional:

`📤 Export Pair History`

Contains every session between User A and User B separately.

Do not merge all sessions into one logical chat.

---

# 92. Admin Notes

Private administrator notes.

Example:

> Multiple spam complaints in the last 7 days.

Notes never appear to users.

---

# 93. Admin Audit Log

Sensitive actions must be logged.

Examples:

- User searched
- Conversation viewed
- Exact location opened
- User export generated
- Chat exported
- Coins changed
- Ban applied
- Ban removed
- Admin role changed
- Broadcast started
- Configuration changed

Fields:

`admin_id`

`action`

`target_type`

`target_id`

`metadata`

`created_at`

---

# 94. Broadcast

Main Administrator can send announcements to:

- All users
- Recently active users
- Selected users
- Specific gender profile
- Specific city
- Custom segment

Show delivery statistics:

- Queued
- Sent
- Failed
- Bot blocked
- Invalid/deactivated account

---

# 95. Statistics

Telegram admin interface can display:

- Total users
- New today
- Active today
- Active 7 days
- Active 30 days
- Anonymous messages today
- Matches today
- Active chats
- Average search time
- Average chat duration
- Messages per session
- Reports today
- Block rate
- Referral registrations
- Coins issued
- Coins spent

---

# 96. User Settings

`⚙️ Settings`

Possible buttons:

`🔔 Notifications`

`👁 Privacy`

`💬 Chat Settings`

`💌 Anonymous Settings`

`🌐 Language`

`🚫 Blocked Users`

`📜 Privacy Information`

`🚪 Deactivate Account`

---

# 97. Anonymous Settings

Possible:

`Anonymous Messages: ON/OFF`

`Allow Photos: ON/OFF`

`Allow Voice: ON/OFF`

`Allow Replies: ON/OFF`

`Regenerate Link`

`Blocked Anonymous Senders`

---

# 98. Profile Privacy

Possible controls:

`Show Age`

`Show City`

`Show Photo`

`Show Activity`

`Show Interests`

Location coordinates must not be exposed to matched users through these basic profile settings.

---

# 99. Account Deactivation

When user deactivates:

- Disable anonymous links
- Remove from matchmaking
- End active session
- Disable non-essential notifications
- Mark account deactivated

Historical backend records remain according to disclosed retention policy.

---

# 100. Database Architecture

Recommended database:

**PostgreSQL**

for durable data.

**Redis**

for:

- Match queues
- Session locks
- Temporary state
- Rate limiting
- Cache
- Distributed locks

Optional:

**Object Storage**

for:

- Export files
- Archived media if needed
- Administrative attachments
- Backup artifacts

---

# 101. Recommended Core Tables

`users`

`user_identity_history`

`user_profiles`

`user_profile_history`

`user_locations`

`user_settings`

`anonymous_links`

`anonymous_messages`

`anonymous_threads`

`anonymous_thread_messages`

`matchmaking_requests`

`user_pairs`

`chat_sessions`

`chat_profile_snapshots`

`chat_messages`

`session_telegram_messages`

`chat_deletion_events`

`blocks`

`reports`

`moderation_actions`

`coin_transactions`

`reward_claims`

`referrals`

`admin_users`

`admin_roles`

`admin_permissions`

`admin_notes`

`admin_audit_logs`

`system_settings`

`feature_flags`

`activity_events`

`broadcasts`

`broadcast_deliveries`

---

# 102. User Pair Table

Recommended:

`user_low_id`

`user_high_id`

`first_match_at`

`last_match_at`

`total_sessions`

`total_messages`

`last_session_id`

`blocked`

Use normalized ordering:

lower user ID first.

This gives one pair record regardless of direction.

---

# 103. State Machine

The bot must use explicit user states.

Examples:

`MAIN_MENU`

`EDIT_PROFILE_NAME`

`EDIT_PROFILE_CITY`

`WAITING_LOCATION`

`ANONYMOUS_COMPOSE`

`ANONYMOUS_REPLY`

`MATCH_SEARCH`

`ACTIVE_CHAT`

`REPORT_REASON`

`ADMIN_SEARCH`

`ADMIN_BROADCAST`

Never infer important state only from the last message text.

---

# 104. Incoming Message Routing

Recommended priority:

1. Admin-only operations
2. Report flow
3. Profile editor
4. Anonymous compose/reply
5. Active live-chat session
6. Matchmaking flow
7. Main menu
8. Fallback handler

This prevents accidental forwarding.

---

# 105. Matchmaking Concurrency

Matching must be atomic.

Two servers must never simultaneously connect one person to two different matches.

Use:

- Redis atomic operations
- Distributed locks
- Database transactions

Before creating a session, verify both users remain:

`SEARCHING`

and:

`AVAILABLE`

---

# 106. Coin Concurrency

Coin operations must also be transactional.

For any spend:

1. Lock/current-balance validation
2. Create ledger transaction
3. Update cached balance
4. Commit

Never:

`read balance → subtract later`

without protection against concurrency.

---

# 107. Referral Idempotency

One referred user should not trigger duplicate rewards because Telegram delivered or the application retried an update.

Use unique constraints.

Example:

`UNIQUE(referred_user_id)`

where appropriate.

---

# 108. Update Idempotency

Telegram updates should be processed idempotently.

Critical events that must never duplicate:

- User registration reward
- Referral reward
- Profile reward
- Match creation
- Chat message archive
- Coin spend
- Report creation
- Deletion request

---

# 109. Media Storage

For Telegram media, store at minimum:

- `file_id`
- `file_unique_id`
- Media type
- Caption
- Metadata

If long-term independent retention of media is required, the service should implement its own appropriately secured media archive rather than depending only on a transient application state.

---

# 110. Security

Required controls:

- Bot token stored in secrets/environment
- No credentials committed to repository
- TLS
- Database access restrictions
- Redis authentication/network restriction
- Encrypted backups
- Role-based admin permissions
- Admin Telegram ID allowlist
- Callback authorization checks
- Input validation
- Rate limiting
- Secure random link tokens
- Export authorization
- Audit logs
- Production/staging separation

---

# 111. Callback Security

Never trust inline callback data just because a button contains an object ID.

Example malicious user might manually submit:

`admin_user_123`

Every handler must verify:

- Caller identity
- Permission
- Ownership
- Session membership

before performing an action.

---

# 112. Admin Security

Sensitive actions may optionally require an additional confirmation.

Examples:

- Full export
- Permanent ban
- Exact location access
- Add/remove admin
- Mass broadcast
- Large coin adjustment

---

# 113. Logging

Application logs should contain:

- Errors
- API failures
- Match events
- Queue failures
- Deletion failures
- Admin actions
- Worker problems

Avoid unnecessarily duplicating private conversation content into generic logs.

Conversation content belongs in the controlled archive database.

---

# 114. Backups

Recommended:

- Automated PostgreSQL backup
- Encrypted backups
- Regular restoration test
- Restricted backup access
- Backup monitoring
- Disaster recovery documentation

---

# 115. Monitoring

Monitor:

- Bot uptime
- Telegram API failures
- PostgreSQL
- Redis
- Message queue
- Match queue size
- Match wait time
- Delivery latency
- Error rate
- Disk/storage
- Backup status
- Export worker
- Abuse-rate anomalies

---

# 116. System Configuration

Business settings should be database-backed.

Examples:

`STARTING_COINS`

`REFERRAL_REWARD`

`PROFILE_PHOTO_REWARD`

`GENDER_MATCH_PRICE`

`REPEAT_MATCH_COOLDOWN`

`MATCH_TIMEOUT`

`MAX_ANON_MESSAGES_PER_MINUTE`

`MAX_CHAT_MESSAGES_PER_MINUTE`

`ALLOW_PHOTOS`

`ALLOW_VOICE`

`ALLOW_PROTECTED_CHAT`

`ALLOW_LOCATION_MATCHING`

`MAINTENANCE_MODE`

---

# 117. Feature Flags

Examples:

`location_matching_enabled`

`protected_chat_enabled`

`daily_rewards_enabled`

`advanced_filters_enabled`

`profile_interests_enabled`

`premium_matching_enabled`

`multiple_anon_links_enabled`

Allow gradual rollout without large deployments.

---

# 118. Maintenance Mode

Main Administrator can enable:

`🛠 Maintenance Mode`

Users receive:

> The bot is temporarily under maintenance.

Administrators retain access.

---

# 119. Localization

All messages and button names should use translation keys.

Example:

`menu.anonymous_messages`

`menu.chat`

`chat.match_found`

`chat.delete_warning`

Do not hard-code Persian text throughout business logic.

Initial language may be Persian, but future languages can be added easily.

---

# 120. Persian UI Considerations

Because Persian is RTL:

- Test button labels
- Keep messages concise
- Put IDs on isolated lines
- Test mixed English/Persian text
- Test dates/numbers
- Test Android/iOS/Desktop Telegram clients

---

# 121. Age Policy

Anonymous matchmaking has elevated abuse risk.

The product owner should define an explicit age policy.

If intended for adults, enforce an 18+ rule during onboarding/profile creation and state it clearly in the Terms.

If minors are allowed, substantially stronger matching and moderation restrictions are necessary.

---

# 122. User Presence

Internal states:

`OFFLINE`

`ACTIVE`

`SEARCHING`

`CHATTING`

These represent activity inside this product only.

They must not be presented as Telegram's actual account presence.

---

# 123. Match Search UX

Example:

> 🔎 Searching...
>
> Preference: Female

Buttons:

`❌ Stop`

`⚙️ Filters`

If no candidate:

> No compatible user is currently available.

Buttons:

`🔄 Keep Searching`

`🎲 Random`

`⚙️ Change Filters`

`❌ Cancel`

---

# 124. Match Creation Flow

1. Candidate selected.
2. Both candidates atomically reserved.
3. Re-check blocks.
4. Re-check status.
5. Re-check active session.
6. Create new `chat_session`.
7. Create profile snapshots.
8. Remove from queues.
9. Set users to `CHATTING`.
10. Send match notifications.
11. Begin relay.

---

# 125. Match Cancellation Race Condition

Possible case:

User A presses Cancel at exactly the same time the server matches them.

Resolution must be deterministic.

Use queue/version/state locks.

Never create an orphan active chat where one participant thinks they cancelled.

---

# 126. User Blocks the Bot

If Telegram reports that the bot cannot send to a user:

- Mark delivery failure
- Update reachability
- Remove from queue
- End active chat if required
- Notify partner appropriately
- Preserve history

---

# 127. Bot Restart

Restart must not destroy:

- Active sessions
- Coin balances
- Queue intent
- Reports
- Referral state
- Anonymous threads

Critical state must not exist only in application memory.

---

# 128. Redis Failure

Redis can be reconstructed where possible from PostgreSQL.

Permanent records should remain in PostgreSQL.

Active queue loss should fail safely rather than create duplicate matches.

---

# 129. User Deletes Telegram Account

When detected through future interactions/update information:

- Preserve historical internal ID
- Mark Telegram account deleted/unavailable where appropriate
- Prevent new matches
- Preserve moderation history

---

# 130. Anonymous Link Regeneration

User can select:

`🔄 Regenerate Link`

Options:

`Revoke Old Link`

or future feature:

`Create Additional Link`

Revoked token must stop resolving to a message compose target.

---

# 131. Link Abuse Protection

Recommended:

- Per-sender limits
- Per-recipient limits
- Media restriction for new accounts
- Duplicate content detection
- Risk scoring
- Cooldown
- Block support
- Report support

---

# 132. Profile Completion

Example weighted score:

Name: 15%

Gender: 15%

Age: 15%

City: 15%

Photo: 20%

Bio: 10%

Interests: 10%

Display:

> Profile Completion: 80%

Rewards can be connected to milestones.

---

# 133. Profile Validation

Name:

- Minimum/maximum length

Age:

- Allowed range

Bio:

- Maximum characters

Photo:

- Valid Telegram photo
- Moderation support

City:

- Normalized input

Gender:

- Product-defined allowed values

---

# 134. Notifications

Types:

- New anonymous message
- Anonymous reply
- Match found
- Referral reward
- Coin reward
- Warning
- System notice
- Broadcast

Users can disable non-critical notifications.

---

# 135. Analytics Events

Examples:

`user_registered`

`terms_accepted`

`profile_updated`

`profile_completed`

`anonymous_link_opened`

`anonymous_message_sent`

`anonymous_reply_sent`

`match_search_started`

`match_search_cancelled`

`match_created`

`chat_message_sent`

`protected_chat_enabled`

`chat_ended`

`message_deleted`

`session_delete_requested`

`user_blocked`

`report_created`

`coin_earned`

`coin_spent`

`referral_completed`

---

# 136. Recommended Technical Architecture

High-level:

**Telegram Bot API**

↓

**Bot Update Layer**

↓

**Command / Callback Router**

↓

**Application Services**

- User Service
- Profile Service
- Anonymous Inbox Service
- Matchmaking Service
- Chat Relay Service
- Deletion Service
- Coin Service
- Referral Service
- Moderation Service
- Admin Service
- Export Service
- Notification Service

↓

**PostgreSQL + Redis + Queue + Optional Object Storage**

---

# 137. Background Workers

Recommended worker jobs:

- Broadcast delivery
- Large exports
- Telegram deletion batches
- Retryable message delivery
- Statistics aggregation
- Moderation jobs
- Referral qualification
- Cleanup of expired queue/state objects

The user-facing bot should not block on heavy tasks unnecessarily.

---

# 138. Database Indexes

Important indexes:

`users.telegram_user_id`

`users.telegram_username`

`anonymous_links.token`

`chat_sessions.user_a_id`

`chat_sessions.user_b_id`

`chat_sessions.status`

`chat_messages.chat_session_id`

`chat_messages.created_at`

`reports.status`

`coin_transactions.user_id`

`referrals.referrer_id`

`activity_events.user_id`

---

# 139. Pagination

Never load thousands of messages into one Telegram response.

Use pagination for:

- Inbox
- Chat sessions
- Messages
- Reports
- Coin history
- Referrals
- Admin user search

---

# 140. Main Anonymous-Link Journey

1. User registers.
2. Personal anonymous token created.
3. User copies link.
4. Shares link.
5. Visitor opens bot through link.
6. Bot resolves destination.
7. No destination profile shown.
8. Visitor sends message.
9. Backend stores identity internally.
10. Recipient receives anonymous content.
11. Recipient replies anonymously.
12. Sender receives reply.
13. Either side can report/block according to feature rules.
14. Recipient can remove message from visible inbox.
15. Archive remains internally.

---

# 141. Main Matchmaking Journey

1. User registers.
2. Creates custom profile.
3. Opens Anonymous Chat.
4. Chooses Female/Male/Random.
5. Bot validates eligibility.
6. User enters queue.
7. Matching engine selects candidate.
8. New session is created.
9. Profile snapshots created.
10. Users are connected.
11. Messages relay through bot.
12. Users may view custom profiles.
13. Protected Chat can be enabled.
14. User may delete individual messages.
15. User may end session.
16. User may delete that session's Telegram history.
17. User may block/report.
18. User searches again.
19. If same two users match later, create another new session.

---

# 142. Main Admin Journey

1. Open Admin Panel.
2. Search user.
3. Open internal user record.
4. Review Telegram identity.
5. Review custom profile.
6. Check location/activity.
7. Open anonymous message history.
8. Open match sessions.
9. Select specific session.
10. Review full archive.
11. Review deletion indicators.
12. Review reports.
13. Add admin note.
14. Apply moderation if needed.
15. Export records if needed.
16. Audit entry records sensitive actions.

---

# 143. Recommended MVP — Phase 1

### Foundation

- Registration
- Terms/privacy acceptance
- Telegram identity
- Last bot activity
- Main menus

### Anonymous Inbox

- Unique anonymous link
- Text messages
- Inbox
- Anonymous reply
- Delete/hide
- Block
- Report

### Profile

- Name
- Gender
- Age
- City
- Photo
- Bio

### Matchmaking

- Female
- Male
- Random
- Queue
- New session per match
- Text chat
- Profile view
- End chat
- Block
- Report

### Deletion

- Individual message delete
- Full specific-session delete
- Two-sided Telegram deletion
- Batch deletion
- Database retention
- 48-hour warning

### Coins

- Starting coins
- Profile rewards
- Referrals
- Ledger

### Administration

- User search
- User page
- Anonymous messages
- Session viewer
- Messages
- Reports
- Ban/restrict
- Coins
- Export
- Audit log

---

# 144. Phase 2

- Protected Chat
- Photo/voice/video chat
- Location
- Distance matching
- Advanced filters
- Profile interests
- Profile history
- Advanced reports
- Multiple moderators
- Daily rewards
- Better fraud detection

---

# 145. Phase 3

Potential:

- Priority matching
- Profile boosts
- Reconnect request
- Multiple anonymous links
- Premium features
- Telegram Stars
- Recommendation scoring
- Advanced analytics
- Automated moderation assistance
- Reputation system

---

# 146. Critical Acceptance Criteria

The system is not production-ready until all of these are true:

1. Telegram identity is never accidentally exposed between anonymous users.

2. Custom chat identity and Telegram identity remain separate.

3. Anonymous Link Mode does not show the destination user's matchmaking profile.

4. Every anonymous message is associated internally with sender and recipient when the sender is an identified bot user.

5. Female, Male and Random matchmaking work.

6. Every successful match creates a brand-new Chat Session.

7. An ended Chat Session is never reopened.

8. The same two users may have multiple independent sessions.

9. Every live-chat message belongs to exactly one session.

10. Telegram message IDs are mapped to the database message/session.

11. Individual message deletion targets both participants' Telegram copies.

12. Full chat deletion only targets the selected session.

13. Full chat deletion processes more than 100 messages through multiple Telegram batches.

14. The user sees the Telegram deletion-time limitation before full deletion.

15. Deleting Telegram messages does not destroy administrative database records.

16. Administrator can inspect a deleted-from-Telegram session in the archive.

17. Protected Chat uses Telegram content protection rather than claiming E2E encryption.

18. Location is requested only through a voluntary user action.

19. Exact GPS information is not automatically shown to matched users.

20. Last activity is based on bot interaction rather than claimed Telegram last-seen.

21. Blocked users cannot be matched again while the block remains active.

22. Reports identify a specific session/message where applicable.

23. Profile rewards cannot be repeatedly farmed by editing fields.

24. Referral rewards are idempotent and protected against basic fraud.

25. Coin operations use a transaction ledger.

26. Administrator permissions are checked server-side for every action.

27. Exports are restricted and audited.

28. Bot restart does not corrupt active records or coin balances.

29. Match creation is concurrency-safe.

30. All sensitive administrative operations are auditable.

---

# 147. Final Conceptual Model

The final platform should be understood as five connected systems.

## A. Internal Identity System

Knows who the Telegram user is internally.

## B. Anonymous Inbox System

Allows anyone to use a personal link to send messages without seeing the recipient's profile.

## C. Anonymous Matchmaking System

Uses a custom user-created profile to connect people.

## D. Session-Based Chat System

Every Match creates an independent Chat Session containing its own messages, profiles, deletion state and moderation data.

## E. Administration & Archive System

Maintains complete authorized access to users, anonymous messages, sessions, archived conversations, profile data, reports, economy and moderation information.

---

# 148. Final Data-Visibility Matrix

### Telegram User A sees about User B in Anonymous Link Mode

Nothing by default.

No profile is shown.

### Anonymous Message Recipient sees about Sender

Anonymous content only.

No Telegram identity.

### Matched User sees about Partner

Only permitted custom profile information.

### Profile Owner

Sees and edits their own custom profile.

### Main Administrator

Can see:

- Internal Telegram identity
- Custom identity
- User activity
- Voluntarily shared location
- Anonymous messages
- Chat sessions
- Archived messages
- Profile snapshots
- Deletion events
- Reports
- Blocks
- Coins
- Referrals
- Moderation history

---

# 149. Final Deletion Model

The product has three distinct meanings of deletion.

### Delete Anonymous Inbox Item

Remove the message from that user's visible anonymous inbox / Telegram presentation where possible.

Backend archive remains.

### Delete Individual Live-Chat Message

Attempt to delete the message from both participants' Telegram bot histories.

Backend archive remains.

### Delete Chat Session

Attempt to delete all Telegram message IDs belonging specifically to that Chat Session from both users.

Use multiple deletion batches if necessary.

Older messages that Telegram no longer permits the bot to delete may remain in Telegram.

Backend Session and Message archive remains.

---

# 150. Final Session Rule

The most important chat-history rule is:

> A Chat Session represents one continuous Match from connection until disconnection.

If two users disconnect and later match again:

> Create a new Chat Session.

Never combine old and new conversations merely because the participants are the same.

All:

- History
- Deletion
- Reports
- Exports
- Profile snapshots
- Secure-mode state
- Statistics

must be session-based.

---

# 151. Final Product Principle

The bot should feel extremely simple to the user:

**Buttons, messages and straightforward Telegram interactions.**

Behind that simple interface, the backend should maintain a robust structure for:

- Identity separation
- Session tracking
- Telegram message mapping
- Data retention
- Privacy controls
- Matchmaking
- Coins
- Referrals
- Moderation
- Administrative investigation
- Export
- Security
- Auditability

This provides a simple Telegram experience while maintaining the technical structure required for a large anonymous communication platform.